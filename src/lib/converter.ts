import type { FileData, FileFormat, FormatHandler, ConversionProgress, ConversionResult } from './types';
import { normalizeMimeType, getCategoryFromMime } from './utils';
import CanvasToBlobHandler from './handlers/canvasToBlob';
import RenameHandler from './handlers/rename';

// All available handlers
const handlerClasses = [
  CanvasToBlobHandler,
  RenameHandler,
];

let handlers: FormatHandler[] = [];
let allFormats: FileFormat[] = [];
let initialized = false;

export type ProgressCallback = (progress: ConversionProgress) => void;

/**
 * Initialize all conversion handlers
 */
export async function initializeConverter(
  onProgress?: ProgressCallback
): Promise<FileFormat[]> {
  if (initialized && allFormats.length > 0) {
    return allFormats;
  }

  onProgress?.({
    stage: 'initializing',
    progress: 0,
    message: 'Loading conversion tools...',
  });

  handlers = [];
  allFormats = [];

  for (let i = 0; i < handlerClasses.length; i++) {
    try {
      const HandlerClass = handlerClasses[i];
      const handler = new HandlerClass();
      
      onProgress?.({
        stage: 'initializing',
        progress: Math.round(((i + 0.5) / handlerClasses.length) * 100),
        message: `Initializing ${handler.name}...`,
      });

      await handler.init();
      handlers.push(handler);

      // Collect formats from this handler
      if (handler.supportedFormats) {
        for (const format of handler.supportedFormats) {
          // Deduplicate by mime + format combo
          const exists = allFormats.some(
            (f) => f.mime === format.mime && f.format === format.format
          );
          if (!exists) {
            allFormats.push({
              ...format,
              category: format.category || getCategoryFromMime(format.mime),
            });
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to initialize handler:`, e);
    }
  }

  // Sort formats by category and name
  allFormats.sort((a, b) => {
    if (a.category !== b.category) {
      const order = ['image', 'video', 'audio', 'document', 'archive', 'other'];
      return order.indexOf(a.category) - order.indexOf(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  initialized = true;

  onProgress?.({
    stage: 'initializing',
    progress: 100,
    message: `Loaded ${allFormats.length} formats`,
  });

  return allFormats;
}

/**
 * Get all available formats
 */
export function getFormats(): FileFormat[] {
  return allFormats;
}

/**
 * Get formats that support input (from)
 */
export function getInputFormats(): FileFormat[] {
  return allFormats.filter((f) => f.from);
}

/**
 * Get formats that support output (to)
 */
export function getOutputFormats(): FileFormat[] {
  return allFormats.filter((f) => f.to);
}

/**
 * Find format by mime type
 */
export function findFormatByMime(mime: string): FileFormat | undefined {
  const normalizedMime = normalizeMimeType(mime);
  return allFormats.find((f) => f.mime === normalizedMime);
}

/**
 * Find a handler that can convert from inputFormat to outputFormat
 */
function findHandler(
  inputFormat: FileFormat,
  outputFormat: FileFormat
): FormatHandler | undefined {
  return handlers.find((handler) => {
    if (!handler.supportedFormats || !handler.ready) return false;
    
    const canInput = handler.supportedFormats.some(
      (f) => f.mime === inputFormat.mime && f.from
    );
    const canOutput = handler.supportedFormats.some(
      (f) => f.mime === outputFormat.mime && f.to
    );
    
    return canInput && canOutput;
  });
}

/**
 * Find a conversion path (possibly through intermediate formats)
 */
interface ConversionPath {
  steps: Array<{
    handler: FormatHandler;
    inputFormat: FileFormat;
    outputFormat: FileFormat;
  }>;
}

function findConversionPath(
  inputFormat: FileFormat,
  outputFormat: FileFormat,
  maxDepth: number = 3
): ConversionPath | null {
  // Direct conversion
  const directHandler = findHandler(inputFormat, outputFormat);
  if (directHandler) {
    return {
      steps: [
        {
          handler: directHandler,
          inputFormat,
          outputFormat,
        },
      ],
    };
  }

  // Try to find intermediate formats (BFS)
  if (maxDepth <= 1) return null;

  const visited = new Set<string>();
  const queue: Array<{
    format: FileFormat;
    path: ConversionPath['steps'];
  }> = [];

  // Find all formats we can convert the input to
  for (const handler of handlers) {
    if (!handler.supportedFormats || !handler.ready) continue;
    
    const canInput = handler.supportedFormats.some(
      (f) => f.mime === inputFormat.mime && f.from
    );
    if (!canInput) continue;

    for (const format of handler.supportedFormats) {
      if (!format.to || format.mime === inputFormat.mime) continue;
      if (visited.has(format.mime)) continue;
      
      visited.add(format.mime);
      queue.push({
        format,
        path: [{ handler, inputFormat, outputFormat: format }],
      });
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.path.length >= maxDepth) continue;

    // Check if we can reach the output from current format
    const handlerToOutput = findHandler(current.format, outputFormat);
    if (handlerToOutput) {
      return {
        steps: [
          ...current.path,
          {
            handler: handlerToOutput,
            inputFormat: current.format,
            outputFormat,
          },
        ],
      };
    }

    // Add more intermediate steps
    for (const handler of handlers) {
      if (!handler.supportedFormats || !handler.ready) continue;
      
      const canInput = handler.supportedFormats.some(
        (f) => f.mime === current.format.mime && f.from
      );
      if (!canInput) continue;

      for (const format of handler.supportedFormats) {
        if (!format.to || visited.has(format.mime)) continue;
        
        visited.add(format.mime);
        queue.push({
          format,
          path: [
            ...current.path,
            { handler, inputFormat: current.format, outputFormat: format },
          ],
        });
      }
    }
  }

  return null;
}

/**
 * Convert files from one format to another
 */
export async function convert(
  files: File[],
  inputFormat: FileFormat,
  outputFormat: FileFormat,
  onProgress?: ProgressCallback
): Promise<ConversionResult> {
  if (!initialized) {
    await initializeConverter(onProgress);
  }

  onProgress?.({
    stage: 'converting',
    progress: 0,
    message: 'Finding conversion route...',
  });

  // Same format - just return the files
  if (inputFormat.mime === outputFormat.mime) {
    const fileData: FileData[] = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      fileData.push({
        name: file.name,
        bytes: new Uint8Array(buffer),
      });
    }
    return {
      success: true,
      message: 'Files are already in the target format.',
      path: [inputFormat.format.toUpperCase()],
      files: fileData,
    };
  }

  // Find conversion path
  const path = findConversionPath(inputFormat, outputFormat);
  if (!path) {
    return {
      success: false,
      message: `No conversion path found from ${inputFormat.format.toUpperCase()} to ${outputFormat.format.toUpperCase()}. Try a different output format.`,
    };
  }

  onProgress?.({
    stage: 'converting',
    progress: 10,
    message: `Converting: ${path.steps.map((s) => s.outputFormat.format.toUpperCase()).join(' → ')}`,
  });

  // Load input files
  let currentFiles: FileData[] = [];
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    currentFiles.push({
      name: file.name,
      bytes: new Uint8Array(buffer),
    });
  }

  // Execute each conversion step
  const pathFormats = [inputFormat.format.toUpperCase()];
  
  for (let i = 0; i < path.steps.length; i++) {
    const step = path.steps[i];
    const progress = 10 + Math.round(((i + 1) / path.steps.length) * 80);
    
    onProgress?.({
      stage: 'converting',
      progress,
      message: `Converting to ${step.outputFormat.format.toUpperCase()}...`,
    });

    try {
      // Find the handler's specific format objects
      const handlerInputFormat = step.handler.supportedFormats?.find(
        (f) => f.mime === step.inputFormat.mime && f.from
      );
      const handlerOutputFormat = step.handler.supportedFormats?.find(
        (f) => f.mime === step.outputFormat.mime && f.to
      );

      if (!handlerInputFormat || !handlerOutputFormat) {
        throw new Error('Format not supported by handler');
      }

      currentFiles = await step.handler.doConvert(
        currentFiles,
        handlerInputFormat,
        handlerOutputFormat
      );

      pathFormats.push(step.outputFormat.format.toUpperCase());
    } catch (e) {
      console.error('Conversion error:', e);
      return {
        success: false,
        message: `Conversion failed at step ${i + 1}: ${e instanceof Error ? e.message : String(e)}`,
        path: pathFormats,
      };
    }
  }

  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: 'Conversion complete!',
  });

  return {
    success: true,
    message: `Successfully converted to ${outputFormat.format.toUpperCase()}`,
    path: pathFormats,
    files: currentFiles,
  };
}
