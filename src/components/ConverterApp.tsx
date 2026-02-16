import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, Shield, Cpu, Github, Sparkles, Zap, Lock } from 'lucide-react';
import DropZone from './DropZone';
import FormatSelector, { type Format } from './FormatSelector';
import ConvertButton from './ConvertButton';
import ProgressModal, { type ConversionResult } from './ProgressModal';

// Mock format data - in real app, this would come from the conversion handlers
const FORMATS: Format[] = [
  // Images
  { name: 'PNG Image', format: 'png', extension: 'png', mime: 'image/png', category: 'image' },
  { name: 'JPEG Image', format: 'jpeg', extension: 'jpg', mime: 'image/jpeg', category: 'image' },
  { name: 'WebP Image', format: 'webp', extension: 'webp', mime: 'image/webp', category: 'image' },
  { name: 'GIF Animation', format: 'gif', extension: 'gif', mime: 'image/gif', category: 'image' },
  { name: 'BMP Bitmap', format: 'bmp', extension: 'bmp', mime: 'image/bmp', category: 'image' },
  { name: 'TIFF Image', format: 'tiff', extension: 'tiff', mime: 'image/tiff', category: 'image' },
  { name: 'SVG Vector', format: 'svg', extension: 'svg', mime: 'image/svg+xml', category: 'image' },
  { name: 'ICO Icon', format: 'ico', extension: 'ico', mime: 'image/x-icon', category: 'image' },
  { name: 'AVIF Image', format: 'avif', extension: 'avif', mime: 'image/avif', category: 'image' },
  { name: 'HEIC Image', format: 'heic', extension: 'heic', mime: 'image/heic', category: 'image' },
  
  // Video
  { name: 'MP4 Video', format: 'mp4', extension: 'mp4', mime: 'video/mp4', category: 'video' },
  { name: 'WebM Video', format: 'webm', extension: 'webm', mime: 'video/webm', category: 'video' },
  { name: 'AVI Video', format: 'avi', extension: 'avi', mime: 'video/x-msvideo', category: 'video' },
  { name: 'MOV Video', format: 'mov', extension: 'mov', mime: 'video/quicktime', category: 'video' },
  { name: 'MKV Video', format: 'mkv', extension: 'mkv', mime: 'video/x-matroska', category: 'video' },
  { name: 'FLV Video', format: 'flv', extension: 'flv', mime: 'video/x-flv', category: 'video' },
  { name: 'WMV Video', format: 'wmv', extension: 'wmv', mime: 'video/x-ms-wmv', category: 'video' },
  { name: 'OGV Video', format: 'ogv', extension: 'ogv', mime: 'video/ogg', category: 'video' },
  
  // Audio
  { name: 'MP3 Audio', format: 'mp3', extension: 'mp3', mime: 'audio/mpeg', category: 'audio' },
  { name: 'WAV Audio', format: 'wav', extension: 'wav', mime: 'audio/wav', category: 'audio' },
  { name: 'OGG Audio', format: 'ogg', extension: 'ogg', mime: 'audio/ogg', category: 'audio' },
  { name: 'FLAC Audio', format: 'flac', extension: 'flac', mime: 'audio/flac', category: 'audio' },
  { name: 'AAC Audio', format: 'aac', extension: 'aac', mime: 'audio/aac', category: 'audio' },
  { name: 'M4A Audio', format: 'm4a', extension: 'm4a', mime: 'audio/mp4', category: 'audio' },
  { name: 'WMA Audio', format: 'wma', extension: 'wma', mime: 'audio/x-ms-wma', category: 'audio' },
  
  // Documents
  { name: 'PDF Document', format: 'pdf', extension: 'pdf', mime: 'application/pdf', category: 'document' },
  { name: 'Plain Text', format: 'txt', extension: 'txt', mime: 'text/plain', category: 'document' },
  { name: 'HTML Document', format: 'html', extension: 'html', mime: 'text/html', category: 'document' },
  { name: 'Markdown', format: 'md', extension: 'md', mime: 'text/markdown', category: 'document' },
  { name: 'JSON Data', format: 'json', extension: 'json', mime: 'application/json', category: 'document' },
  { name: 'XML Data', format: 'xml', extension: 'xml', mime: 'application/xml', category: 'document' },
  { name: 'CSV Data', format: 'csv', extension: 'csv', mime: 'text/csv', category: 'document' },
  
  // Archives
  { name: 'ZIP Archive', format: 'zip', extension: 'zip', mime: 'application/zip', category: 'archive' },
  { name: 'TAR Archive', format: 'tar', extension: 'tar', mime: 'application/x-tar', category: 'archive' },
  { name: 'GZIP Archive', format: 'gz', extension: 'gz', mime: 'application/gzip', category: 'archive' },
  { name: '7Z Archive', format: '7z', extension: '7z', mime: 'application/x-7z-compressed', category: 'archive' },
  { name: 'RAR Archive', format: 'rar', extension: 'rar', mime: 'application/vnd.rar', category: 'archive' },
];

const features = [
  { icon: Shield, title: 'Private & Secure', description: 'All processing happens in your browser. Your files never leave your device.' },
  { icon: Cpu, title: 'WebAssembly Powered', description: 'Using FFmpeg, ImageMagick and more - all running natively in your browser.' },
  { icon: Sparkles, title: 'Universal Conversion', description: 'Convert between any format - even from video to PDF if you dare.' },
];

export default function ConverterApp() {
  const [files, setFiles] = useState<File[]>([]);
  const [inputFormat, setInputFormat] = useState<Format | null>(null);
  const [outputFormat, setOutputFormat] = useState<Format | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<'converting' | 'success' | 'error'>('converting');
  const [conversionMessage, setConversionMessage] = useState('');
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  const detectedMime = useMemo(() => {
    if (files.length === 0) return undefined;
    return files[0].type || undefined;
  }, [files]);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    // Try to auto-detect input format
    const mime = newFiles[0]?.type;
    if (mime) {
      const matchingFormat = FORMATS.find(f => f.mime === mime);
      if (matchingFormat) {
        setInputFormat(matchingFormat);
      }
    }
  }, []);

  const handleClearFiles = useCallback(() => {
    setFiles([]);
    setInputFormat(null);
    setOutputFormat(null);
  }, []);

  const canConvert = files.length > 0 && inputFormat && outputFormat;

  const handleConvert = useCallback(async () => {
    if (!canConvert) return;

    setIsConverting(true);
    setModalOpen(true);
    setConversionStatus('converting');
    setConversionMessage('Finding the best conversion route...');

    // Simulate conversion (in real app, this would call the actual conversion handlers)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock success result
    const success = Math.random() > 0.2; // 80% success rate for demo
    
    if (success) {
      setConversionStatus('success');
      setConversionMessage(`Successfully converted ${files[0].name} to ${outputFormat!.format.toUpperCase()}`);
      setConversionResult({
        success: true,
        message: 'Conversion complete!',
        path: [inputFormat!.format.toUpperCase(), outputFormat!.format.toUpperCase()],
        fileName: files[0].name.replace(/\.[^/.]+$/, `.${outputFormat!.extension}`),
      });
    } else {
      setConversionStatus('error');
      setConversionMessage('Could not find a valid conversion route. Try a different output format.');
      setConversionResult({
        success: false,
        message: 'Conversion failed',
      });
    }

    setIsConverting(false);
  }, [canConvert, files, inputFormat, outputFormat]);

  const handleDownload = useCallback(() => {
    // In real app, this would trigger the actual download
    alert('Download would start here in the real app!');
    setModalOpen(false);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <header className="relative pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <nav className="max-w-7xl mx-auto flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <ArrowDownUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">Convert</span>
          </motion.div>
          
          <motion.a
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            href="https://github.com/p2r3/convert"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800/50 hover:bg-surface-700/50 border border-surface-700 text-surface-300 hover:text-surface-100 transition-all"
          >
            <Github className="w-5 h-5" />
            <span className="hidden sm:inline">Star on GitHub</span>
          </motion.a>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-300 text-sm mb-6"
          >
            <Lock className="w-4 h-4" />
            100% Client-side • No Upload Required
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
          >
            <span className="text-surface-100">The </span>
            <span className="text-gradient">Universal</span>
            <span className="text-surface-100"> File Converter</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto"
          >
            Transform any file format right in your browser. Videos, images, audio, documents — even convert an AVI to PDF.
            <span className="text-accent-400"> Your files never leave your device.</span>
          </motion.p>
        </div>
      </header>

      {/* Main Converter Section */}
      <main className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* Drop Zone */}
          <DropZone
            onFilesSelected={handleFilesSelected}
            selectedFiles={files}
            onClear={handleClearFiles}
          />

          {/* Format Selectors */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: files.length > 0 ? 1 : 0.5 }}
            className="mt-12 grid md:grid-cols-2 gap-8"
          >
            <FormatSelector
              label="Convert from"
              formats={FORMATS}
              selectedFormat={inputFormat}
              onSelect={setInputFormat}
              suggestedMime={detectedMime}
            />
            
            <FormatSelector
              label="Convert to"
              formats={FORMATS}
              selectedFormat={outputFormat}
              onSelect={setOutputFormat}
            />
          </motion.div>

          {/* Convert Button */}
          <div className="mt-12 flex justify-center">
            <ConvertButton
              disabled={!canConvert}
              loading={isConverting}
              onClick={handleConvert}
            />
          </div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-5xl mx-auto mt-24 grid sm:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="p-6 rounded-2xl glass hover:border-surface-600 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-100 mb-2">{feature.title}</h3>
              <p className="text-surface-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-800 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-surface-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-400" />
            <span>Powered by WebAssembly magic</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/p2r3/convert" className="hover:text-surface-300 transition-colors">GitHub</a>
            <span>•</span>
            <span>Made with ❤️ by <a href="https://github.com/p2r3" className="text-primary-400 hover:text-primary-300 transition-colors">p2r3</a></span>
          </div>
        </div>
      </footer>

      {/* Progress Modal */}
      <ProgressModal
        isOpen={modalOpen}
        status={conversionStatus}
        message={conversionMessage}
        result={conversionResult ?? undefined}
        onClose={() => setModalOpen(false)}
        onRetry={handleConvert}
        onDownload={handleDownload}
      />
    </div>
  );
}
