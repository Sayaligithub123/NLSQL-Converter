import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Wifi,
} from 'lucide-react';

export type ConnectionStatusType = 'idle' | 'testing' | 'success' | 'error';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  message?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, message }) => {
  if (status === 'idle') {
    return (
      <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center space-x-3 text-sm text-slate-500">
        <Wifi className="w-4 h-4 flex-shrink-0 text-slate-400" />
        <span>No connection has been tested yet. Enter your details and click <strong>Test Connection</strong>.</span>
      </div>
    );
  }

  if (status === 'testing') {
    return (
      <div className="mt-5 p-4 rounded-xl border border-blue-200 bg-blue-50 flex items-center space-x-3 text-sm text-blue-700 animate-pulse">
        <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
        <span className="font-medium">Testing database connection…</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="mt-5 p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start space-x-3 text-sm text-emerald-800">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
        <div>
          <p className="font-semibold">Connection successful!</p>
          <p className="text-emerald-700 mt-0.5">
            {message || 'Database is reachable and credentials are valid.'}
          </p>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="mt-5 p-4 rounded-xl border border-red-200 bg-red-50 flex items-start space-x-3 text-sm text-red-800">
      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
      <div>
        <p className="font-semibold">Connection failed</p>
        <p className="text-red-700 mt-0.5">
          {message || 'Unable to connect to the database. Please check your connection details.'}
        </p>
      </div>
    </div>
  );
};
