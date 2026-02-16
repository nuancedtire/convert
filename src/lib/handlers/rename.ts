import type { FileData, FileFormat, FormatHandler } from '../types';

class RenameHandler implements FormatHandler {
  public name = 'rename';

  public supportedFormats: FileFormat[] = [
    {
      name: 'ZIP Archive',
      format: 'zip',
      extension: 'zip',
      mime: 'application/zip',
      from: true,
      to: true,
      internal: 'zip',
      category: 'archive',
    },
    {
      name: 'Microsoft Word Document',
      format: 'docx',
      extension: 'docx',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      from: true,
      to: false,
      internal: 'docx',
      category: 'document',
    },
    {
      name: 'Microsoft Excel Workbook',
      format: 'xlsx',
      extension: 'xlsx',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      from: true,
      to: false,
      internal: 'xlsx',
      category: 'document',
    },
    {
      name: 'Microsoft PowerPoint',
      format: 'pptx',
      extension: 'pptx',
      mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      from: true,
      to: false,
      internal: 'pptx',
      category: 'document',
    },
    {
      name: 'OpenDocument Text',
      format: 'odt',
      extension: 'odt',
      mime: 'application/vnd.oasis.opendocument.text',
      from: true,
      to: false,
      internal: 'odt',
      category: 'document',
    },
    {
      name: 'Java Archive',
      format: 'jar',
      extension: 'jar',
      mime: 'application/x-java-archive',
      from: true,
      to: false,
      internal: 'jar',
      category: 'archive',
    },
    {
      name: 'Android Package',
      format: 'apk',
      extension: 'apk',
      mime: 'application/vnd.android.package-archive',
      from: true,
      to: false,
      internal: 'apk',
      category: 'archive',
    },
  ];

  public ready = true;

  async init(): Promise<void> {
    this.ready = true;
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    // This handler just renames files (mostly for ZIP-based formats)
    return inputFiles.map((file) => ({
      name: file.name.split('.').slice(0, -1).join('.') + '.' + outputFormat.extension,
      bytes: new Uint8Array(file.bytes),
    }));
  }
}

export default RenameHandler;
