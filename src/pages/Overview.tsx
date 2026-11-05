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
  Camera,
  Layers,
  Mic,
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
      {/* Hero Section with Ambient Glow Mesh & Micro-animations */}
      <section className="relative text-center max-w-4xl mx-auto pt-6 pb-2 space-y-6">
        {/* Ambient background blur elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-electric-blue/15 via-arctic-mint/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-wrap items-center justify-center gap-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-arctic-mint/10 border border-arctic-mint/30 text-arctic-mint text-xs font-semibold shadow-sm backdrop-blur-sm"
          >
            <ShieldCheck className="w-4 h-4 text-arctic-mint" />
            <span>100% Client-Side Engine · Zero Server Uploads</span>
          </motion.div>

          <Link
            to="/tools/pdf-scan"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-electric-blue/15 border border-electric-blue/30 text-electric-blue text-xs font-semibold hover:bg-electric-blue/25 transition-all shadow-sm group"
          >
            <Camera className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>NEW: Camera Document Scanner</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-main-white leading-[1.12]"
        >
          Your files. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue via-bright-blue to-arctic-mint">
            Feeling lighter.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base sm:text-lg text-muted-white max-w-2xl mx-auto leading-relaxed"
        >
          Convert, compress, scan, protect, and rearrange your files — privately, right inside your browser without accounts, subscriptions, or remote storage.
        </motion.p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-muted-white pt-1">
          <span className="px-2.5 py-1 rounded-lg bg-surface-navy border border-border-color">📄 Multi-Page PDF Scanner</span>
          <span className="px-2.5 py-1 rounded-lg bg-surface-navy border border-border-color">⚡ High-Fidelity Compression</span>
          <span className="px-2.5 py-1 rounded-lg bg-surface-navy border border-border-color">📑 Drag & Drop Organizer</span>
          <span className="px-2.5 py-1 rounded-lg bg-surface-navy border border-border-color">🔒 1-Hour Ephemeral Vault</span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          <Button
            size="lg"
            icon={<Camera className="w-4 h-4 text-arctic-mint" />}
            onClick={() => navigate('/tools/pdf-scan')}
            className="shadow-lg shadow-electric-blue/20"
          >
            Scan Document (Camera)
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={<Layers className="w-4 h-4 text-electric-blue" />}
            onClick={() => navigate('/tools/pdf-organize')}
          >
            Rearrange PDF Pages
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={<Zap className="w-4 h-4 text-arctic-mint" />}
            onClick={() => navigate('/tools')}
          >
            Explore 30+ Tools
          </Button>
        </motion.div>
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

      {/* Creation Studio Spotlight Banner */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-arctic-mint/15 text-arctic-mint text-[11px] font-bold border border-arctic-mint/30">
                CREATE FROM SCRATCH
              </span>
              <h2 className="text-xl font-bold font-heading text-main-white">Creation Studio</h2>
            </div>
            <p className="text-xs text-muted-white mt-0.5">Build PDFs, graphics, studio audio, and datasets with zero server uploads</p>
          </div>
          <Link to="/create" className="text-xs text-arctic-mint hover:underline font-semibold flex items-center gap-1">
            Open Studio <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Document & PDF', desc: 'Build formal reports, invoices & briefs', icon: FileText, tab: 'doc', color: 'from-coral/20 to-coral/5', border: 'border-coral/30', accent: 'text-coral' },
            { title: 'Graphic & Canvas', desc: 'Design social posts, banners & cards', icon: ImageIcon, tab: 'image', color: 'from-arctic-mint/20 to-arctic-mint/5', border: 'border-arctic-mint/30', accent: 'text-arctic-mint' },
            { title: 'Voice & Audio', desc: 'Record microphone voice into studio WAV', icon: Mic, tab: 'audio', color: 'from-electric-blue/20 to-electric-blue/5', border: 'border-electric-blue/30', accent: 'text-electric-blue' },
            { title: 'Spreadsheet & Table', desc: 'Generate datasets & export to Excel/CSV', icon: Database, tab: 'data', color: 'from-amber/20 to-amber/5', border: 'border-amber/30', accent: 'text-amber' },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.title}
                type="button"
                onClick={() => navigate(`/create?tab=${c.tab}`)}
                className={`p-4 rounded-2xl bg-gradient-to-br ${c.color} bg-surface-navy border ${c.border} text-left transition-all hover:scale-102 hover:shadow-xl group cursor-pointer relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-surface-navy border border-border-color flex items-center justify-center ${c.accent} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-white group-hover:text-main-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-sm font-bold text-main-white font-heading">{c.title}</h3>
                <p className="text-xs text-muted-white mt-1 leading-snug">{c.desc}</p>
              </button>
            );
          })}
        </div>
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

