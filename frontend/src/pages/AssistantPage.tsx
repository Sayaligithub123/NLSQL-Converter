import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { getUserConnections, type DatabaseConnection } from '../services/databaseApi';
import { sendChatMessage, getConnectionSchema } from '../services/chatApi';
import type { ChatBubble, SchemaResponse, ChatMessage } from '../types/chat';
import {
  Bot, Send, Database, ChevronDown, ChevronRight, Eye, EyeOff,
  Sparkles, Clock, Table2, AlertCircle, CheckCircle2, Loader2,
  RotateCcw, Copy, Check, Info, Lock,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

function formatMs(ms?: number) {
  if (!ms) return '';
  return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SQLBlock: React.FC<{ sql: string }> = ({ sql }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-slate-700/60">
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Generated SQL</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-slate-900 px-4 py-3 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {sql}
      </pre>
    </div>
  );
};

const ResultTable: React.FC<{ columns: string[]; rows: (string | number | null)[][] }> = ({ columns, rows }) => {
  if (!columns.length) return null;
  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-slate-700/40">
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-xs">
          <thead className="bg-slate-800 sticky top-0">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2.5 text-left font-semibold text-slate-300 whitespace-nowrap border-b border-slate-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-800/30'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2 text-slate-300 border-b border-slate-700/30 whitespace-nowrap max-w-xs truncate">
                    {cell === null ? <span className="text-slate-500 italic">NULL</span> : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div className="bg-slate-900/60 text-center py-6 text-xs text-slate-500">No rows returned</div>
      )}
    </div>
  );
};

const BubbleAssistant: React.FC<{ bubble: ChatBubble }> = ({ bubble }) => {
  if (bubble.loading) {
    return (
      <div className="flex items-start gap-3 max-w-3xl">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <span className="text-sm text-slate-400">Thinking…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 max-w-4xl w-full">
      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 mt-0.5">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-5 py-4">
          {bubble.cannot_convert ? (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-400">Cannot convert to SQL</p>
                <p className="text-xs text-slate-400 mt-1">{bubble.error}</p>
              </div>
            </div>
          ) : bubble.error && !bubble.sql ? (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{bubble.error}</p>
            </div>
          ) : (
            <>
              {/* Status row */}
              <div className="flex items-center gap-3 flex-wrap">
                {bubble.error ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" /> Execution failed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {bubble.row_count} {bubble.row_count === 1 ? 'row' : 'rows'} returned
                  </span>
                )}
                {bubble.execution_time_ms !== undefined && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" /> {formatMs(bubble.execution_time_ms)}
                  </span>
                )}
              </div>

              {/* SQL */}
              {bubble.sql && <SQLBlock sql={bubble.sql} />}

              {/* Error on execution */}
              {bubble.error && bubble.sql && (
                <div className="mt-3 flex items-start gap-2 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{bubble.error}</p>
                </div>
              )}

              {/* Result Table */}
              {!bubble.error && bubble.columns && bubble.results && (
                <ResultTable columns={bubble.columns} rows={bubble.results} />
              )}
            </>
          )}
        </div>
        <p className="text-[10px] text-slate-600 mt-1 ml-1">
          {bubble.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

const BubbleUser: React.FC<{ bubble: ChatBubble }> = ({ bubble }) => (
  <div className="flex items-start gap-3 justify-end max-w-3xl ml-auto">
    <div className="min-w-0">
      <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg shadow-blue-500/10">
        <p className="text-sm text-white leading-relaxed">{bubble.content}</p>
      </div>
      <p className="text-[10px] text-slate-600 mt-1 mr-1 text-right">
        {bubble.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
    <div className="w-8 h-8 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-300 mt-0.5">
      U
    </div>
  </div>
);

// ── Schema Panel ──────────────────────────────────────────────────────────────

const SchemaPanel: React.FC<{ schema: SchemaResponse | null; loading: boolean }> = ({ schema, loading }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (t: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(t) ? next.delete(t) : next.add(t);
    return next;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-full text-slate-500 text-xs gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading schema…
    </div>
  );
  if (!schema) return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center px-4 gap-2">
      <Table2 className="w-8 h-8 opacity-30" />
      <p>Enter your DB password and select a connection to view the schema.</p>
    </div>
  );
  if (!schema.success) return (
    <div className="flex items-center gap-2 text-red-400 text-xs px-4 py-3">
      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {schema.error}
    </div>
  );

  const tableNames = Object.keys(schema.tables);
  return (
    <div className="overflow-y-auto flex-1 px-2 py-2">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 mb-2">
        {tableNames.length} tables · {schema.database}
      </p>
      {tableNames.map(tname => (
        <div key={tname} className="mb-1">
          <button
            onClick={() => toggle(tname)}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
          >
            {expanded.has(tname)
              ? <ChevronDown className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
            <Table2 className="w-3.5 h-3.5 text-blue-400/80 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">{tname}</span>
          </button>
          {expanded.has(tname) && (
            <div className="ml-6 mb-1 border-l border-slate-700/50 pl-3 space-y-0.5">
              {schema.tables[tname].map(col => (
                <div key={col.column} className="flex items-center gap-2 py-1">
                  <span className={`text-[10px] font-mono ${col.key === 'PRI' ? 'text-amber-400' : 'text-slate-400'}`}>
                    {col.column}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">{col.type}</span>
                  {col.key === 'PRI' && <span className="text-[9px] text-amber-500 font-bold">PK</span>}
                  {col.key === 'MUL' && <span className="text-[9px] text-blue-500 font-bold">FK</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const AssistantPage: React.FC = () => {
  const { connectionId: paramConnectionId } = useParams<{ connectionId?: string }>();
  const navigate = useNavigate();

  // Connections
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnId, setSelectedConnId] = useState<string>(paramConnectionId || '');

  // Password (session only — never persisted)
  const [dbPassword, setDbPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirmed, setPasswordConfirmed] = useState(false);

  // Schema
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Chat
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load connections on mount
  useEffect(() => {
    getUserConnections()
      .then(setConnections)
      .catch(console.error);
  }, []);

  // Scroll to bottom on new bubble
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bubbles]);

  const selectedConn = connections.find(c => c.id === selectedConnId);

  const loadSchema = useCallback(async (connId: string, pass: string) => {
    setSchemaLoading(true);
    setSchema(null);
    try {
      const s = await getConnectionSchema(connId, pass);
      setSchema(s);
    } catch (e) {
      setSchema({ success: false, database: '', tables: {}, error: 'Failed to fetch schema.' });
    } finally {
      setSchemaLoading(false);
    }
  }, []);

  const handleConfirmPassword = () => {
    if (!dbPassword || !selectedConnId) return;
    setPasswordConfirmed(true);
    loadSchema(selectedConnId, dbPassword);
    // Welcome message
    setBubbles([{
      id: generateId(),
      role: 'system',
      content: `Connected to **${selectedConn?.database}**. Ask me anything about your data in plain English!`,
      timestamp: new Date(),
    }]);
  };

  const handleConnectionChange = (connId: string) => {
    setSelectedConnId(connId);
    setPasswordConfirmed(false);
    setDbPassword('');
    setSchema(null);
    setBubbles([]);
    navigate(`/assistant/${connId}`, { replace: true });
  };

  const handleReset = () => {
    setPasswordConfirmed(false);
    setDbPassword('');
    setSchema(null);
    setBubbles([]);
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || sending || !selectedConnId || !passwordConfirmed) return;

    setInput('');
    setSending(true);

    const userBubble: ChatBubble = {
      id: generateId(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    const loadingBubble: ChatBubble = {
      id: generateId(),
      role: 'assistant',
      loading: true,
      timestamp: new Date(),
    };

    setBubbles(prev => [...prev, userBubble, loadingBubble]);

    // Build chat history for context (last 10 exchanges)
    const historyForApi: ChatMessage[] = bubbles
      .filter(b => b.role === 'user' || (b.role === 'assistant' && !b.loading))
      .slice(-20)
      .map(b => ({
        role: b.role === 'user' ? 'user' : 'assistant',
        content: b.role === 'user' ? (b.content || '') : (b.sql || b.error || ''),
      }));

    try {
      const response = await sendChatMessage({
        connection_id: selectedConnId,
        db_password: dbPassword,
        question,
        chat_history: historyForApi,
      });

      const resultBubble: ChatBubble = {
        id: generateId(),
        role: 'assistant',
        sql: response.sql,
        columns: response.columns,
        results: response.results,
        row_count: response.row_count,
        error: response.error,
        cannot_convert: response.cannot_convert,
        execution_time_ms: response.execution_time_ms,
        timestamp: new Date(),
      };

      setBubbles(prev => [...prev.slice(0, -1), resultBubble]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || 'Something went wrong. Please try again.';
      const errBubble: ChatBubble = {
        id: generateId(),
        role: 'assistant',
        error: msg,
        columns: [],
        results: [],
        row_count: 0,
        cannot_convert: false,
        timestamp: new Date(),
      };
      setBubbles(prev => [...prev.slice(0, -1), errBubble]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    'Show all tables in this database',
    'How many records are in each table?',
    'Show the first 10 rows of the largest table',
    'List all columns and their types',
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="flex h-screen overflow-hidden bg-slate-950">

        {/* ── LEFT: Schema Sidebar ──────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
          {/* Header */}
          <div className="h-14 flex items-center px-4 border-b border-slate-800 gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Database Schema</span>
          </div>

          {/* Connection Selector */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">Connection</label>
            <select
              value={selectedConnId}
              onChange={e => handleConnectionChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">— Select a database —</option>
              {connections.map(c => (
                <option key={c.id} value={c.id}>
                  {c.database} ({c.host}:{c.port})
                </option>
              ))}
            </select>

            {/* Password entry */}
            {selectedConnId && !passwordConfirmed && (
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">
                  <Lock className="w-3 h-3 inline mr-1" />DB Password (session only)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={dbPassword}
                    onChange={e => setDbPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirmPassword()}
                    placeholder="Enter DB password…"
                    className="w-full bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={handleConfirmPassword}
                  disabled={!dbPassword}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Connect & Load Schema
                </button>
                <p className="text-[9px] text-slate-600 text-center">
                  <Info className="w-3 h-3 inline mr-1" />Password is held in memory only — never stored.
                </p>
              </div>
            )}

            {selectedConnId && passwordConfirmed && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
                <button
                  onClick={handleReset}
                  className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            )}
          </div>

          {/* Schema Tree */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <SchemaPanel schema={schema} loading={schemaLoading} />
          </div>
        </aside>

        {/* ── RIGHT: Chat Area ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Chat Header */}
          <header className="h-14 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">NL2SQL AI Assistant</h1>
                <p className="text-[10px] text-slate-500">
                  {selectedConn
                    ? `${selectedConn.database} · ${selectedConn.host}`
                    : 'Select a database connection to begin'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {passwordConfirmed && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {bubbles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-5 shadow-xl shadow-blue-500/5">
                  <Bot className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">AI Database Assistant</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-8">
                  Ask questions about your database in plain English. I'll convert them to SQL and show you the results instantly.
                </p>
                {!selectedConnId && (
                  <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 px-4 py-2.5 rounded-xl">
                    ← Select a database connection from the left panel to get started.
                  </p>
                )}
                {selectedConnId && !passwordConfirmed && (
                  <p className="text-xs text-blue-400 bg-blue-900/20 border border-blue-700/30 px-4 py-2.5 rounded-xl">
                    ← Enter your database password on the left to connect.
                  </p>
                )}
                {passwordConfirmed && (
                  <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Try asking…</p>
                    {suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus(); }}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 text-xs text-slate-300 rounded-xl text-left transition-all cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              bubbles.map(bubble => {
                if (bubble.role === 'system') return (
                  <div key={bubble.id} className="flex justify-center">
                    <span className="text-[11px] text-slate-500 bg-slate-800/50 border border-slate-700/40 px-4 py-1.5 rounded-full">
                      {bubble.content}
                    </span>
                  </div>
                );
                if (bubble.role === 'user') return <BubbleUser key={bubble.id} bubble={bubble} />;
                return <BubbleAssistant key={bubble.id} bubble={bubble} />;
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar */}
          <div className="flex-shrink-0 px-6 py-4 bg-slate-900 border-t border-slate-800">
            {!passwordConfirmed ? (
              <div className="text-center text-xs text-slate-500 py-2">
                Connect to a database on the left to start chatting.
              </div>
            ) : (
              <div className="flex items-end gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-blue-500/50 transition-colors shadow-lg">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your data… (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 resize-none focus:outline-none max-h-32 leading-relaxed"
                  style={{ minHeight: '24px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  {sending
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-4 h-4 text-white" />}
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-600 text-center mt-2">
              AI may generate incorrect SQL. Always verify before using in production.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
