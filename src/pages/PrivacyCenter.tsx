import React, { useState, useEffect } from 'react';
import { Shield, Lock, EyeOff, HardDrive, Trash2, CheckCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import { Card, Button, useToast } from '@/components/ui';
import { clearHistory, getStorageEstimate } from '@/services/historyService';
import { formatFileSize } from '@/services/fileService';

export const PrivacyCenter: React.FC = () => {
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getStorageEstimate().then(setStorage).catch(() => {});
  }, []);

  const handlePurgeAll = async () => {
    if (confirm('Permanently wipe all IndexedDB history, cached outputs, and preferences?')) {
      await clearHistory();
      localStorage.clear();
      const est = await getStorageEstimate();
      setStorage(est);
      toast({ type: 'success', title: 'All local data scrubbed completely' });
    }
  };

  const privacyPrinciples = [
    {
      title: 'Processed locally in browser memory',
      desc: 'Files are read as ArrayBuffers and decoded strictly inside your browser tab. No FileDoctor processing server exists.',
      icon: ShieldCheck,
      color: 'text-success',
      badge: 'Zero Network Uploads',
    },
    {
      title: 'Stored on this device only',
      desc: 'When you choose to keep operation logs or retain compressed outputs, they are saved to your browser IndexedDB database.',
      icon: HardDrive,
      color: 'text-electric-blue',
      badge: 'Client Database',
    },
    {
      title: 'Not saved automatically',
      desc: 'Temporary canvases, image buffers, and file descriptors are garbage collected and revoked automatically after download.',
      icon: EyeOff,
      color: 'text-arctic-mint',
      badge: 'Ephemeral Memory',
    },
    {
      title: 'No analytics, cookies, or telemetry',
      desc: 'We do not track file names, sizes, keystrokes, IP addresses, or document contents. No third-party trackers are bundled.',
      icon: Lock,
      color: 'text-indigo-400',
      badge: 'Strict No-Log',
    },
  ];

  const faqs = [
    {
      q: 'Do my PDF documents or images ever touch your servers?',
      a: 'No. FileDoctor contains no backend file-processing servers. All manipulation (PDF parsing, canvas rendering, EXIF stripping, OCR, and audio transcoding) executes 100% locally on your CPU/GPU using WebAssembly and Web APIs.',
    },
    {
      q: 'Can FileDoctor work offline without internet access?',
      a: 'Yes! Once the web application is loaded into your browser, core tools function offline without any network connectivity.',
    },
    {
      q: 'How does the Local Output Vault work?',
      a: 'When you compress or convert a file, FileDoctor writes the resulting blob into an on-device IndexedDB object store ("filedoctor-db"). This allows you to re-download files later without re-uploading.',
    },
    {
      q: 'What happens when I click "Wipe All Local Data"?',
      a: 'Your browser immediately purges all IndexedDB stores, cached file blobs, local preferences, and operation histories. Nothing is retrievable afterward.',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-color">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-success/15 text-success flex items-center justify-center flex-shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-heading text-main-white">Privacy Center</h1>
            <p className="text-sm text-muted-white mt-1 max-w-xl">
              Transparent, uncompromising, on-device privacy architecture. No accounts, no servers, zero telemetry.
            </p>
          </div>
        </div>
        <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handlePurgeAll}>
          Wipe All Local Data
        </Button>
      </div>

      {/* Core Privacy Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {privacyPrinciples.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.title} padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-elevated-navy flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${p.color}`} />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-elevated-navy text-muted-white">
                  {p.badge}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-main-white">{p.title}</h3>
              <p className="text-xs text-muted-white leading-relaxed">{p.desc}</p>
            </Card>
          );
        })}
      </div>

      {/* Storage Audit */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-electric-blue" />
          <h2 className="text-base font-semibold text-main-white font-heading">
            On-Device Storage Audit
          </h2>
        </div>
        <p className="text-xs text-muted-white leading-relaxed">
          FileDoctor stores recent operations and retained downloads inside your browser's private IndexedDB sandbox.
        </p>

        {storage && (
          <div className="p-4 rounded-xl bg-elevated-navy border border-border-color grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-muted-white text-[11px]">Vault Disk Usage</p>
              <p className="text-base font-bold text-main-white font-mono mt-0.5">{formatFileSize(storage.usage)}</p>
            </div>
            <div>
              <p className="text-muted-white text-[11px]">Browser Quota Limit</p>
              <p className="text-base font-bold text-muted-white font-mono mt-0.5">~{formatFileSize(storage.quota)}</p>
            </div>
            <div>
              <p className="text-muted-white text-[11px]">Vault Storage State</p>
              <p className="text-base font-bold text-success mt-0.5">Healthy & Local</p>
            </div>
          </div>
        )}
      </Card>

      {/* FAQ */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-arctic-mint" />
          <h2 className="text-base font-semibold text-main-white font-heading">
            Frequently Asked Privacy Questions
          </h2>
        </div>
        <div className="space-y-4 pt-2">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-elevated-navy border border-border-color space-y-1.5">
              <h3 className="text-xs font-semibold text-main-white">{f.q}</h3>
              <p className="text-xs text-muted-white leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

