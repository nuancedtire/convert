import type { FileData, FileFormat, FormatHandler } from '../types';

function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

class PdfToImgHandler implements FormatHandler {
  public name = 'PDF to Image';

  public supportedFormats: FileFormat[] = [
    {
      name: 'Portable Document Format',
      format: 'pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      from: true,
      to: false,
      internal: 'pdf',
      category: 'document',
    },
    {
      name: 'Portable Network Graphics',
      format: 'png',
      extension: 'png',
      mime: 'image/png',
      from: false,
      to: true,
      internal: 'png',
      category: 'image',
    },
    {
      name: 'JPEG Image',
      format: 'jpg',
      extension: 'jpg',
      mime: 'image/jpeg',
      from: false,
      to: true,
      internal: 'jpg',
      category: 'image',
    },
  ];

  public ready = false;

  async init() {
    // pdftoimg-js is browser-only
    if (typeof window === 'undefined') {
      console.warn('PdfToImg: Skipping init on server');
      return;
    }
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    if (outputFormat.format !== 'png' && outputFormat.format !== 'jpg') {
      throw new Error('Invalid output format for PDF conversion');
    }

    // Dynamic import
    const { pdfToImg } = await import('pdftoimg-js/browser');

    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      const blob = new Blob([inputFile.bytes], { type: inputFormat.mime });
      const url = URL.createObjectURL(blob);

      try {
        const images = await pdfToImg(url, {
          imgType: outputFormat.format as 'png' | 'jpg',
          pages: 'all',
        });

        const baseName = inputFile.name.replace(/\.[^/.]+$/, '');

        for (let i = 0; i < images.length; i++) {
          const base64 = images[i].slice(images[i].indexOf(';base64,') + 8);
          const bytes = base64ToBytes(base64);
          const name =
            images.length === 1
              ? `${baseName}.${outputFormat.extension}`
              : `${baseName}_page${i + 1}.${outputFormat.extension}`;
          outputFiles.push({ bytes, name });
        }
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    return outputFiles;
  }
}

export default PdfToImgHandler;
