export interface FileFormat {
  /** Format description (long name) for displaying to the user. */
  name: string;
  /** Short, "formal" name for displaying to the user. */
  format: string;
  /** File extension. */
  extension: string;
  /** MIME type. */
  mime: string;
  /** Whether conversion **from** this format is supported. */
  from: boolean;
  /** Whether conversion **to** this format is supported. */
  to: boolean;
  /** Format identifier for the handler's internal reference. */
  internal: string;
  /** Category for UI grouping */
  category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
}

export interface FileData {
  /** File name with extension. */
  name: string;
  /**
   * File contents in bytes.
   */
  readonly bytes: Uint8Array;
}

/**
 * Common interface for converting between file formats.
 */
export interface FormatHandler {
  /** Name of the tool being wrapped (e.g. "FFmpeg"). */
  name: string;
  /** List of supported input/output formats. */
  supportedFormats?: FileFormat[];
  /** Whether the handler is ready for use. */
  ready: boolean;
  /** Initializes the handler if necessary. */
  init: () => Promise<void>;
  /** Performs the actual file conversion. */
  doConvert: (
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat,
    args?: string[]
  ) => Promise<FileData[]>;
}

export interface ConversionProgress {
  stage: 'initializing' | 'converting' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

export interface ConversionResult {
  success: boolean;
  message: string;
  path?: string[];
  files?: FileData[];
}
