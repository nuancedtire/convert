import type { FileData, FileFormat, FormatHandler } from '../types';

class CanvasToBlobHandler implements FormatHandler {
  public name = 'canvasToBlob';
  
  public supportedFormats: FileFormat[] = [
    {
      name: 'Portable Network Graphics',
      format: 'png',
      extension: 'png',
      mime: 'image/png',
      from: true,
      to: true,
      internal: 'png',
      category: 'image',
    },
    {
      name: 'JPEG Image',
      format: 'jpeg',
      extension: 'jpg',
      mime: 'image/jpeg',
      from: true,
      to: true,
      internal: 'jpeg',
      category: 'image',
    },
    {
      name: 'WebP Image',
      format: 'webp',
      extension: 'webp',
      mime: 'image/webp',
      from: true,
      to: true,
      internal: 'webp',
      category: 'image',
    },
    {
      name: 'GIF Animation',
      format: 'gif',
      extension: 'gif',
      mime: 'image/gif',
      from: true,
      to: false,
      internal: 'gif',
      category: 'image',
    },
    {
      name: 'SVG Vector',
      format: 'svg',
      extension: 'svg',
      mime: 'image/svg+xml',
      from: true,
      to: false,
      internal: 'svg',
      category: 'image',
    },
    {
      name: 'BMP Bitmap',
      format: 'bmp',
      extension: 'bmp',
      mime: 'image/bmp',
      from: true,
      to: false,
      internal: 'bmp',
      category: 'image',
    },
    {
      name: 'ICO Icon',
      format: 'ico',
      extension: 'ico',
      mime: 'image/x-icon',
      from: true,
      to: false,
      internal: 'ico',
      category: 'image',
    },
    {
      name: 'Plain Text',
      format: 'text',
      extension: 'txt',
      mime: 'text/plain',
      from: true,
      to: false,
      internal: 'text',
      category: 'document',
    },
  ];

  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  public ready = false;

  async init(): Promise<void> {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d') || undefined;
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Handler not initialized.');
    }

    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      if (inputFormat.mime === 'text/plain') {
        // Convert text to image
        const font = '48px sans-serif';
        const fontSize = 48;
        const string = new TextDecoder().decode(inputFile.bytes);

        this.ctx.font = font;
        this.canvas.width = Math.max(this.ctx.measureText(string).width + 20, 100);
        this.canvas.height = Math.floor(fontSize * 1.5);

        if (outputFormat.mime === 'image/jpeg') {
          this.ctx.fillStyle = 'white';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.fillStyle = 'black';
        this.ctx.font = font;
        this.ctx.fillText(string, 10, fontSize);
      } else {
        // Convert image to image
        const blob = new Blob([inputFile.bytes as BlobPart], { type: inputFormat.mime });
        const url = URL.createObjectURL(blob);

        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('Failed to load image'));
          image.src = url;
        });

        URL.revokeObjectURL(url);

        this.canvas.width = image.naturalWidth;
        this.canvas.height = image.naturalHeight;
        
        // Fill with white for JPEG (no transparency support)
        if (outputFormat.mime === 'image/jpeg') {
          this.ctx.fillStyle = 'white';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.ctx.drawImage(image, 0, 0);
      }

      const bytes: Uint8Array = await new Promise((resolve, reject) => {
        this.canvas!.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas output failed'));
            blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
          },
          outputFormat.mime,
          0.92 // quality for jpeg/webp
        );
      });

      const baseName = inputFile.name.split('.').slice(0, -1).join('.') || inputFile.name;
      const name = baseName + '.' + outputFormat.extension;

      outputFiles.push({ bytes, name });
    }

    return outputFiles;
  }
}

export default CanvasToBlobHandler;
