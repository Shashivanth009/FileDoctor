import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, CornerDownLeft, FileText, Image, Music, Database, Sparkles, Minimize2, Code, Type, Video, ShieldCheck } from 'lucide-react';
import { searchTools } from '@/data/toolRegistry';
import { Tool } from '@/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-cat-pdf" />,
  image: <Image className="w-4 h-4 text-cat-image" />,
  audio: <Music className="w-4 h-4 text-cat-audio" />,
  video: <Video className="w-4 h-4 text-cat-audio" />,
  data: <Database className="w-4 h-4 text-cat-data" />,
  ai: <Sparkles className="w-4 h-4 text-cat-ai" />,
  compression: <Minimize2 className="w-4 h-4 text-arctic-mint" />,
  developer: <Code className="w-4 h-4 text-electric-blue" />,
  text: <Type className="w-4 h-4 text-electric-blue" />,
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<Tool[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setResults(searchTools(query || 'pdf image compress'));
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setResults(searchTools(query || 'compress convert merge split ocr'));
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (tool: Tool) => {
    onClose();
    navigate(tool.route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink-navy/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl bg-surface-navy border border-border-color rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-border-color gap-3 bg-deep-navy">
              <Search className="w-5 h-5 text-muted-white flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tools, conversions, compressions... (e.g. 'Compress PDF', 'Excel', 'EXIF')"
                className="w-full bg-transparent text-sm text-main-white placeholder-muted-white/60 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded text-muted-white hover:text-main-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block text-[10px] font-mono bg-elevated-navy text-muted-white px-2 py-0.5 rounded border border-border-color">
                ESC
              </kbd>
            </div>

            {/* Tool list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {results.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-white">
                  No tools found for "{query}". Try "compress", "merge", "image", or "json".
                </div>
              ) : (
                results.map((tool, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleSelect(tool)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-electric-blue/15 border border-electric-blue/30 text-main-white'
                          : 'text-muted-white hover:bg-elevated-navy border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-elevated-navy flex items-center justify-center flex-shrink-0">
                          {categoryIcons[tool.category] || <Sparkles className="w-4 h-4 text-electric-blue" />}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-main-white">{tool.name}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-elevated-navy text-muted-white">
                              {tool.category}
                            </span>
                          </div>
                          <p className="text-xs text-muted-white/80 truncate mt-0.5">{tool.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {tool.privacyLevel === 'local' && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-success">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Local
                          </span>
                        )}
                        <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-electric-blue' : 'text-muted-white/40'}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-deep-navy border-t border-border-color text-[11px] text-muted-white">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-elevated-navy px-1.5 py-0.5 rounded">↑</kbd>
                  <kbd className="font-mono bg-elevated-navy px-1.5 py-0.5 rounded">↓</kbd> to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-elevated-navy px-1.5 py-0.5 rounded flex items-center">
                    <CornerDownLeft className="w-2.5 h-2.5" />
                  </kbd> to select
                </span>
              </div>
              <span className="text-arctic-mint">100% Client-side & Private</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

