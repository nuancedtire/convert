import type { FileData, FileFormat, FormatHandler } from '../types';

class SvgHandler implements FormatHandler {
  public name = 'SVG Handler';

  public supportedFormats: FileFormat[] = [
    {
      name: 'Scalable Vector Graphics',
      format: 'svg',
      extension: 'svg',
      mime: 'image/svg+xml',
      from: true,
      to: true,
      internal: 'svg',
      category: 'image',
    },
    {
      name: 'Hypertext Markup Language',
      format: 'html',
      extension: 'html',
      mime: 'text/html',
      from: true,
      to: false,
      internal: 'html',
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
    if (typeof window === 'undefined') {
      console.warn('SvgHandler: Skipping init on server');
      return;
    }
    this.ready = true;
  }

  private async normalizeHTML(html: string): Promise<{ xml: string; bbox: DOMRect }> {
    const dummy = document.createElement('div');
    dummy.style.all = 'initial';
    dummy.style.visibility = 'hidden';
    dummy.style.position = 'fixed';
    document.body.appendChild(dummy);

    const shadow = dummy.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = '*{all:initial;box-sizing:border-box;}';
    shadow.appendChild(style);

    const container = document.createElement('div');
    container.innerHTML = html;
    shadow.appendChild(container);

    // Wait for images to load
    const images = container.querySelectorAll('img');
    const promises = Array.from(images).map(
      (image) =>
        new Promise((resolve) => {
          image.addEventListener('load', resolve);
          image.addEventListener('error', resolve);
        })
    );
    await Promise.all(promises);

    // Wait for render
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const bbox = container.getBoundingClientRect();
    const serializer = new XMLSerializer();
    const xml = serializer.serializeToString(container);

    container.remove();
    dummy.remove();

    return { xml, bbox };
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      const baseName = inputFile.name.replace(/\.[^/.]+$/, '');

      // HTML to SVG
      if (inputFormat.format === 'html' && outputFormat.format === 'svg') {
        const html = decoder.decode(inputFile.bytes);
        const { xml, bbox } = await this.normalizeHTML(html);
        const svg = `<svg width="${bbox.width}" height="${bbox.height * 1.5}" xmlns="http://www.w3.org/2000/svg">
<foreignObject x="0" y="0" width="${bbox.width}" height="${bbox.height * 1.5}">
${xml}
</foreignObject>
</svg>`;
        outputFiles.push({
          name: `${baseName}.svg`,
          bytes: encoder.encode(svg),
        });
      }
      // SVG to PNG/JPG via Canvas
      else if (inputFormat.format === 'svg' && (outputFormat.format === 'png' || outputFormat.format === 'jpg')) {
        const svgData = decoder.decode(inputFile.bytes);
        const bytes = await this.svgToImage(svgData, outputFormat.format === 'jpg' ? 'image/jpeg' : 'image/png');
        outputFiles.push({
          name: `${baseName}.${outputFormat.extension}`,
          bytes,
        });
      }
      // SVG passthrough (for when we need SVG as intermediate)
      else if (inputFormat.format === 'svg' && outputFormat.format === 'svg') {
        outputFiles.push({
          name: `${baseName}.svg`,
          bytes: inputFile.bytes,
        });
      }
      else {
        throw new Error(`Unsupported conversion: ${inputFormat.format} to ${outputFormat.format}`);
      }
    }

    return outputFiles;
  }

  private async svgToImage(svgData: string, mimeType: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Use natural dimensions or default to reasonable size
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Could not get canvas context'));
          return;
        }

        // White background for JPEG
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            blob.arrayBuffer().then((buffer) => {
              resolve(new Uint8Array(buffer));
            });
          },
          mimeType,
          0.92
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG'));
      };

      img.src = url;
    });
  }
}

export default SvgHandler;
