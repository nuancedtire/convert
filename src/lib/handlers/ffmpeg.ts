import type { FileData, FileFormat, FormatHandler } from '../types';
import { getCategoryFromMime } from '../utils';

// Common video/audio formats to register (FFmpeg supports many more)
const commonFormats: Array<{
  name: string;
  format: string;
  extension: string;
  mime: string;
  from: boolean;
  to: boolean;
}> = [
  // Video formats
  { name: 'MP4 Video', format: 'mp4', extension: 'mp4', mime: 'video/mp4', from: true, to: true },
  { name: 'WebM Video', format: 'webm', extension: 'webm', mime: 'video/webm', from: true, to: true },
  { name: 'AVI Video', format: 'avi', extension: 'avi', mime: 'video/x-msvideo', from: true, to: true },
  { name: 'MKV Video', format: 'mkv', extension: 'mkv', mime: 'video/x-matroska', from: true, to: true },
  { name: 'MOV Video', format: 'mov', extension: 'mov', mime: 'video/quicktime', from: true, to: true },
  { name: 'FLV Video', format: 'flv', extension: 'flv', mime: 'video/x-flv', from: true, to: true },
  { name: 'WMV Video', format: 'wmv', extension: 'wmv', mime: 'video/x-ms-wmv', from: true, to: true },
  { name: 'MPEG Video', format: 'mpeg', extension: 'mpeg', mime: 'video/mpeg', from: true, to: true },
  { name: 'OGV Video', format: 'ogv', extension: 'ogv', mime: 'video/ogg', from: true, to: true },
  { name: '3GP Video', format: '3gp', extension: '3gp', mime: 'video/3gpp', from: true, to: true },
  { name: 'Animated GIF', format: 'gif', extension: 'gif', mime: 'image/gif', from: true, to: true },
  
  // Audio formats
  { name: 'MP3 Audio', format: 'mp3', extension: 'mp3', mime: 'audio/mpeg', from: true, to: true },
  { name: 'WAV Audio', format: 'wav', extension: 'wav', mime: 'audio/wav', from: true, to: true },
  { name: 'AAC Audio', format: 'aac', extension: 'aac', mime: 'audio/aac', from: true, to: true },
  { name: 'OGG Audio', format: 'ogg', extension: 'ogg', mime: 'audio/ogg', from: true, to: true },
  { name: 'FLAC Audio', format: 'flac', extension: 'flac', mime: 'audio/flac', from: true, to: true },
  { name: 'M4A Audio', format: 'm4a', extension: 'm4a', mime: 'audio/mp4', from: true, to: true },
  { name: 'WMA Audio', format: 'wma', extension: 'wma', mime: 'audio/x-ms-wma', from: true, to: true },
  { name: 'AIFF Audio', format: 'aiff', extension: 'aiff', mime: 'audio/aiff', from: true, to: true },
  { name: 'WebM Audio', format: 'weba', extension: 'weba', mime: 'audio/webm', from: true, to: true },
];

class FFmpegHandler implements FormatHandler {
  public name = 'FFmpeg';
  public supportedFormats: FileFormat[] = [];
  public ready = false;

  private ffmpeg: any = null;

  async init() {
    if (typeof window === 'undefined') {
      console.warn('FFmpeg: Skipping init on server');
      return;
    }

    try {
      // Dynamic import
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      this.ffmpeg = new FFmpeg();

      // Set up formats without loading FFmpeg yet (lazy load on first convert)
      for (const fmt of commonFormats) {
        this.supportedFormats.push({
          ...fmt,
          internal: fmt.format,
          category: getCategoryFromMime(fmt.mime),
        });
      }

      this.ready = true;
      console.log(`FFmpeg registered ${this.supportedFormats.length} formats`);
    } catch (e) {
      console.error('Failed to initialize FFmpeg:', e);
      this.ready = false;
    }
  }

  private async ensureLoaded() {
    if (!this.ffmpeg.loaded) {
      const baseUrl = import.meta.env.BASE_URL || '/';
      // Use unpkg for FFmpeg core files
      await this.ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
      });
    }
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    if (!this.ffmpeg || !this.ready) {
      throw new Error('FFmpeg not initialized');
    }

    await this.ensureLoaded();

    const outputFiles: FileData[] = [];

    for (const inputFile of inputFiles) {
      const inputName = `input.${inputFormat.extension}`;
      const outputName = `output.${outputFormat.extension}`;

      // Write input file
      await this.ffmpeg.writeFile(inputName, inputFile.bytes);

      // Build FFmpeg command
      const args = ['-i', inputName];
      
      // Add format-specific options
      if (outputFormat.mime === 'video/mp4') {
        args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p');
      } else if (outputFormat.mime === 'video/webm') {
        args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
      } else if (outputFormat.mime === 'image/gif') {
        // GIF output - optimize for size
        args.push('-vf', 'fps=10,scale=480:-1:flags=lanczos');
      } else if (outputFormat.mime.startsWith('audio/')) {
        // For audio output, copy video if input has video
        args.push('-vn'); // No video
      }

      args.push('-y', outputName);

      // Execute FFmpeg
      await this.ffmpeg.exec(args);

      // Read output
      const data = await this.ffmpeg.readFile(outputName);
      const bytes = new Uint8Array(data as ArrayBuffer);

      // Clean up
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      const baseName = inputFile.name.replace(/\.[^/.]+$/, '');
      outputFiles.push({
        name: `${baseName}.${outputFormat.extension}`,
        bytes,
      });
    }

    return outputFiles;
  }
}

export default FFmpegHandler;
