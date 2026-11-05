import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Image as ImageIcon,
  Music,
  Database,
  Sparkles,
  Minimize2,
  ShieldCheck,
  ArrowRight,
  Star,
  Search,
  Clock,
  Sparkle,
  Zap,
} from 'lucide-react';
import { Button, Card, Badge, FileUploadZone } from '@/components/ui';
import { tools, getPopularTools, categories } from '@/data/toolRegistry';
import { getHistory } from '@/services/historyService';
import { formatFileSize } from '@/services/fileService';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { HistoryEntry, Tool } from '@/types';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recommendedTools, setRecommendedTools] = useState<Tool[]>([]);
  const [recentEntries, setRecentEntries] = useState<HistoryEntry[]>([]);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  const popularTools = getPopularTools();

  useEffect(() => {
    getHistory(5).then(setRecentEntries).catch(() => {});
  }, []);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    if (files.length === 0) {
      setRecommendedTools([]);
      return;
    }

    const firstFile = files[0];
    const mime = firstFile.type.toLowerCase();
    const ext = firstFile.name.split('.').pop()?.toLowerCase() || '';

    // Recommend tools matching the input type
    let recs: Tool[] = [];
    if (mime.includes('pdf') || ext === 'pdf') {
      recs = tools.filter((t) =>
        ['pdf-compress', 'pdf-split', 'pdf-to-images', 'pdf-organize', 'pdf-sign'].includes(t.id)
      );
    } else if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) {
      recs = tools.filter((t) =>
        ['image-compress', 'image-convert', 'image-resize', 'image-crop', 'image-metadata', 'image-palette'].includes(t.id)
      );
    } else if (mime.includes('csv') || ext === 'csv') {
      recs = tools.filter((t) => ['csv-to-json', 'csv-to-xlsx'].includes(t.id));
    } else if (mime.includes('json') || ext === 'json') {
      recs = tools.filter((t) => ['json-to-csv', 'json-to-xlsx', 'json-formatter'].includes(t.id));
    } else if (ext === 'xlsx' || ext === 'xls') {
      recs = tools.filter((t) => ['xlsx-to-csv', 'xlsx-to-json'].includes(t.id));
    } else if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      recs = tools.filter((t) => ['audio-convert', 'audio-trim', 'audio-volume'].includes(t.id));
    } else {
      recs = tools.filter((t) => t.isPopular).slice(0, 4);
    }

    setRecommendedTools(recs);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto pt-6 pb-2 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arctic-mint/10 border border-arctic-mint/25 text-arctic-mint text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Client-Side Engine · Zero File Uploads</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-main-white leading-tight">
          Your files. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue via-bright-blue to-arctic-mint">
            Feeling lighter.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-white max-w-2xl mx-auto">
          Convert, compress, protect, and transform your files — privately, right inside your browser without accounts, subscriptions, or remote storage.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button size="lg" icon={<Zap className="w-4 h-4" />} onClick={() => navigate('/tools')}>
            Explore All Tools
          </Button>
          <Button variant="secondary" size="lg" icon={<Minimize2 className="w-4 h-4" />} onClick={() => navigate('/compression')}>
            Compression Center
          </Button>
        </div>
      </section>

      {/* Global Drag & Drop Upload Zone */}
      <section className="max-w-3xl mx-auto">
        <Card padding="lg" className="border-border-color bg-surface-navy/60 backdrop-blur-md">
          <FileUploadZone
            multiple
            files={selectedFiles}
            onFiles={handleFilesSelected}
            onRemoveFile={(idx) => {
              const updated = selectedFiles.filter((_, i) => i !== idx);
              handleFilesSelected(updated);
            }}
            label="Drop files here to diagnose and recommend tools"
            description="Supports PDF, PNG, JPG, WebP, CSV, Excel, JSON, Audio & Video"
          />

          {/* Smart Tool Recommendations based on dropped file */}
          {recommendedTools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 pt-6 border-t border-border-color"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkle className="w-4 h-4 text-electric-blue" />
                <h3 className="text-sm font-semibold text-main-white">
                  Recommended for your file ({selectedFiles[0]?.name}):
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => navigate(tool.route)}
                    className="flex items-center justify-between p-3 rounded-xl bg-elevated-navy border border-border-color hover:border-electric-blue/50 text-left transition-all group cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-main-white group-hover:text-electric-blue transition-colors">
                        {tool.name}
                      </p>
                      <p className="text-xs text-muted-white truncate max-w-xs">{tool.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-white group-hover:text-electric-blue group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </Card>
      </section>

      {/* Popular Tools Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-heading text-main-white">Popular Tools</h2>
            <p className="text-xs text-muted-white">Frequently used clinical file utilities</p>
          </div>
          <Link to="/tools" className="text-xs text-electric-blue hover:text-bright-blue font-medium flex items-center gap-1">
            View all ({tools.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {popularTools.map((tool) => (
            <Card
              key={tool.id}
              hoverable
              onClick={() => navigate(tool.route)}
              className="group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-elevated-navy flex items-center justify-center text-electric-blue group-hover:bg-electric-blue group-hover:text-white transition-colors">
                    {tool.category === 'pdf' && <FileText className="w-5 h-5 text-cat-pdf group-hover:text-white" />}
                    {tool.category === 'image' && <ImageIcon className="w-5 h-5 text-cat-image group-hover:text-white" />}
                    {tool.category === 'data' && <Database className="w-5 h-5 text-cat-data group-hover:text-white" />}
                    {tool.category === 'audio' && <Music className="w-5 h-5 text-cat-audio group-hover:text-white" />}
                    {tool.category === 'compression' && <Minimize2 className="w-5 h-5 text-arctic-mint group-hover:text-white" />}
                    {tool.category === 'ai' && <Sparkles className="w-5 h-5 text-cat-ai group-hover:text-white" />}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(tool.id);
                    }}
                    className="p-1 text-muted-white hover:text-amber transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${isFavorite(tool.id) ? 'fill-amber text-amber' : ''}`}
                    />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-main-white group-hover:text-electric-blue transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-muted-white mt-1 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-color text-[11px] text-muted-white">
                <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-elevated-navy">
                  {tool.category}
                </span>
                <span className="text-success font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Local
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Category Explorer Hubs */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-main-white">Specialized Clinics</h2>
          <p className="text-xs text-muted-white">Explore our comprehensive browser workspaces</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              to={cat.route}
              className="p-5 rounded-2xl bg-surface-navy border border-border-color hover:border-electric-blue/40 transition-all group flex items-start gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cat.accentColor}18`, color: cat.accentColor }}
              >
                {cat.id === 'pdf' && <FileText className="w-6 h-6" />}
                {cat.id === 'image' && <ImageIcon className="w-6 h-6" />}
                {cat.id === 'audio' && <Music className="w-6 h-6" />}
                {cat.id === 'data' && <Database className="w-6 h-6" />}
                {cat.id === 'ai' && <Sparkles className="w-6 h-6" />}
                {cat.id === 'compression' && <Minimize2 className="w-6 h-6" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-main-white group-hover:text-electric-blue transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-white mt-1">{cat.description}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: cat.accentColor }}>
                  <span>Open clinic</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Local Operations (Real IndexedDB Activity) */}
      {recentEntries.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-electric-blue" />
              <h2 className="text-lg font-bold font-heading text-main-white">Recent Operations</h2>
            </div>
            <Link to="/recent" className="text-xs text-electric-blue hover:text-bright-blue font-medium">
              View History
            </Link>
          </div>

          <div className="bg-surface-navy border border-border-color rounded-xl overflow-hidden divide-y divide-border-color">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-main-white">{entry.toolName}</span>
                  <span className="text-muted-white truncate max-w-xs">{entry.inputFilename}</span>
                </div>
                <div className="flex items-center gap-4 text-muted-white">
                  <span>{formatFileSize(entry.originalSize)}</span>
                  {entry.outputSize && (
                    <span className="text-success font-mono font-medium">
                      → {formatFileSize(entry.outputSize)}
                    </span>
                  )}
                  <span className="hidden sm:inline text-muted-white/60">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

