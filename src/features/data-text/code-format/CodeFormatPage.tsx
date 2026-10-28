import { useState } from 'react';
import { Code2, Copy, Download, Check } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/feedback/Toast';
import { formatCode, minifyCode, type CodeLanguage } from '@/services/dataProcessing';
import { downloadBlob } from '@/utils/download';
import { addRecentTool } from '@/services/storage';

const LANGS: { value: CodeLanguage; label: string; ext: string }[] = [
  { value: 'json', label: 'JSON', ext: 'json' },
  { value: 'html', label: 'HTML', ext: 'html' },
  { value: 'css', label: 'CSS', ext: 'css' },
  { value: 'javascript', label: 'JavaScript', ext: 'js' },
];

export function CodeFormatPage() {
  const [lang, setLang] = useState<CodeLanguage>('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const { success, error: toastError } = useToast();

  const process = (fn: 'format' | 'minify') => {
    if (!input.trim()) { toastError('Enter some code first.'); return; }
    setError('');
    addRecentTool('code-format');
    try {
      const result = fn === 'format' ? formatCode(input, lang) : minifyCode(input, lang);
      setOutput(result);
    } catch (err) {
      setError((err as Error).message);
      setOutput('');
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true); success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadOutput = () => {
    const ext = LANGS.find((l) => l.value === lang)?.ext ?? 'txt';
    const blob = new Blob([output], { type: 'text/plain' });
    downloadBlob(blob, `output.${ext}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader icon={Code2} title="Code Formatter" description="Beautify and minify JSON, HTML, CSS, and JavaScript." badge={<span className="badge-green">Processed locally</span>} />

      <div className="flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <button key={l.value} onClick={() => { setLang(l.value); setInput(''); setOutput(''); setError(''); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${lang === l.value ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'}`}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="code-input">Input</label>
            <button onClick={() => { setInput(''); setOutput(''); setError(''); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear</button>
          </div>
          <textarea
            id="code-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input font-mono text-xs h-72 resize-none"
            placeholder={`Paste your ${lang.toUpperCase()} here…`}
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="label">Output</label>
            {output && (
              <div className="flex gap-1">
                <button onClick={copyOutput} className="btn-ghost text-xs p-1.5">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={downloadOutput} className="btn-ghost text-xs p-1.5"><Download className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
          <textarea
            readOnly
            value={error ? `Error: ${error}` : output}
            className={`input font-mono text-xs h-72 resize-none ${error ? 'border-red-400 text-red-500' : ''}`}
            placeholder="Output appears here…"
            spellCheck={false}
            aria-label="Output"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => process('format')} className="btn-primary">Beautify</button>
        <button onClick={() => process('minify')} className="btn-secondary">Minify</button>
      </div>
    </div>
  );
}
