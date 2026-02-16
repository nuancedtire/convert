export function normalizeMimeType(mime: string): string {
  switch (mime) {
    case 'audio/x-wav': return 'audio/wav';
    case 'audio/vnd.wave': return 'audio/wav';
    case 'image/x-icon': return 'image/vnd.microsoft.icon';
    case 'image/qoi': return 'image/x-qoi';
    case 'video/bink': return 'video/vnd.radgamettools.bink';
    case 'video/binka': return 'audio/vnd.radgamettools.bink';
  }
  return mime;
}

export function getCategoryFromMime(mime: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('text/') || mime === 'application/pdf' || mime === 'application/json' || mime === 'application/xml') return 'document';
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('7z') || mime.includes('gzip') || mime.includes('archive')) return 'archive';
  return 'other';
}

export function downloadFile(bytes: Uint8Array, name: string, mime: string): void {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function getBaseFileName(fileName: string): string {
  return fileName.split('.').slice(0, -1).join('.') || fileName;
}
