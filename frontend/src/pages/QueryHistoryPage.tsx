import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { getQueryHistory } from '../services/chatApi';
import type { QueryHistoryDoc } from '../types/chat';
import {
  History, CheckCircle2, AlertCircle, Clock, Database,
  Sparkles, Copy, Check, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMs(ms?: number) {
  if (!ms) return '—';
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

const SQLPreview: React.FC<{ sql: string }> = ({ sql }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = sql.length > 120 ? sql.slice(0, 120) + '…' : sql;

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-slate-700/50">
      <div className="flex items-center justify-between bg-slate-800 px-3 py-1.5">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">SQL</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>
      <pre className="bg-slate-900 px-3 py-2.5 text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {expanded ? sql : preview}
      </pre>
    </div>
  );
};

export const QueryHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<QueryHistoryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getQueryHistory(200)
      .then(setHistory)
      .catch(() => setError('Failed to load query history.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(h => {
    if (filter === 'success' && !h.success) return false;
    if (filter === 'failed' && h.success) return false;
    if (search && !h.question.toLowerCase().includes(search.toLowerCase()) &&
        !h.sql.toLowerCase().includes(search.toLowerCase()) &&
        !h.database_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const successCount = history.filter(h => h.success).length;
  const failCount = history.filter(h => !h.success).length;
  const avgMs = history
    .filter(h => h.execution_time_ms != null)
    .reduce((sum, h, _, arr) => sum + (h.execution_time_ms! / arr.length), 0);

  return (
    <AppLayout>
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Query History</h1>
            <p className="text-[10px] text-slate-400">{history.length} total queries</p>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{successCount}</div>
              <p className="text-xs text-slate-500">Successful Queries</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{failCount}</div>
              <p className="text-xs text-slate-500">Failed Queries</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{formatMs(avgMs || undefined)}</div>
              <p className="text-xs text-slate-500">Avg. Execution Time</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions, SQL, databases…"
            className="flex-1 min-w-48 bg-white border border-slate-200 text-sm text-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-400 shadow-xs"
          />
          <div className="flex rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {(['all', 'success', 'failed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading history…</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            {history.length === 0
              ? 'No queries yet. Use the AI Assistant to start querying your database.'
              : 'No results match your filter.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.success ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-snug truncate">{item.question}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          <Database className="w-3 h-3" />{item.database_name}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {item.success ? (
                      <>
                        <span className="text-[10px] font-semibold text-slate-500">{item.row_count} rows</span>
                        <span className="text-[10px] text-slate-400">{formatMs(item.execution_time_ms)}</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Success
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                        <AlertCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </div>
                </div>

                {item.sql && <SQLPreview sql={item.sql} />}

                {item.error && (
                  <div className="mt-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {item.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};
