import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Hourglass } from 'lucide-react';

export const SchemaIndexingPlaceholderPage: React.FC = () => {
  const { connectionId } = useParams<{ connectionId: string }>();

  return (
    <AppLayout>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 flex-shrink-0 sticky top-0 z-10">
        <h1 className="text-base font-bold text-slate-900">Schema Indexing</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
            <Hourglass className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Coming Soon</h2>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            The <strong>Schema Indexing</strong> module is being implemented in the next phase.
          </p>
          {connectionId && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-mono break-all">
              ✅ Connection saved — ID: {connectionId}
            </div>
          )}
          <Link
            to="/databases"
            className="mt-6 inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            ← Back to Databases
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};
