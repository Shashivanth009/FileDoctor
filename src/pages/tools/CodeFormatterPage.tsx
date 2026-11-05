import React, { useState } from 'react';
import { Code, Copy, Check, Sparkles, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { ToolHeader, Button, Card, Tabs, Select, useToast } from '@/components/ui';
import { formatJson, minifyJson, minifyJavaScript, formatHtml, formatCss } from '@/services/dataService';
import { downloadBlob } from '@/services/fileService';

export const CodeFormatterPage: React.FC = () => {
  const [language, setLanguage] = useState<'json' | 'js' | 'html' | 'css'>('json');
  const [inputCode, setInputCode] = useState<string>(
    '{"name":"FileDoctor","version":"2.0.0","privacy":{"local":true,"telemetry":false},"features":["compress","convert","sign","sanitize"]}'
  );
  const [outputCode, setOutputCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleBeautify = async () => {
    setError(null);
    if (!inputCode.trim()) return;

    try {
      if (language === 'json') {
        const res = formatJson(inputCode, 2);
        if (res.success && res.result) setOutputCode(res.result);
        else setError(res.error || 'Invalid JSON');
      } else if (language === 'js') {
        // Pretty print JS
        setOutputCode(inputCode.replace(/;/g, ';\n').replace(/\{/g, ' {\n  ').replace(/\}/g, '\n}\n'));
      } else if (language === 'html') {
        setOutputCode(formatHtml(inputCode));
      } else if (language === 'css') {
        setOutputCode(formatCss(inputCode));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMinify = async () => {
    setError(null);
    if (!inputCode.trim()) return;

    try {
      if (language === 'json') {
        const res = minifyJson(inputCode);
        if (res.success && res.result) setOutputCode(res.result);
        else setError(res.error || 'Invalid JSON');
      } else if (language === 'js') {
        const res = await minifyJavaScript(inputCode);
        if (res.success && res.result) setOutputCode(res.result);
        else setError(res.error || 'JS Minification error');
      } else if (language === 'html') {
        setOutputCode(inputCode.replace(/\s+/g, ' ').replace(/> </g, '><').trim());
      } else if (language === 'css') {
        setOutputCode(inputCode.replace(/\s*([\{\};:,])\s*/g, '$1').replace(/\/\*.*?\*\//g, '').trim());
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode || inputCode);
    setCopied(true);
    toast({ type: 'success', title: 'Code copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === 'js' ? 'js' : language === 'json' ? 'json' : language === 'html' ? 'html' : 'css';
    const blob = new Blob([outputCode || inputCode], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `formatted_code.${ext}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <ToolHeader
        icon={<Code className="w-6 h-6" />}
        name="Code Beautifier & Minifier"
        description="Format, indent, validate, and minify JSON, JavaScript (via Terser), HTML, and CSS directly in memory."
        category="Data & Text"
        categoryRoute="/data-text"
        categoryColor="#496BFF"
        formats={['.json', '.js', '.html', '.css']}
        privacyLevel="local"
      />

      <div className="flex gap-2">
        {[
          { id: 'json', label: 'JSON' },
          { id: 'js', label: 'JavaScript' },
          { id: 'html', label: 'HTML' },
          { id: 'css', label: 'CSS' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setLanguage(item.id as any);
              setOutputCode('');
              setError(null);
            }}
            className={`py-2 px-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              language === item.id
                ? 'bg-electric-blue text-white border-electric-blue'
                : 'bg-surface-navy border-border-color text-muted-white hover:text-main-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Editor */}
        <Card padding="md" className="space-y-3 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-2 border-b border-border-color">
            <span className="text-xs font-semibold text-main-white">Input Source ({language.toUpperCase()})</span>
            <Button variant="ghost" size="sm" onClick={() => setInputCode('')}>Clear</Button>
          </div>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder={`Paste your ${language.toUpperCase()} code here...`}
            className="flex-1 w-full bg-elevated-navy border border-border-color rounded-xl p-3 text-xs font-mono text-main-white outline-none resize-none leading-relaxed"
          />
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1" icon={<Sparkles className="w-3.5 h-3.5" />} onClick={handleBeautify}>
              Beautify
            </Button>
            <Button size="sm" variant="secondary" className="flex-1" onClick={handleMinify}>
              Minify
            </Button>
          </div>
        </Card>

        {/* Output Editor */}
        <Card padding="md" className="space-y-3 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-2 border-b border-border-color">
            <span className="text-xs font-semibold text-main-white">Formatted Output</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" variant="ghost" icon={<Download className="w-3.5 h-3.5" />} onClick={handleDownload}>
                Save
              </Button>
            </div>
          </div>
          {error ? (
            <div className="flex-1 p-4 rounded-xl bg-coral/10 border border-coral/30 text-xs text-coral font-mono overflow-auto flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Syntax Validation Error:</p>
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <textarea
              readOnly
              value={outputCode}
              placeholder="Formatted output will appear here..."
              className="flex-1 w-full bg-elevated-navy border border-border-color rounded-xl p-3 text-xs font-mono text-arctic-mint outline-none resize-none leading-relaxed"
            />
          )}
          <div className="text-[11px] text-muted-white flex items-center justify-between pt-1">
            <span>Input: {inputCode.length} chars</span>
            <span>Output: {outputCode.length} chars</span>
            {outputCode && (
              <span className="text-success font-semibold">
                Saved {Math.max(0, inputCode.length - outputCode.length)} chars
              </span>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

