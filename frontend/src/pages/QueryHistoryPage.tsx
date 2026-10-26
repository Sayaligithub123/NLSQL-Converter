import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
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
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{t.queryHistory.sqlLabel}</span>
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
  const { t } = useLanguage();
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

  const totalQueriesText = t.queryHistory.totalQueriesSub.replace('{count}', history.length.toString());

  return (
    <AppLayout>
      {/* Header */}
      <header className="h-16 bg-app-surface border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{t.queryHistory.headerTitle}</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{totalQueriesText}</p>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6 max-w-6xl">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-app-surface rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{successCount}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.queryHistory.statSuccessful}</p>
            </div>
          </div>
          <div className="bg-app-surface rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{failCount}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.queryHistory.statFailed}</p>
            </div>
          </div>
          <div className="bg-app-surface rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{formatMs(avgMs || undefined)}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.queryHistory.statAvgTime}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.queryHistory.searchPlaceholder}
            className="flex-1 min-w-48 bg-app-surface border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 shadow-xs transition-colors"
          />
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-app-surface text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.queryHistory.filterAll}
            </button>
            <button
              type="button"
              onClick={() => setFilter('success')}
              className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'success'
                  ? 'bg-blue-600 text-white'
                  : 'bg-app-surface text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.queryHistory.filterSuccess}
            </button>
            <button
              type="button"
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'failed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-app-surface text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {t.queryHistory.filterFailed}
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">{t.queryHistory.loading}</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            {history.length === 0
              ? t.queryHistory.noQueriesYet
              : t.queryHistory.noMatches}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className="bg-app-surface rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.success ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-950/60 text-red-500 dark:text-red-400'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug truncate">{item.question}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <Database className="w-3 h-3" />{item.database_name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {item.success ? (
                      <>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {t.queryHistory.rowsLabel.replace('{count}', (item.row_count || 0).toString())}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatMs(item.execution_time_ms)}</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> {t.common.success}
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-3 h-3" /> {t.common.error}
                      </span>
                    )}
                  </div>
                </div>

                {item.sql && <SQLPreview sql={item.sql} />}

                {item.error && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
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
