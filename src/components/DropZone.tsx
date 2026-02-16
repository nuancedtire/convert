import { useState, useCallback, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileIcon, Sparkles, X } from 'lucide-react';
import clsx from 'clsx';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onClear: () => void;
}

export default function DropZone({ onFilesSelected, selectedFiles, onClear }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items?.length) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const hasFiles = selectedFiles.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-2xl mx-auto"
    >
      <label
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={clsx(
          'relative flex flex-col items-center justify-center w-full min-h-[280px] rounded-3xl cursor-pointer transition-all duration-500',
          'border-2 border-dashed',
          isDragging 
            ? 'border-primary-400 bg-primary-500/10 scale-[1.02]' 
            : hasFiles
              ? 'border-accent-500/50 bg-accent-500/5'
              : 'border-surface-600 bg-surface-900/30 hover:border-surface-500 hover:bg-surface-800/40'
        )}
      >
        <input
          type="file"
          className="hidden"
          onChange={handleFileInput}
          multiple
        />

        <AnimatePresence mode="wait">
          {hasFiles ? (
            <motion.div
              key="files"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4 p-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-accent-500/20 to-primary-500/20 border border-accent-500/30"
                >
                  <FileIcon className="w-12 h-12 text-accent-400" />
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-sm font-bold text-surface-950"
                >
                  {selectedFiles.length}
                </motion.div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-surface-100 mb-1">
                  {selectedFiles[0].name}
                </h3>
                {selectedFiles.length > 1 && (
                  <p className="text-surface-400 text-sm">and {selectedFiles.length - 1} more files</p>
                )}
                <p className="text-surface-500 text-sm font-mono mt-2">
                  {(selectedFiles[0].size / 1024).toFixed(1)} KB • {selectedFiles[0].type || 'unknown'}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  onClear();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-surface-100 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Choose different files
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6 p-8"
            >
              <motion.div
                animate={isDragging ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
              >
                <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-surface-700">
                  <Upload className="w-10 h-10 text-primary-400" />
                </div>
                {isDragging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-5 h-5 text-accent-400" />
                  </motion.div>
                )}
              </motion.div>

              <div className="text-center">
                <h3 className="text-xl font-semibold text-surface-100 mb-2">
                  {isDragging ? 'Release to drop' : 'Drop your files here'}
                </h3>
                <p className="text-surface-400">
                  or <span className="text-primary-400 hover:text-primary-300 transition-colors">browse</span> to choose
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {['Images', 'Videos', 'Audio', 'Documents', 'Archives'].map((type, i) => (
                  <motion.span
                    key={type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-surface-800/50 text-surface-400 border border-surface-700"
                  >
                    {type}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated border gradient */}
        {(isDragging || hasFiles) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"
          >
            <div className={clsx(
              "absolute inset-[-2px] rounded-3xl",
              isDragging 
                ? "bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 animate-pulse"
                : "bg-gradient-to-r from-accent-500/50 via-primary-500/50 to-accent-500/50"
            )} style={{ padding: '2px' }}>
              <div className="w-full h-full rounded-3xl bg-surface-950" />
            </div>
          </motion.div>
        )}
      </label>
    </motion.div>
  );
}
