import React, { useState } from 'react';
import { Type, Copy, Check, Hash, Eraser, Fingerprint } from 'lucide-react';
import { ToolHeader, Button, Card, Tabs, Select, useToast } from '@/components/ui';
import {
  cleanText,
  removeDuplicateLines,
  convertCase,
  countWordsAndChars,
  generateHash,
} from '@/services/dataService';

export const TextCleanerPage: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    '  FileDoctor is a privacy-first browser file clinic.\n\nFileDoctor is a privacy-first browser file clinic.\n  Convert, compress, and protect your files.   '
  );
  const [outputText, setOutputText] = useState<string>('');
  const [hashResult, setHashResult] = useState<string>('');
  const [hashAlgo, setHashAlgo] = useState<'SHA-256' | 'SHA-512' | 'SHA-1'>('SHA-256');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const stats = countWordsAndChars(outputText || inputText);

  const handleClean = () => {
    setOutputText(cleanText(inputText));
    toast({ type: 'success', title: 'Text whitespace normalized' });
  };

  const handleDedup = () => {
    setOutputText(removeDuplicateLines(inputText));
    toast({ type: 'success', title: 'Duplicate lines removed' });
  };

  const handleCase = (type: any) => {
    setOutputText(convertCase(inputText, type));
  };

  const handleGenerateHash = async () => {
    const h = await generateHash(inputText, hashAlgo);
    setHashResult(h);
    toast({ type: 'success', title: `${hashAlgo} generated` });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ type: 'success', title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <ToolHeader
        icon={<Type className="w-6 h-6" />}
        name="Text Cleaner & Converter"
        description="Clean whitespace, remove duplicate lines, convert cases, count metrics, and generate cryptographic hashes."
        category="Data & Text"
        categoryRoute="/data-text"
        categoryColor="#496BFF"
        formats={['.txt', 'text/plain']}
        privacyLevel="local"
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Words', val: stats.words },
          { label: 'Characters', val: stats.characters },
          { label: 'No Spaces', val: stats.charactersNoSpaces },
          { label: 'Sentences', val: stats.sentences },
          { label: 'Paragraphs', val: stats.paragraphs },
          { label: 'Read Time', val: `${stats.readingTimeMinutes} min` },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl bg-surface-navy border border-border-color text-center">
            <p className="text-[10px] uppercase text-muted-white font-medium">{s.label}</p>
            <p className="text-base font-bold text-main-white font-mono mt-0.5">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <Card padding="md" className="space-y-3 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-2 border-b border-border-color">
            <span className="text-xs font-semibold text-main-white">Input Text</span>
            <Button variant="ghost" size="sm" onClick={() => setInputText('')}>Clear</Button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="flex-1 w-full bg-elevated-navy border border-border-color rounded-xl p-3 text-xs font-mono text-main-white outline-none resize-none leading-relaxed"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="secondary" icon={<Eraser className="w-3.5 h-3.5" />} onClick={handleClean}>
              Clean Whitespace
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDedup}>
              Remove Duplicates
            </Button>
          </div>
        </Card>

        {/* Output */}
        <Card padding="md" className="space-y-3 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-2 border-b border-border-color">
            <span className="text-xs font-semibold text-main-white">Transformed Text</span>
            <Button size="sm" variant="ghost" icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} onClick={() => handleCopy(outputText)}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <textarea
            readOnly
            value={outputText}
            placeholder="Processed text will appear here..."
            className="flex-1 w-full bg-elevated-navy border border-border-color rounded-xl p-3 text-xs font-mono text-electric-blue outline-none resize-none leading-relaxed"
          />

          {/* Case options */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: 'uppercase', label: 'UPPER' },
              { id: 'lowercase', label: 'lower' },
              { id: 'title', label: 'Title Case' },
              { id: 'camel', label: 'camelCase' },
              { id: 'snake', label: 'snake_case' },
              { id: 'kebab', label: 'kebab-case' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCase(c.id)}
                className="text-[11px] px-2 py-1 rounded bg-elevated-navy border border-border-color text-muted-white hover:text-main-white hover:bg-surface-navy font-mono cursor-pointer"
              >
                {c.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Web Crypto Hash Generator */}
      <Card padding="md" className="space-y-3">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-electric-blue" />
          <h3 className="text-sm font-semibold text-main-white">Client-side Hash Generator (SubtleCrypto)</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-40">
            <Select
              options={[
                { value: 'SHA-256', label: 'SHA-256' },
                { value: 'SHA-512', label: 'SHA-512' },
                { value: 'SHA-1', label: 'SHA-1' },
              ]}
              value={hashAlgo}
              onChange={(e) => setHashAlgo(e.target.value as any)}
            />
          </div>
          <Button size="sm" onClick={handleGenerateHash}>Generate Hash</Button>
        </div>
        {hashResult && (
          <div className="p-3 rounded-lg bg-elevated-navy border border-border-color font-mono text-xs text-arctic-mint break-all flex items-center justify-between">
            <span>{hashResult}</span>
            <Button size="sm" variant="ghost" onClick={() => handleCopy(hashResult)}>Copy</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

