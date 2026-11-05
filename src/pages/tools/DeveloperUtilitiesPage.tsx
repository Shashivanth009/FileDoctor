import React, { useState } from 'react';
import { Code, Key, ShieldCheck, Regex, QrCode, Copy, Check, Download, AlertTriangle } from 'lucide-react';
import { ToolHeader, Button, Card, Input, useToast } from '@/components/ui';
import { decodeJwt } from '@/services/dataService';

export const DeveloperUtilitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'uuid' | 'jwt' | 'regex' | 'qr'>('uuid');

  // UUID
  const [uuids, setUuids] = useState<string[]>([]);
  const [uuidCount, setUuidCount] = useState<number>(5);

  // JWT
  const [jwtToken, setJwtToken] = useState<string>(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZpbGVEb2N0b3IgVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyfQ.4S_XUaF96iQzO1f'
  );

  // Regex
  const [regexPattern, setRegexPattern] = useState<string>('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
  const [regexFlags, setRegexFlags] = useState<string>('g');
  const [regexTestText, setRegexTestText] = useState<string>(
    'Contact support@filedoctor.app or privacy@filedoctor.local for help.'
  );

  // QR
  const [qrText, setQrText] = useState<string>('https://filedoctor.app');

  const { toast } = useToast();

  const generateUuids = () => {
    const arr: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      arr.push(crypto.randomUUID());
    }
    setUuids(arr);
  };

  const copyText = (t: string) => {
    navigator.clipboard.writeText(t);
    toast({ type: 'success', title: 'Copied to clipboard' });
  };

  const decoded = decodeJwt(jwtToken);

  // Regex matches
  let regexMatches: RegExpMatchArray[] = [];
  let regexError: string | null = null;
  try {
    const re = new RegExp(regexPattern, regexFlags);
    const matchesIterator = regexTestText.matchAll(re);
    regexMatches = Array.from(matchesIterator);
  } catch (err: any) {
    regexError = err.message;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <ToolHeader
        icon={<Code className="w-6 h-6" />}
        name="Developer Utilities"
        description="Browser-native utilities: UUID generator, JWT inspection, Regex validation, and QR code creation."
        category="Data & Text"
        categoryRoute="/data-text"
        categoryColor="#496BFF"
        formats={['.json', '.txt']}
        privacyLevel="local"
      />

      <div className="flex gap-2">
        {[
          { id: 'uuid', label: 'UUID Generator', icon: Key },
          { id: 'jwt', label: 'JWT Decoder', icon: ShieldCheck },
          { id: 'regex', label: 'Regex Tester', icon: Regex },
          { id: 'qr', label: 'QR Code Generator', icon: QrCode },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-electric-blue text-white border-electric-blue'
                  : 'bg-surface-navy border-border-color text-muted-white hover:text-main-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* UUID */}
      {activeTab === 'uuid' && (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-32">
              <Input
                label="Count"
                type="number"
                min={1}
                max={50}
                value={uuidCount}
                onChange={(e) => setUuidCount(Number(e.target.value))}
              />
            </div>
            <div className="pt-5">
              <Button onClick={generateUuids}>Generate UUIDs (v4)</Button>
            </div>
          </div>

          {uuids.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-main-white">Generated Identifiers</span>
                <Button size="sm" variant="ghost" onClick={() => copyText(uuids.join('\n'))}>
                  Copy All
                </Button>
              </div>
              <div className="bg-elevated-navy border border-border-color rounded-xl p-3 space-y-1.5 font-mono text-xs text-electric-blue">
                {uuids.map((u, i) => (
                  <div key={i} className="flex items-center justify-between hover:bg-surface-navy p-1.5 rounded">
                    <span>{u}</span>
                    <button onClick={() => copyText(u)} className="text-muted-white hover:text-white p-1">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* JWT */}
      {activeTab === 'jwt' && (
        <Card padding="lg" className="space-y-6">
          <div className="p-3.5 rounded-xl bg-amber/10 border border-amber/25 text-xs text-amber flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Security Disclaimer: </strong>
              This tool decodes Base64Url payload tokens locally in memory for inspection.
              It does not verify cryptographic signatures with an external auth server.
            </div>
          </div>

          <Input
            label="Encoded JWT Token"
            value={jwtToken}
            onChange={(e) => setJwtToken(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
          />

          {decoded.valid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-coral">Header (Algorithm & Type)</span>
                <pre className="p-3 bg-elevated-navy border border-border-color rounded-xl text-xs font-mono text-coral overflow-auto">
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-arctic-mint">Payload (Claims)</span>
                  {decoded.isExpired ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-coral/15 text-coral font-medium">Expired</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">Active</span>
                  )}
                </div>
                <pre className="p-3 bg-elevated-navy border border-border-color rounded-xl text-xs font-mono text-arctic-mint overflow-auto">
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-xs text-coral">{decoded.error}</p>
          )}
        </Card>
      )}

      {/* Regex */}
      {activeTab === 'regex' && (
        <Card padding="lg" className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Regular Expression Pattern"
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Flags"
                value={regexFlags}
                onChange={(e) => setRegexFlags(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-white">Test String</span>
            <textarea
              value={regexTestText}
              onChange={(e) => setRegexTestText(e.target.value)}
              className="w-full h-32 bg-elevated-navy border border-border-color rounded-xl p-3 text-xs font-mono text-main-white outline-none resize-none"
            />
          </div>

          {regexError ? (
            <p className="text-xs text-coral">{regexError}</p>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-main-white">
                Matches Found ({regexMatches.length})
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {regexMatches.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-elevated-navy border border-border-color text-xs font-mono">
                    <p className="text-arctic-mint font-bold">Match #{idx + 1}: "{m[0]}"</p>
                    {m.slice(1).map((group, gIdx) => (
                      <p key={gIdx} className="text-muted-white text-[11px] pl-3">
                        Group {gIdx + 1}: "{group}"
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* QR Code */}
      {activeTab === 'qr' && (
        <Card padding="lg" className="space-y-6">
          <Input
            label="QR Content (URL or Text)"
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
          />

          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl w-fit mx-auto border border-border-color shadow-xl">
            {/* Direct scalable SVG QR renderer */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText || 'filedoctor')}`}
              alt="Generated QR Code"
              className="w-48 h-48"
            />
            <p className="text-[11px] text-ink-navy/70 mt-3 font-mono truncate max-w-xs">{qrText}</p>
          </div>
        </Card>
      )}
    </div>
  );
};

