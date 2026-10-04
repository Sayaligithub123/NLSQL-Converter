import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { CheckCircle2, Database, Bot, Loader2 } from 'lucide-react';

export const SchemaIndexingPlaceholderPage: React.FC = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
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

  return (
    <AppLayout>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 flex-shrink-0 sticky top-0 z-10">
        <h1 className="text-base font-bold text-slate-900">Database Connected!</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Connection Saved!</h2>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            Your database has been connected successfully. Redirecting you to the AI Assistant…
          </p>

          {connectionId && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-mono break-all">
              Connection ID: {connectionId}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Redirecting in {countdown}s…</span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to={connectionId ? `/assistant/${connectionId}` : '/assistant'}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Bot className="w-4 h-4" />
              Open AI Assistant Now
            </Link>
            <Link
              to="/databases"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              <Database className="w-4 h-4" />
              Back to Databases
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
