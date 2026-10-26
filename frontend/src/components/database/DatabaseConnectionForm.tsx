import React, { useState } from 'react';
import { Eye, EyeOff, Database, Server, Loader2 } from 'lucide-react';
import { testDatabaseConnection, connectDatabase } from '../../services/databaseApi';
import type { DBConnectionPayload } from '../../services/databaseApi';
import { ConnectionStatus } from './ConnectionStatus';
import type { ConnectionStatusType } from './ConnectionStatus';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

// ── Field error type ──────────────────────────────────────────────────────────
type FieldErrors = Partial<Record<keyof Omit<DBConnectionPayload, 'db_type'>, string>>;

// ── Component ─────────────────────────────────────────────────────────────────
export const DatabaseConnectionForm: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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

  // Validation using current language strings
  const validateForm = (data: DBConnectionPayload): FieldErrors => {
    const errors: FieldErrors = {};
    if (!data.host.trim()) errors.host = t.connectDb.errors.hostRequired;
    if (!data.port || isNaN(data.port) || data.port < 1 || data.port > 65535)
      errors.port = t.connectDb.errors.portInvalid;
    if (!data.database.trim()) errors.database = t.connectDb.errors.databaseRequired;
    if (!data.username.trim()) errors.username = t.connectDb.errors.usernameRequired;
    if (!data.password) errors.password = t.connectDb.errors.passwordRequired;
    return errors;
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const update = (key: keyof DBConnectionPayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (key !== 'db_type') {
      setFieldErrors((prev) => ({ ...prev, [key as keyof FieldErrors]: undefined }));
    }
  };

  const runValidation = (): boolean => {
    const errors = validateForm(form);
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
    } catch (err: unknown) {
      setConnStatus('error');
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setStatusMessage(
        detail || t.connectDb.errors.failedBackend
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
    setStatusMessage(t.connectDb.errors.savingStatus);

    try {
      const result = await connectDatabase(form);
      if (result.success && result.connection_id) {
        setConnStatus('success');
        setStatusMessage(t.connectDb.errors.savedSuccess);
        setTimeout(() => navigate(`/schema-indexing/${result.connection_id}`), 1200);
      } else {
        setConnStatus('error');
        setStatusMessage(result.message || t.connectDb.errors.couldNotSave);
      }
    } catch (err: unknown) {
      setConnStatus('error');
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setStatusMessage(
        typeof detail === 'string'
          ? detail
          : t.connectDb.errors.couldNotSave
      );
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Shared input class ───────────────────────────────────────────────────────
  const inputCls = (hasError: boolean) =>
    `block w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-sm placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100
     focus:outline-none focus:ring-2 transition-colors
     ${hasError
       ? 'border-red-400 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
       : 'border-slate-300 dark:border-slate-700 focus:ring-blue-600 focus:border-blue-600'
     }`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-app-surface rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full max-w-xl mx-auto transition-colors">
      {/* Card Header */}
      <div className="px-7 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.connectDb.cardTitle}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.connectDb.cardSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="px-7 py-6 space-y-4">

        {/* ── Database Type ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t.connectDb.dbTypeLabel}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Database className="w-4 h-4 text-slate-400" />
            </div>
            <select
              value={form.db_type}
              onChange={(e) => update('db_type', e.target.value)}
              disabled={busy}
              className="block w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors
                         disabled:opacity-60 cursor-pointer"
            >
              <option value="mysql">MySQL</option>
            </select>
          </div>
        </div>

        {/* ── Host + Port (side by side) ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Host */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t.connectDb.hostLabel}
            </label>
            <input
              type="text"
              value={form.host}
              onChange={(e) => update('host', e.target.value)}
              placeholder={t.connectDb.hostPlaceholder}
              disabled={busy}
              className={inputCls(!!fieldErrors.host) + ' disabled:opacity-60'}
            />
            {fieldErrors.host && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.host}</p>
            )}
          </div>

          {/* Port */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t.connectDb.portLabel}
            </label>
            <input
              type="number"
              value={form.port}
              onChange={(e) => update('port', parseInt(e.target.value, 10) || 0)}
              placeholder={t.connectDb.portPlaceholder}
              disabled={busy}
              className={inputCls(!!fieldErrors.port) + ' disabled:opacity-60'}
            />
            {fieldErrors.port && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.port}</p>
            )}
          </div>
        </div>

        {/* ── Database Name ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t.connectDb.dbNameLabel}
          </label>
          <input
            type="text"
            value={form.database}
            onChange={(e) => update('database', e.target.value)}
            placeholder={t.connectDb.dbNamePlaceholder}
            disabled={busy}
            className={inputCls(!!fieldErrors.database) + ' disabled:opacity-60'}
          />
          {fieldErrors.database && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.database}</p>
          )}
        </div>

        {/* ── Username ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t.connectDb.usernameLabel}
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            placeholder={t.connectDb.usernamePlaceholder}
            autoComplete="off"
            disabled={busy}
            className={inputCls(!!fieldErrors.username) + ' disabled:opacity-60'}
          />
          {fieldErrors.username && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.username}</p>
          )}
        </div>

        {/* ── Password ── */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {t.connectDb.passwordLabel}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder={t.connectDb.passwordPlaceholder}
              autoComplete="new-password"
              disabled={busy}
              className={inputCls(!!fieldErrors.password) + ' pr-10 disabled:opacity-60'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
          )}
        </div>

        {/* ── Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Test Connection (secondary) */}
          <button
            type="button"
            onClick={handleTest}
            disabled={busy}
            className="flex-1 py-2.5 px-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:bg-slate-100
                       text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl shadow-xs transition-all
                       flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.connectDb.testingBtn}</span>
              </>
            ) : (
              <span>{t.connectDb.testBtn}</span>
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
                <span>{t.connectDb.connectingBtn}</span>
              </>
            ) : (
              <span>{t.connectDb.connectSaveBtn}</span>
            )}
          </button>
        </div>

        {/* ── Status ── */}
        <ConnectionStatus status={connStatus} message={statusMessage} />
      </div>
    </div>
  );
};
