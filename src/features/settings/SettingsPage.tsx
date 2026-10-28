import { Settings, Sun, Moon, Monitor, Shield, Trash2, Github } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTheme } from '@/hooks/useTheme';
import { clearHistory } from '@/services/storage';
import { useToast } from '@/components/feedback/Toast';
import type { Theme } from '@/types';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { success } = useToast();

  const handleClearHistory = async () => {
    if (!confirm('Clear all operation history and cached outputs? This cannot be undone.')) return;
    await clearHistory();
    success('History cleared.');
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" />, desc: 'Always use light mode' },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" />, desc: 'Always use dark mode' },
    { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" />, desc: 'Follow your OS preference' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Settings} title="Settings" description="Application preferences and privacy controls." />

      {/* Theme */}
      <section className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Appearance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                theme === opt.value
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              aria-pressed={theme === opt.value}
            >
              <div className={`p-1.5 rounded-lg ${theme === opt.value ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                {opt.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Privacy</h2>
        </div>
        <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
            <span>All core file processing runs <strong className="text-gray-700 dark:text-gray-200">locally in your browser</strong> — no FileDoctor upload server.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
            <span>No account, no sign-up, no tracking.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
            <span>Operation history stores only metadata (filenames, sizes, timestamps) — never file contents.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
            <span>OCR via Tesseract.js downloads language models (~10 MB) from a CDN on first use.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
            <span>PDF.js worker scripts are loaded from your local bundle — no external CDN.</span>
          </div>
        </div>
      </section>

      {/* Data management */}
      <section className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Data Management</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Operation history</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Stored in IndexedDB. Metadata only.</p>
            </div>
            <button onClick={handleClearHistory} className="btn-danger text-xs">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="card p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">About FileDoctor</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          FileDoctor is a privacy-first, browser-based file processing suite. Built with React, Vite, TypeScript, Tailwind CSS, pdf-lib, pdfjs-dist, and browser APIs.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-gray-400 dark:text-gray-500">
          <span>Version 1.0.0</span>
          <span>·</span>
          <span>React + Vite + TypeScript</span>
          <span>·</span>
          <a href="https://github.com/Shashivanth009/FileDoctor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline">
            <Github className="w-3 h-3" /> GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
