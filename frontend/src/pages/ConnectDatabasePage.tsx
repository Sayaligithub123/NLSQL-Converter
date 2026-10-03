import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { DatabaseConnectionForm } from '../components/database/DatabaseConnectionForm';
import { Database } from 'lucide-react';

export const ConnectDatabasePage: React.FC = () => {
  return (
    <AppLayout>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Connect Database</h1>
            <p className="text-xs text-slate-500">Enter connection details and test</p>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex-1 p-6 md:p-10 flex items-start justify-center">
        <div className="w-full max-w-xl">
          <DatabaseConnectionForm />
        </div>
      </div>
    </AppLayout>
  );
};
