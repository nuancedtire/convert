import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Image, Video, Music, FileText, Archive, File, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import type { FileFormat } from '../lib/types';

export type Format = FileFormat;

interface FormatSelectorProps {
  label: string;
  formats: Format[];
  selectedFormat: Format | null;
  onSelect: (format: Format) => void;
  suggestedMime?: string;
}

const categoryIcons = {
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  archive: Archive,
  other: File,
};

const categoryColors = {
  image: 'from-pink-500 to-rose-500',
  video: 'from-violet-500 to-purple-500',
  audio: 'from-green-500 to-emerald-500',
  document: 'from-blue-500 to-cyan-500',
  archive: 'from-amber-500 to-orange-500',
  other: 'from-gray-500 to-slate-500',
};

export default function FormatSelector({ 
  label, 
  formats, 
  selectedFormat, 
  onSelect,
  suggestedMime 
}: FormatSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(formats.map(f => f.category));
    return Array.from(cats);
  }, [formats]);

  const filteredFormats = useMemo(() => {
    return formats.filter(f => {
      const matchesSearch = !search || 
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.format.toLowerCase().includes(search.toLowerCase()) ||
        f.extension.toLowerCase().includes(search.toLowerCase()) ||
        f.mime.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || f.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [formats, search, selectedCategory]);

  const suggestedFormats = useMemo(() => {
    if (!suggestedMime) return [];
    return formats.filter(f => f.mime === suggestedMime).slice(0, 3);
  }, [formats, suggestedMime]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-surface-200">{label}</h3>
        {selectedFormat && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1 rounded-full text-sm font-mono bg-primary-500/20 text-primary-300 border border-primary-500/30"
          >
            .{selectedFormat.extension}
          </motion.span>
        )}
      </div>

      {/* Suggested formats */}
      <AnimatePresence>
        {suggestedFormats.length > 0 && !selectedFormat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-accent-400" />
              <span className="text-sm text-accent-400">Detected format</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedFormats.map(format => (
                <button
                  key={format.mime + format.format}
                  onClick={() => onSelect(format)}
                  className="px-4 py-2 rounded-xl bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/30 text-accent-300 transition-all hover:scale-105"
                >
                  <span className="font-mono font-medium">{format.format.toUpperCase()}</span>
                  <span className="text-accent-400/70 ml-2 text-sm">{format.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search formats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-900/50 border border-surface-700 text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>
        
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const Icon = categoryIcons[cat];
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isActive ? null : cat)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-sm',
                  isActive
                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                    : 'bg-surface-800/50 border-surface-700 text-surface-400 hover:bg-surface-700/50 hover:text-surface-300'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize hidden sm:inline">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Grid */}
      <motion.div 
        className={clsx(
          'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4 rounded-2xl bg-surface-900/30 border border-surface-800 overflow-hidden transition-all duration-300',
          isExpanded ? 'max-h-[500px]' : 'max-h-[280px]'
        )}
      >
        <AnimatePresence mode="popLayout">
          {filteredFormats.map((format, i) => {
            const Icon = categoryIcons[format.category];
            const isSelected = selectedFormat?.mime === format.mime && selectedFormat?.format === format.format;
            
            return (
              <motion.button
                key={format.mime + format.format}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onSelect(format)}
                className={clsx(
                  'group relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200',
                  isSelected
                    ? 'bg-gradient-to-br from-primary-500/20 to-accent-500/20 border-primary-500/50 scale-105 shadow-lg shadow-primary-500/20'
                    : 'bg-surface-800/30 border-surface-700/50 hover:bg-surface-800/50 hover:border-surface-600 hover:scale-102'
                )}
              >
                <div className={clsx(
                  'p-2 rounded-lg bg-gradient-to-br',
                  categoryColors[format.category],
                  'opacity-80 group-hover:opacity-100 transition-opacity'
                )}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-center">
                  <div className={clsx(
                    'font-mono font-semibold text-sm',
                    isSelected ? 'text-primary-300' : 'text-surface-200'
                  )}>
                    {format.format.toUpperCase()}
                  </div>
                  <div className="text-xs text-surface-500 truncate max-w-[80px]" title={format.name}>
                    {format.name.split(' ').slice(0, 2).join(' ')}
                  </div>
                </div>
                {isSelected && (
                  <motion.div
                    layoutId="selected-ring"
                    className="absolute inset-0 rounded-xl border-2 border-primary-400"
                  />
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Show more button */}
      {filteredFormats.length > 8 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 mx-auto mt-3 px-4 py-2 rounded-xl text-sm text-surface-400 hover:text-surface-200 transition-colors"
        >
          <span>{isExpanded ? 'Show less' : `Show all ${filteredFormats.length} formats`}</span>
          <ChevronDown className={clsx('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
        </button>
      )}
    </motion.div>
  );
}
