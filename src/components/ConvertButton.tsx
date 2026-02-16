import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Zap } from 'lucide-react';
import clsx from 'clsx';

interface ConvertButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export default function ConvertButton({ disabled, loading, onClick }: ConvertButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'group relative flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300',
        disabled
          ? 'bg-surface-800 text-surface-500 cursor-not-allowed'
          : loading
            ? 'bg-primary-600 text-white cursor-wait'
            : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40'
      )}
    >
      {/* Animated background */}
      {!disabled && !loading && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
      )}
      
      <span className="relative flex items-center gap-3">
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Converting...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Convert Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </span>

      {/* Glow effect */}
      {!disabled && (
        <div className="absolute inset-0 rounded-2xl glow opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </motion.button>
  );
}
