import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Database, Bot, Loader2 } from 'lucide-react';

export const SchemaIndexingPlaceholderPage: React.FC = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(4);

  // Auto-redirect to the assistant after a short delay
  useEffect(() => {
    if (!connectionId) return;
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          navigate(`/assistant/${connectionId}`);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [connectionId, navigate]);

  const redirectText = t.schemaIndexing.redirectingIn.replace('{seconds}', countdown.toString());

  return (
    <AppLayout>
      <header className="h-16 bg-app-surface border-b border-slate-200 dark:border-slate-800 flex items-center px-8 flex-shrink-0 sticky top-0 z-10 transition-colors">
        <h1 className="text-base font-bold text-slate-900 dark:text-white">{t.schemaIndexing.headerTitle}</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-10">
        <div className="bg-app-surface rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 max-w-md text-center transition-colors">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.schemaIndexing.cardTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
            {t.schemaIndexing.cardDesc}
          </p>

          {connectionId && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-mono break-all">
              {t.schemaIndexing.connectionIdLabel}: {connectionId}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">{redirectText}</span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to={connectionId ? `/assistant/${connectionId}` : '/assistant'}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
            >
              <Bot className="w-4 h-4" />
              {t.schemaIndexing.openNowBtn}
            </Link>
            <Link
              to="/databases"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors"
            >
              <Database className="w-4 h-4" />
              {t.schemaIndexing.backToDatabasesBtn}
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
