import React, { useState } from 'react';
import { Sparkles, Search, Copy, Check, FileText } from 'lucide-react';
import { ToolHeader, FileUploadZone, Button, Card, Input, Slider, useToast } from '@/components/ui';
import { summarizeDocumentLocally, queryDocumentContent, SummarizeResult, QaMatch } from '@/services/aiService';
import { readFileAsText } from '@/services/fileService';

export const DocumentSummarizerPage: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    `FileDoctor is an advanced, privacy-first file processing suite engineered to execute all operations entirely within client-side browser environments. Traditional cloud-based file manipulation platforms require users to transmit confidential documents, spreadsheets, and private images to remote servers for processing. This architectural model presents inherent data exposure vulnerabilities and regulatory compliance issues under GDPR and HIPAA.

FileDoctor circumvents these security challenges by employing WebAssembly, Web Workers, the Web Audio API, and the HTML5 Canvas API to perform complex computations locally. Users can compress PDF documents with fine-grained control over downsampling ratios, stream packaging, and color quantization without transmitting a single byte over the public internet.

In addition to document compaction, the platform provides comprehensive image optimization, forensic EXIF metadata stripping, and tabular data conversion between CSV, JSON, and Microsoft Excel formats. All operation logs are securely retained on the user device via IndexedDB and can be audited or purged at will.`
  );

  const [sentenceCount, setSentenceCount] = useState<number>(3);
  const [summary, setSummary] = useState<SummarizeResult | null>(null);

  // Q&A
  const [question, setQuestion] = useState<string>('How does FileDoctor protect user privacy?');
  const [qaMatches, setQaMatches] = useState<QaMatch[]>([]);
  const { toast } = useToast();

  const handleSummarize = () => {
    if (!inputText.trim()) return;
    const res = summarizeDocumentLocally(inputText, sentenceCount);
    setSummary(res);
    toast({ type: 'success', title: 'Summary generated', description: 'Extracted key insights locally' });
  };

  const handleQuery = () => {
    if (!inputText.trim() || !question.trim()) return;
    const matches = queryDocumentContent(inputText, question);
    setQaMatches(matches);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <ToolHeader
        icon={<Sparkles className="w-6 h-6" />}
        name="Document Summarizer & Q&A"
        description="Extract executive summaries, action items, and query passages using privacy-preserving local NLP algorithms."
        category="AI Utilities"
        categoryRoute="/ai"
        categoryColor="#C4B5FD"
        formats={['.txt', '.md', 'text/plain']}
        privacyLevel="local"
      />

      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border-color">
          <span className="text-xs font-semibold text-main-white">Document Source Text</span>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".txt,.md"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const text = await readFileAsText(f);
                  setInputText(text);
                }
              }}
              className="hidden"
              id="doc-upload"
            />
            <label htmlFor="doc-upload" className="text-xs text-electric-blue hover:underline cursor-pointer">
              Upload .txt
            </label>
            <Button variant="ghost" size="sm" onClick={() => setInputText('')}>Clear</Button>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste report, article, meeting notes, or agreement text..."
          className="w-full h-48 bg-elevated-navy border border-border-color rounded-xl p-3 text-xs font-mono text-main-white outline-none resize-y leading-relaxed"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="w-full sm:w-64">
            <Slider
              label="Key sentence count"
              value={sentenceCount}
              min={2}
              max={8}
              onChange={setSentenceCount}
            />
          </div>
          <Button icon={<Sparkles className="w-4 h-4" />} onClick={handleSummarize}>
            Generate Executive Summary
          </Button>
        </div>
      </Card>

      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card padding="lg" className="lg:col-span-2 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-main-white font-heading mb-2">
                Executive Summary
              </h3>
              <p className="text-xs text-muted-white leading-relaxed bg-elevated-navy p-4 rounded-xl border border-border-color">
                {summary.executiveSummary}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-main-white font-heading mb-2">
                Key Points & Takeaways
              </h3>
              <ul className="space-y-2">
                {summary.bulletPoints.map((b, i) => (
                  <li key={i} className="text-xs text-muted-white flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {summary.actionItems.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-main-white font-heading mb-2">
                  Action Items & Obligations
                </h3>
                <ul className="space-y-2">
                  {summary.actionItems.map((a, i) => (
                    <li key={i} className="text-xs text-amber flex items-start gap-2 p-2 rounded-lg bg-amber/5 border border-amber/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber mt-1.5 flex-shrink-0" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card padding="lg" className="space-y-4">
            <h3 className="text-sm font-semibold text-main-white font-heading">
              Dominant Topic Terms
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {summary.keyTerms.map((term, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 font-mono"
                >
                  #{term}
                </span>
              ))}
            </div>

            {/* In-document Q&A */}
            <div className="pt-4 border-t border-border-color space-y-3">
              <h4 className="text-xs font-semibold text-main-white">Ask Question in Document</h4>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about content..."
              />
              <Button size="sm" fullWidth icon={<Search className="w-3.5 h-3.5" />} onClick={handleQuery}>
                Search Passages
              </Button>

              {qaMatches.length > 0 && (
                <div className="space-y-2 pt-2">
                  {qaMatches.map((m, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-elevated-navy border border-border-color text-[11px] text-muted-white">
                      <span className="text-indigo-400 font-semibold block mb-0.5">Section #{m.lineNumber} (Relevance {m.relevanceScore})</span>
                      "{m.passage.slice(0, 160)}..."
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

