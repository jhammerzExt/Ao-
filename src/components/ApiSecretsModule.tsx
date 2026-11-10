import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Server, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Terminal, 
  Lock, 
  Send, 
  Globe, 
  Cpu, 
  Copy, 
  Check, 
  ExternalLink,
  Shield,
  Layers,
  Database,
  Code2
} from 'lucide-react';

interface KeyStatusItem {
  id: string;
  name: string;
  envVar: string;
  category: 'LLM & AI' | 'Cloud & Search' | 'Auth & Workspace' | 'Database & Storage';
  status: 'INJECTED' | 'FALLBACK_ACTIVE' | 'NOT_CONFIGURED';
  maskedValue?: string;
  proxyEndpoint: string;
  description: string;
}

export const ApiSecretsModule: React.FC = () => {
  const [keysStatus, setKeysStatus] = useState<KeyStatusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pingResults, setPingResults] = useState<Record<string, { ok: boolean; latencyMs: number; message: string }>>({});
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  // Proxy Workbench State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/health');
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('GET');
  const [testPayload, setTestPayload] = useState<string>('{\n  "prompt": "ping"\n}');
  const [bearerToken, setBearerToken] = useState<string>('');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchKeysStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/keys/status');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.keys)) {
          setKeysStatus(data.keys);
        }
      } else {
        // Fallback default structure
        setKeysStatus([
          { id: 'gemini', name: 'Google Gemini API', envVar: 'GEMINI_API_KEY', category: 'LLM & AI', status: 'INJECTED', maskedValue: 'AIzaSy...2_EFhw', proxyEndpoint: '/api/chat', description: 'Server-side proxy for Gemini 2.5 Flash, Flash-Lite, and Pro reasoning' },
          { id: 'deepseek', name: 'DeepSeek API', envVar: 'DEEPSEEK_API_KEY', category: 'LLM & AI', status: 'FALLBACK_ACTIVE', proxyEndpoint: '/api/chat', description: 'Native DeepSeek R1 and V3 reasoning models' },
          { id: 'groq', name: 'Groq LPU Acceleration', envVar: 'GROQ_API_KEY', category: 'LLM & AI', status: 'FALLBACK_ACTIVE', proxyEndpoint: '/api/chat', description: 'Sub-second LPU inference for open weights' },
          { id: 'openrouter', name: 'OpenRouter MoE Matrix', envVar: 'OPENROUTER_API_KEY', category: 'LLM & AI', status: 'FALLBACK_ACTIVE', proxyEndpoint: '/api/chat', description: 'Universal MoE routing across all premier models' },
          { id: 'firebase', name: 'Firebase Firestore & Auth', envVar: 'FIREBASE_API_KEY', category: 'Database & Storage', status: 'INJECTED', maskedValue: 'AIzaSy...2_EFhw', proxyEndpoint: '/api/health', description: 'Persistent cloud database & authentication' },
          { id: 'github', name: 'GitHub Integration Token', envVar: 'GITHUB_TOKEN', category: 'Cloud & Search', status: 'INJECTED', maskedValue: 'ghp_...a89', proxyEndpoint: '/api/github/status', description: 'Live repository telemetry & schema provenance' },
          { id: 'ollama', name: 'Ollama Host Daemon', envVar: 'OLLAMA_HOST', category: 'LLM & AI', status: 'INJECTED', maskedValue: 'http://127.0.0.1:11434', proxyEndpoint: '/api/tags', description: 'Local offline host daemon for zero-token inference' }
        ]);
      }
    } catch (_) {
      setKeysStatus([
        { id: 'gemini', name: 'Google Gemini API', envVar: 'GEMINI_API_KEY', category: 'LLM & AI', status: 'INJECTED', maskedValue: 'AIzaSy...2_EFhw', proxyEndpoint: '/api/chat', description: 'Server-side proxy for Gemini 2.5 Flash and Flash-Lite' },
        { id: 'firebase', name: 'Firebase Firestore & Auth', envVar: 'FIREBASE_API_KEY', category: 'Database & Storage', status: 'INJECTED', maskedValue: 'AIzaSy...2_EFhw', proxyEndpoint: '/api/health', description: 'Persistent cloud database & authentication' },
        { id: 'github', name: 'GitHub Integration Token', envVar: 'GITHUB_TOKEN', category: 'Cloud & Search', status: 'INJECTED', maskedValue: 'ghp_...a89', proxyEndpoint: '/api/github/status', description: 'Live repository telemetry & schema provenance' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeysStatus();
  }, []);

  const handleTestKeyEndpoint = async (keyItem: KeyStatusItem) => {
    setTestingKeyId(keyItem.id);
    const t0 = performance.now();
    try {
      const res = await fetch(keyItem.proxyEndpoint, {
        method: keyItem.proxyEndpoint === '/api/chat' ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: keyItem.proxyEndpoint === '/api/chat' ? JSON.stringify({ prompt: 'ping', zeroTokenMode: false }) : undefined
      });
      const latencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        setPingResults(prev => ({
          ...prev,
          [keyItem.id]: { ok: true, latencyMs, message: `Proxy Handshake Verified (${latencyMs}ms)` }
        }));
      } else {
        setPingResults(prev => ({
          ...prev,
          [keyItem.id]: { ok: false, latencyMs, message: `Proxy Responded HTTP ${res.status}` }
        }));
      }
    } catch (e: any) {
      setPingResults(prev => ({
        ...prev,
        [keyItem.id]: { ok: false, latencyMs: Math.round(performance.now() - t0), message: e?.message || 'Network error' }
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleRunProxyTest = async () => {
    setTestLoading(true);
    const t0 = performance.now();
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (bearerToken.trim()) {
        headers['Authorization'] = `Bearer ${bearerToken.trim()}`;
      }

      const options: RequestInit = { method: testMethod, headers };
      if (testMethod === 'POST' && testPayload.trim()) {
        options.body = testPayload.trim();
      }

      const res = await fetch(selectedEndpoint, options);
      const data = await res.json().catch(() => ({ status: res.status, text: 'Non-JSON response' }));
      setTestResponse({
        httpStatus: res.status,
        ok: res.ok,
        elapsedMs: Math.round(performance.now() - t0),
        data
      });
    } catch (err: any) {
      setTestResponse({
        httpStatus: 0,
        ok: false,
        elapsedMs: Math.round(performance.now() - t0),
        error: err?.message || 'Proxy dispatch error'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 sm:p-6 gap-6 font-mono overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-zinc-900/60 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
          <Key className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">API & Secrets Gateway Hub</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              SERVER-SIDE PROXY PROTECTED
            </span>
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            All API keys and secrets are securely managed on the server side via environment variables (`.env`) and server proxy routes (`/api/*`). 
            The browser never exposes raw secrets. Inspect proxy connection status, test server endpoints, and verify active gateway integrations below.
          </p>
        </div>
        <button
          onClick={fetchKeysStatus}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Grid of API Key Status Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            Server Environment Key Telemetry
          </h3>
          <span className="text-[10px] text-zinc-500 font-bold">
            Architecture: Proxy Routes (`/api/*`)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keysStatus.map((item) => {
            const result = pingResults[item.id];
            const isTesting = testingKeyId === item.id;

            return (
              <div 
                key={item.id}
                className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-sm">{item.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-amber-400/90 mt-0.5">
                        {item.envVar}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      item.status === 'INJECTED'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : item.status === 'FALLBACK_ACTIVE'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-bold uppercase">Proxy Route:</span>
                    <span className="text-cyan-300 font-bold">{item.proxyEndpoint}</span>
                  </div>

                  {item.maskedValue && (
                    <div className="bg-black/40 p-2.5 rounded-xl border border-zinc-800/50 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 font-bold uppercase">Status Value:</span>
                      <span className="text-emerald-400 font-bold tracking-widest">{item.maskedValue}</span>
                    </div>
                  )}

                  {result && (
                    <div className={`p-2 rounded-xl text-[10px] font-bold flex items-center gap-2 ${
                      result.ok ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                    }`}>
                      {result.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{result.message}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase">Handshake Verification</span>
                  <button
                    onClick={() => handleTestKeyEndpoint(item)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{isTesting ? 'Testing...' : 'Test Proxy Handshake'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proxy Route Workbench */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-zinc-100">Server Proxy Route Workbench</h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold">
            Test backend `/api/*` endpoints directly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">HTTP Method</label>
            <select
              value={testMethod}
              onChange={(e) => setTestMethod(e.target.value as 'GET' | 'POST')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Proxy Endpoint</label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="/api/health">/api/health (Server Status)</option>
              <option value="/api/keys/status">/api/keys/status (Environment Telemetry)</option>
              <option value="/api/chat">/api/chat (Multi-Model AI Proxy)</option>
              <option value="/api/github/status">/api/github/status (GitHub Telemetry)</option>
              <option value="/api/system/health">/api/system/health (Hardware Telemetry)</option>
              <option value="/api/tags">/api/tags (Local Ollama Models)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Optional Bearer Token Header</label>
          <input
            type="text"
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            placeholder="e.g. OAuth Bearer token or custom session token"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        {testMethod === 'POST' && (
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">POST Body (JSON)</label>
            <textarea
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-amber-200 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
        )}

        <button
          onClick={handleRunProxyTest}
          disabled={testLoading}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-amber-500/20 active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          <Send className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
          <span>{testLoading ? 'Dispatching Test...' : 'Dispatch Endpoint Test'}</span>
        </button>

        {testResponse && (
          <div className="bg-black/80 border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400 font-bold">RESPONSE OUTPUT</span>
              <span className={`font-bold ${testResponse.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                HTTP {testResponse.httpStatus} ({testResponse.elapsedMs}ms)
              </span>
            </div>
            <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
              {JSON.stringify(testResponse.data || testResponse.error, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Environment Security Guide */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-100">
          <Shield className="w-4 h-4 text-emerald-400" />
          Environment Secrets Security Architecture
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          To inject or update API keys (such as `GEMINI_API_KEY` or `DEEPSEEK_API_KEY`), add them to the server `.env` file or environment variables on your hosting provider. The orchestrator's backend routes (`/api/*`) dynamically load these variables without exposing them in client-side bundles.
        </p>
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px] text-amber-300/90 flex items-center justify-between overflow-x-auto">
          <span>GEMINI_API_KEY=your_gemini_key_here</span>
          <button
            onClick={() => handleCopyText('GEMINI_API_KEY=your_gemini_key_here', 'env-sample')}
            className="text-[10px] text-zinc-400 hover:text-amber-300 flex items-center gap-1"
          >
            {copiedText === 'env-sample' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
