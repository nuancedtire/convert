import type { FileData, FileFormat, FormatHandler } from '../types';
import { getCategoryFromMime } from '../utils';

// We'll dynamically import to avoid SSR issues
let MagickModule: typeof import('@imagemagick/magick-wasm') | null = null;

class ImageMagickHandler implements FormatHandler {
  public name = 'ImageMagick';
  public supportedFormats: FileFormat[] = [];
  public ready = false;

  async init() {
    try {
      // Dynamic import for browser only
      if (typeof window === 'undefined') {
        console.warn('ImageMagick: Skipping init on server');
        return;
      }

      MagickModule = await import('@imagemagick/magick-wasm');
      const { initializeImageMagick, Magick } = MagickModule;

      // Fetch WASM from public directory
      const wasmLocation = `${import.meta.env.BASE_URL}wasm/magick.wasm`;
      const wasmBytes = await fetch(wasmLocation).then(r => r.arrayBuffer());

      await initializeImageMagick(new Uint8Array(wasmBytes));

      // Build supported formats from Magick's capabilities
      const mimeMap: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        bmp: 'image/bmp',
        ico: 'image/x-icon',
        tiff: 'image/tiff',
        tif: 'image/tiff',
        pdf: 'application/pdf',
        svg: 'image/svg+xml',
        heic: 'image/heic',
        heif: 'image/heif',
        avif: 'image/avif',
        psd: 'image/vnd.adobe.photoshop',
        xcf: 'image/x-xcf',
        raw: 'image/x-raw',
        cr2: 'image/x-canon-cr2',
        nef: 'image/x-nikon-nef',
        eps: 'application/postscript',
        ps: 'application/postscript',
        ai: 'application/postscript',
      };

      for (const format of Magick.supportedFormats) {
        const formatName = format.format.toLowerCase();
        if (formatName === 'apng') continue;

        const mimeType = format.mimeType || mimeMap[formatName];
        if (
          !mimeType ||
          mimeType.startsWith('text/') ||
          mimeType.startsWith('video/') ||
          mimeType === 'application/json'
        ) {
          continue;
        }

        // Check if we already have this format
        const exists = this.supportedFormats.some(
          (f) => f.format === formatName && f.mime === mimeType
        );
        if (exists) continue;

        this.supportedFormats.push({
          name: format.description,
          format: formatName,
          extension: formatName,
          mime: mimeType,
          from: format.supportsReading,
          to: format.supportsWriting,
          internal: format.format,
          category: getCategoryFromMime(mimeType),
        });
      }

      // Prioritize common formats
      const prioritize = ['png', 'jpeg', 'jpg', 'gif', 'webp', 'pdf', 'svg', 'bmp', 'tiff'];
      this.supportedFormats.sort((a, b) => {
        const priorityA = prioritize.indexOf(a.format);
        const priorityB = prioritize.indexOf(b.format);
        if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
        if (priorityA !== -1) return -1;
        if (priorityB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });

      this.ready = true;
      console.log(`ImageMagick initialized with ${this.supportedFormats.length} formats`);
    } catch (e) {
      console.error('Failed to initialize ImageMagick:', e);
      this.ready = false;
    }
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    if (!MagickModule || !this.ready) {
      throw new Error('ImageMagick not initialized');
    }

    const { MagickFormat, MagickImageCollection, MagickReadSettings } = MagickModule;

    const inputMagickFormat = inputFormat.internal as keyof typeof MagickFormat;
    const outputMagickFormat = outputFormat.internal as keyof typeof MagickFormat;

    const inputSettings = new MagickReadSettings();
    inputSettings.format = MagickFormat[inputMagickFormat];

    const bytes: Uint8Array = await new Promise((resolve, reject) => {
      try {
        MagickImageCollection.use((outputCollection) => {
          for (const inputFile of inputFiles) {
            MagickImageCollection.use((fileCollection) => {
              fileCollection.read(inputFile.bytes, inputSettings);
              while (fileCollection.length > 0) {
                const image = fileCollection.shift();
                if (!image) break;
                outputCollection.push(image);
              }
            });
          }
          outputCollection.write(MagickFormat[outputMagickFormat], (data) => {
            resolve(new Uint8Array(data));
          });
        });
      } catch (e) {
        reject(e);
      }
    });

    const baseName = inputFiles[0].name.replace(/\.[^/.]+$/, '');
    const name = `${baseName}.${outputFormat.extension}`;
    return [{ bytes, name }];
  }
}

export default ImageMagickHandler;
