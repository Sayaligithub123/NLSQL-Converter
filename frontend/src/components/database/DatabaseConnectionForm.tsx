import React, { useState } from 'react';
import { Eye, EyeOff, Database, Server, Loader2 } from 'lucide-react';
import { testDatabaseConnection, connectDatabase } from '../../services/databaseApi';
import type { DBConnectionPayload } from '../../services/databaseApi';
import { ConnectionStatus } from './ConnectionStatus';
import type { ConnectionStatusType } from './ConnectionStatus';
import { useNavigate } from 'react-router-dom';

// ── Field error type ──────────────────────────────────────────────────────────
type FieldErrors = Partial<Record<keyof Omit<DBConnectionPayload, 'db_type'>, string>>;

// ── Validation ────────────────────────────────────────────────────────────────
function validate(form: DBConnectionPayload): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.host.trim()) errors.host = 'Host is required.';
  if (!form.port || isNaN(form.port) || form.port < 1 || form.port > 65535)
    errors.port = 'Port must be a valid number (1–65535).';
  if (!form.database.trim()) errors.database = 'Database name is required.';
  if (!form.username.trim()) errors.username = 'Username is required.';
  if (!form.password) errors.password = 'Password is required.';
  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────
export const DatabaseConnectionForm: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<DBConnectionPayload>({
    db_type: 'mysql',
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [connStatus, setConnStatus] = useState<ConnectionStatusType>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const busy = isTesting || isConnecting;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const update = (key: keyof DBConnectionPayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (key !== 'db_type') {
      setFieldErrors((prev) => ({ ...prev, [key as keyof FieldErrors]: undefined }));
    }
  };

  const runValidation = (): boolean => {
    const errors = validate(form);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Test Connection ──────────────────────────────────────────────────────────
  const handleTest = async () => {
    if (busy) return;
    if (!runValidation()) return;

    setIsTesting(true);
    setConnStatus('testing');
    setStatusMessage('');

    try {
      const result = await testDatabaseConnection(form);
      setConnStatus(result.success ? 'success' : 'error');
      setStatusMessage(result.message);
    } catch (err: any) {
      setConnStatus('error');
      setStatusMessage(
        err.response?.data?.detail ||
          'Failed to reach the backend server. Is it running?'
      );
    } finally {
      setIsTesting(false);
    }
  };

  // ── Connect & Save ────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (busy) return;
    if (!runValidation()) return;

    setIsConnecting(true);
    setConnStatus('testing');
    setStatusMessage('Verifying and saving connection…');

    try {
      const result = await connectDatabase(form);
      if (result.success && result.connection_id) {
        setConnStatus('success');
        setStatusMessage('Connection saved! Redirecting to schema indexing…');
        setTimeout(() => navigate(`/schema-indexing/${result.connection_id}`), 1200);
      } else {
        setConnStatus('error');
        setStatusMessage(result.message || 'Could not save the connection.');
      }
    } catch (err: any) {
      setConnStatus('error');
      const detail = err.response?.data?.detail;
      setStatusMessage(
        typeof detail === 'string'
          ? detail
          : 'Connection could not be saved. Please check your credentials.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Shared input class ───────────────────────────────────────────────────────
  const inputCls = (hasError: boolean) =>
    `block w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm placeholder-slate-400 text-slate-900
     focus:outline-none focus:ring-2 transition-colors
     ${hasError
       ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
       : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
     }`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-xl mx-auto">
      {/* Card Header */}
      <div className="px-7 pt-7 pb-5 border-b border-slate-100">
        <div className="flex items-center space-x-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Connect New Database</h2>
            <p className="text-xs text-slate-500">Enter your database connection details</p>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="px-7 py-6 space-y-4">

        {/* ── Database Type ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Database Type
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Database className="w-4 h-4 text-slate-400" />
            </div>
            <select
              value={form.db_type}
              onChange={(e) => update('db_type', e.target.value)}
              disabled={busy}
              className="block w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900
                         focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors
                         disabled:opacity-60"
            >
              <option value="mysql">MySQL</option>
            </select>
          </div>
        </div>

        {/* ── Host + Port (side by side) ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Host */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Host
            </label>
            <input
              type="text"
              value={form.host}
              onChange={(e) => update('host', e.target.value)}
              placeholder="localhost"
              disabled={busy}
              className={inputCls(!!fieldErrors.host) + ' disabled:opacity-60'}
            />
            {fieldErrors.host && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.host}</p>
            )}
          </div>

          {/* Port */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Port
            </label>
            <input
              type="number"
              value={form.port}
              onChange={(e) => update('port', parseInt(e.target.value, 10) || 0)}
              placeholder="3306"
              disabled={busy}
              className={inputCls(!!fieldErrors.port) + ' disabled:opacity-60'}
            />
            {fieldErrors.port && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.port}</p>
            )}
          </div>
        </div>

        {/* ── Database Name ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Database Name
          </label>
          <input
            type="text"
            value={form.database}
            onChange={(e) => update('database', e.target.value)}
            placeholder="company_db"
            disabled={busy}
            className={inputCls(!!fieldErrors.database) + ' disabled:opacity-60'}
          />
          {fieldErrors.database && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.database}</p>
          )}
        </div>

        {/* ── Username ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            placeholder="readonly_user"
            autoComplete="off"
            disabled={busy}
            className={inputCls(!!fieldErrors.username) + ' disabled:opacity-60'}
          />
          {fieldErrors.username && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
          )}
        </div>

        {/* ── Password ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={busy}
              className={inputCls(!!fieldErrors.password) + ' pr-10 disabled:opacity-60'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {/* ── Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Test Connection (secondary) */}
          <button
            type="button"
            onClick={handleTest}
            disabled={busy}
            className="flex-1 py-2.5 px-4 border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100
                       text-slate-700 font-semibold text-sm rounded-xl shadow-xs transition-all
                       flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Testing…</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>

          {/* Connect & Save (primary) */}
          <button
            type="button"
            onClick={handleConnect}
            disabled={busy}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                       text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all
                       flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting…</span>
              </>
            ) : (
              <span>Connect & Save</span>
            )}
          </button>
        </div>

        {/* ── Status ── */}
        <ConnectionStatus status={connStatus} message={statusMessage} />
      </div>
    </div>
  );
};
