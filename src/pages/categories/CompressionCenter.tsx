import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Minimize2, FileText, Image as ImageIcon, Music, Video, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, Button } from '@/components/ui';

export const CompressionCenter: React.FC = () => {
  const navigate = useNavigate();

  const compressionModules = [
    {
      title: 'PDF Compressor',
      description: 'Presets, reduction percentage sliders, exact target size (KB/MB), and rasterization options.',
      icon: <FileText className="w-6 h-6 text-cat-pdf" />,
      color: '#FF788C',
      route: '/tools/pdf-compress',
      badges: ['Presets', 'Target Size (KB/MB)', '% Slider', 'Stream Packing'],
    },
    {
      title: 'Image Compressor',
      description: 'Quality controls, WebP/JPEG recompression, automatic resolution downsampling, and target size matching.',
      icon: <ImageIcon className="w-6 h-6 text-cat-image" />,
      color: '#48DCC7',
      route: '/tools/image-compress',
      badges: ['PNG', 'JPEG', 'WebP', 'Lossy/Lossless'],
    },
    {
      title: 'Audio Compressor & Trimmer',
      description: 'Reduce audio file size, trim silences, adjust bitrate, and normalize channels using Web Audio API.',
      icon: <Music className="w-6 h-6 text-cat-audio" />,
      color: '#9B8AFF',
      route: '/tools/audio-trim',
      badges: ['WAV', 'MP3', 'OGG', 'Channel mixing'],
    },
    {
      title: 'Universal Smart Compressor',
      description: 'Drop any supported document or media file and let FileDoctor automatically apply optimal compression.',
      icon: <Minimize2 className="w-6 h-6 text-arctic-mint" />,
      color: '#48DCC7',
      route: '/tools/pdf-compress',
      badges: ['All formats', 'Automatic strategy', 'Lossless first'],
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-color">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-arctic-mint/15 text-arctic-mint flex items-center justify-center flex-shrink-0">
            <Minimize2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading text-main-white">Compression Center</h1>
            <p className="text-sm text-muted-white mt-1 max-w-xl">
              Unified digital clinic for shrinking documents and media with mathematically verified output metrics.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-arctic-mint font-medium bg-arctic-mint/10 border border-arctic-mint/20 px-3 py-1.5 rounded-full w-fit">
          <ShieldCheck className="w-4 h-4" />
          <span>Real Iterative Optimization</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {compressionModules.map((mod) => (
          <Card
            key={mod.title}
            hoverable
            onClick={() => navigate(mod.route)}
            padding="lg"
            className="flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${mod.color}15` }}
                >
                  {mod.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-main-white group-hover:text-electric-blue transition-colors">
                    {mod.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mod.badges.map((b) => (
                      <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-elevated-navy text-muted-white">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-white leading-relaxed">
                {mod.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-6 border-t border-border-color">
              <span className="text-xs text-success font-medium">100% Client-side sandbox</span>
              <Button size="sm" variant="secondary" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Launch
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

