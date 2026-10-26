import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Wifi,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export type ConnectionStatusType = 'idle' | 'testing' | 'success' | 'error';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  message?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, message }) => {
  const { t } = useLanguage();

  if (status === 'idle') {
    return (
      <div className="mt-5 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center space-x-3 text-sm text-slate-500 dark:text-slate-400">
        <Wifi className="w-4 h-4 flex-shrink-0 text-slate-400 dark:text-slate-500" />
        <span>{t.connectionStatus.idle}</span>
      </div>
    );
  }

  if (status === 'testing') {
    return (
      <div className="mt-5 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 flex items-center space-x-3 text-sm text-blue-700 dark:text-blue-300 animate-pulse">
        <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
        <span className="font-medium">{t.connectionStatus.testing}</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="mt-5 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 flex items-start space-x-3 text-sm text-emerald-800 dark:text-emerald-300">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="font-semibold">{t.connectionStatus.successTitle}</p>
          <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
            {message || t.connectionStatus.successDefault}
          </p>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="mt-5 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 flex items-start space-x-3 text-sm text-red-800 dark:text-red-300">
      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
      <div>
        <p className="font-semibold">{t.connectionStatus.failedTitle}</p>
        <p className="text-red-700 dark:text-red-400 mt-0.5">
          {message || t.connectionStatus.failedDefault}
        </p>
      </div>
    </div>
  );
};
