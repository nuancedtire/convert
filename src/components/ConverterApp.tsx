import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownUp, Shield, Cpu, Github, Sparkles, Zap, Lock, Loader2 } from 'lucide-react';
import DropZone from './DropZone';
import FormatSelector from './FormatSelector';
import ConvertButton from './ConvertButton';
import ProgressModal from './ProgressModal';
import type { FileFormat, ConversionProgress } from '../lib/types';
import { initializeConverter, convert, findFormatByMime } from '../lib/converter';
import { downloadFile } from '../lib/utils';

const features = [
  { icon: Shield, title: 'Private & Secure', description: 'All processing happens in your browser. Your files never leave your device.' },
  { icon: Cpu, title: 'WebAssembly Powered', description: 'Using FFmpeg, ImageMagick and more - all running natively in your browser.' },
  { icon: Sparkles, title: 'Universal Conversion', description: 'Convert between any format - even from video to PDF if you dare.' },
];

export default function ConverterApp() {
  const [files, setFiles] = useState<File[]>([]);
  const [inputFormat, setInputFormat] = useState<FileFormat | null>(null);
  const [outputFormat, setOutputFormat] = useState<FileFormat | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [conversionStatus, setConversionStatus] = useState<'converting' | 'success' | 'error'>('converting');
  const [conversionMessage, setConversionMessage] = useState('');
  const [conversionPath, setConversionPath] = useState<string[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<Array<{ name: string; bytes: Uint8Array }>>([]);
  
  // Format loading state
  const [formats, setFormats] = useState<FileFormat[]>([]);
  const [isLoadingFormats, setIsLoadingFormats] = useState(true);

  // Initialize converter on mount
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        const loadedFormats = await initializeConverter((progress) => {
          if (!mounted) return;
          console.log(`[Init] ${progress.message} (${progress.progress}%)`);
        });
        if (mounted) {
          setFormats(loadedFormats);
          setIsLoadingFormats(false);
        }
      } catch (e) {
        console.error('Failed to initialize converter:', e);
        if (mounted) {
          setIsLoadingFormats(false);
        }
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  const detectedMime = useMemo(() => {
    if (files.length === 0) return undefined;
    return files[0].type || undefined;
  }, [files]);

  const inputFormats = useMemo(() => formats.filter(f => f.from), [formats]);
  const outputFormats = useMemo(() => formats.filter(f => f.to), [formats]);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
    // Try to auto-detect input format
    const mime = newFiles[0]?.type;
    if (mime) {
      const matchingFormat = findFormatByMime(mime);
      if (matchingFormat && matchingFormat.from) {
        setInputFormat(matchingFormat);
      }
    }
  }, []);

  const handleClearFiles = useCallback(() => {
    setFiles([]);
    setInputFormat(null);
    setOutputFormat(null);
    setConvertedFiles([]);
  }, []);

  const canConvert = files.length > 0 && inputFormat && outputFormat;

  const handleConvert = useCallback(async () => {
    if (!canConvert || !inputFormat || !outputFormat) return;

    setIsConverting(true);
    setModalOpen(true);
    setConversionStatus('converting');
    setConversionMessage('Finding the best conversion route...');
    setConversionPath([]);
    setConvertedFiles([]);

    const handleProgress = (progress: ConversionProgress) => {
      setConversionMessage(progress.message);
    };

    try {
      const result = await convert(files, inputFormat, outputFormat, handleProgress);

      if (result.success && result.files) {
        setConversionStatus('success');
        setConversionMessage(`Successfully converted ${files[0].name} to ${outputFormat.format.toUpperCase()}`);
        setConversionPath(result.path || []);
        setConvertedFiles(result.files);
      } else {
        setConversionStatus('error');
        setConversionMessage(result.message);
        setConversionPath(result.path || []);
      }
    } catch (e) {
      setConversionStatus('error');
      setConversionMessage(e instanceof Error ? e.message : 'An unexpected error occurred');
    }

    setIsConverting(false);
  }, [canConvert, files, inputFormat, outputFormat]);

  const handleDownload = useCallback(() => {
    for (const file of convertedFiles) {
      downloadFile(file.bytes, file.name, outputFormat?.mime || 'application/octet-stream');
    }
    setModalOpen(false);
  }, [convertedFiles, outputFormat]);

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

          {/* Loading State */}
          {isLoadingFormats ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-4" />
              <p className="text-surface-400">Loading conversion tools...</p>
            </motion.div>
          ) : (
            <>
              {/* Format Selectors */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: files.length > 0 ? 1 : 0.5 }}
                className="mt-12 grid md:grid-cols-2 gap-8"
              >
                <FormatSelector
                  label="Convert from"
                  formats={inputFormats}
                  selectedFormat={inputFormat}
                  onSelect={setInputFormat}
                  suggestedMime={detectedMime}
                />
                
                <FormatSelector
                  label="Convert to"
                  formats={outputFormats}
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
            </>
          )}
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
        result={{
          success: conversionStatus === 'success',
          message: conversionMessage,
          path: conversionPath,
        }}
        onClose={() => setModalOpen(false)}
        onRetry={handleConvert}
        onDownload={convertedFiles.length > 0 ? handleDownload : undefined}
      />
    </div>
  );
}
