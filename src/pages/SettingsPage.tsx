import React from 'react';
import { Settings, Moon, Sun, Laptop, Save, Trash2 } from 'lucide-react';
import { Card, Button, Select, Slider, useToast } from '@/components/ui';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { clearHistory } from '@/services/historyService';

export const SettingsPage: React.FC = () => {
  const { mode, setMode } = useThemeStore();
  const {
    defaultCompression,
    defaultImageFormat,
    outputNaming,
    historyRetention,
    reducedMotion,
    setSetting,
  } = useSettingsStore();

  const { toast } = useToast();

  const handleClearHistory = async () => {
    if (confirm('Clear all operation history?')) {
      await clearHistory();
      toast({ type: 'success', title: 'History cleared' });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div className="pb-6 border-b border-border-color">
        <h1 className="text-3xl font-bold font-heading text-main-white">Settings & Preferences</h1>
        <p className="text-sm text-muted-white mt-1">
          Customize your default compression parameters, interface theme, and local retention policies.
        </p>
      </div>

      <div className="space-y-6">
        {/* Visual Appearance & Theme */}
        <Card padding="lg" className="space-y-4">
          <h2 className="text-sm font-semibold text-main-white font-heading">
            Interface Theme
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'dark', label: 'Dark (Arctic Pulse)', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'system', label: 'System Automatic', icon: Laptop },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setMode(item.id as any);
                    toast({ type: 'info', title: `Theme switched to ${item.label}` });
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                    mode === item.id
                      ? 'bg-electric-blue/15 border-electric-blue text-main-white'
                      : 'bg-elevated-navy border-border-color text-muted-white hover:text-main-white'
                  }`}
                >
                  <Icon className="w-5 h-5 text-electric-blue" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Default Compression & Conversion */}
        <Card padding="lg" className="space-y-5">
          <h2 className="text-sm font-semibold text-main-white font-heading">
            Default Processing Standards
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default Compression Preset"
              value={defaultCompression}
              onChange={(e) => setSetting('defaultCompression', e.target.value as any)}
              options={[
                { value: 'light', label: 'Light (Minimal size reduction, max quality)' },
                { value: 'balanced', label: 'Balanced (Recommended standard)' },
                { value: 'strong', label: 'Strong (High compression)' },
                { value: 'maximum', label: 'Maximum (Smallest possible file)' },
              ]}
            />

            <Select
              label="Default Converted Image Format"
              value={defaultImageFormat}
              onChange={(e) => setSetting('defaultImageFormat', e.target.value as any)}
              options={[
                { value: 'webp', label: 'WebP (Next-gen compressed)' },
                { value: 'png', label: 'PNG (Lossless transparency)' },
                { value: 'jpeg', label: 'JPEG (Universal photo standard)' },
              ]}
            />
          </div>

          <div className="pt-2">
            <Select
              label="Output Filename Generation Rule"
              value={outputNaming}
              onChange={(e) => setSetting('outputNaming', e.target.value as any)}
              options={[
                { value: 'suffix', label: 'Append Suffix (e.g. document_compressed.pdf)' },
                { value: 'prefix', label: 'Prepend Prefix (e.g. compressed_document.pdf)' },
                { value: 'replace', label: 'Keep Clean Name (e.g. document.pdf)' },
              ]}
            />
          </div>
        </Card>

        {/* Local History Retention */}
        <Card padding="lg" className="space-y-4">
          <h2 className="text-sm font-semibold text-main-white font-heading">
            Data Retention & Accessibility
          </h2>

          <div className="space-y-4">
            <Slider
              label={`History Retention Window (${historyRetention} days)`}
              value={historyRetention}
              min={1}
              max={90}
              unit=" days"
              onChange={(v) => setSetting('historyRetention', v)}
            />

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-main-white">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setSetting('reducedMotion', e.target.checked)}
                  className="rounded text-electric-blue focus:ring-0"
                />
                <span>Enable Reduced Motion (Minimize UI transitions)</span>
              </label>

              <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={handleClearHistory}>
                Purge History
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

