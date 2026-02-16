import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Download, RotateCcw, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface ConversionResult {
  success: boolean;
  message: string;
  path?: string[];
  downloadUrl?: string;
  fileName?: string;
}

interface ProgressModalProps {
  isOpen: boolean;
  status: 'converting' | 'success' | 'error';
  message: string;
  result?: ConversionResult;
  onClose: () => void;
  onRetry?: () => void;
  onDownload?: () => void;
}

export default function ProgressModal({
  isOpen,
  status,
  message,
  result,
  onClose,
  onRetry,
  onDownload,
}: ProgressModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-3xl glass z-50"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Status Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className={clsx(
                  'p-4 rounded-full mb-6',
                  status === 'converting' && 'bg-primary-500/20',
                  status === 'success' && 'bg-accent-500/20',
                  status === 'error' && 'bg-red-500/20'
                )}
              >
                {status === 'converting' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-12 h-12 text-primary-400" />
                  </motion.div>
                )}
                {status === 'success' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle className="w-12 h-12 text-accent-400" />
                  </motion.div>
                )}
                {status === 'error' && (
                  <XCircle className="w-12 h-12 text-red-400" />
                )}
              </motion.div>

              {/* Title */}
              <h3 className={clsx(
                'text-2xl font-bold mb-2',
                status === 'converting' && 'text-primary-300',
                status === 'success' && 'text-accent-300',
                status === 'error' && 'text-red-300'
              )}>
                {status === 'converting' && 'Converting...'}
                {status === 'success' && 'Conversion Complete!'}
                {status === 'error' && 'Conversion Failed'}
              </h3>

              {/* Message */}
              <p className="text-surface-400 mb-6">{message}</p>

              {/* Conversion Path */}
              {result?.path && status === 'success' && (
                <div className="w-full p-4 rounded-xl bg-surface-800/50 mb-6">
                  <p className="text-sm text-surface-500 mb-2">Conversion route:</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {result.path.map((format, i) => (
                      <span key={i} className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-lg bg-primary-500/20 text-primary-300 font-mono text-sm">
                          {format}
                        </span>
                        {i < result.path!.length - 1 && (
                          <span className="text-surface-500">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 w-full">
                {status === 'success' && onDownload && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onDownload}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold hover:shadow-lg hover:shadow-accent-500/30 transition-shadow"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </motion.button>
                )}
                {status === 'error' && onRetry && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRetry}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-700 text-surface-200 font-semibold hover:bg-surface-600 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Try Again
                  </motion.button>
                )}
                <button
                  onClick={onClose}
                  className={clsx(
                    'px-6 py-3 rounded-xl font-semibold transition-colors',
                    status === 'success' || status === 'error'
                      ? 'bg-surface-800 text-surface-300 hover:bg-surface-700'
                      : 'hidden'
                  )}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
