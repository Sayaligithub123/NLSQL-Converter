import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services/authService';
import { getUserConnections, type DatabaseConnection } from '../services/databaseApi';
import { getQueryHistory } from '../services/chatApi';
import type { DbStatusResponse } from '../types/auth';
import { AppLayout } from '../components/AppLayout';
import {
  Database,
  Bell,
  Plus,
  LogOut,
  Server,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Users,
  Bot,
  History,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [queryCount, setQueryCount] = useState<number>(0);

  useEffect(() => {
    authService.getDbStatus().then(setDbStatus).catch(console.error);
    getUserConnections().then(setConnections).catch(console.error);
    getQueryHistory(200).then(h => setQueryCount(h.length)).catch(() => setQueryCount(0));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'User';
  const welcomeText = t.dashboard.welcomeUser.replace('{name}', firstName);

  return (
    <AppLayout>
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="h-16 bg-app-surface border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {welcomeText}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.dashboard.tagline}</p>
        </div>

        <div className="flex items-center space-x-3">
          {dbStatus && (
            <div className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              dbStatus.is_mock
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${dbStatus.is_mock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>{dbStatus.is_mock ? t.dashboard.mongoStatusMock : t.dashboard.mongoStatusLive}</span>
            </div>
          )}
          <button className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.nav.signOut}</span>
          </button>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="p-8 space-y-8 max-w-7xl">

        {/* Quick Action Banner */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 overflow-hidden shadow-lg shadow-blue-500/20">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{t.dashboard.bannerTitle}</h2>
              <p className="text-sm text-blue-100 mt-1">{t.dashboard.bannerSubtitle}</p>
            </div>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-md"
            >
              <Bot className="w-4 h-4" />
              {t.dashboard.openAssistantBtn}
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-app-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{connections.length}</div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.dashboard.statDatabases}</p>
            </div>
          </div>
          <div className="bg-app-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{queryCount}</div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.dashboard.statTotalQueries}</p>
            </div>
          </div>
          <div className="bg-app-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-4 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">1</div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.dashboard.statActiveUsers}</p>
            </div>
          </div>
        </div>

        {/* Your Databases */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{t.dashboard.yourDatabasesTitle}</h2>
            <Link
              to="/databases"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.dashboard.connectDbBtn}</span>
            </Link>
          </div>

          {connections.length === 0 ? (
            <div className="bg-app-surface rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center transition-colors">
              <Database className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.dashboard.noDatabasesYet}</p>
              <Link to="/databases" className="mt-4 inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors">
                {t.dashboard.connectFirstDbBtn}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {connections.map((db) => (
                <div key={db.id} className="bg-app-surface p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{db.database}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{db.db_type.toUpperCase()} · {db.host}:{db.port}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t.common.connected}
                    </span>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <span>{t.dashboard.userLabel}: {db.username}</span>
                  </div>
                  <Link
                    to={`/assistant/${db.id}`}
                    className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.dashboard.openAssistantCard}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to="/assistant" className="bg-app-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.dashboard.quickAssistantTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.dashboard.quickAssistantDesc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </Link>
          <Link to="/history" className="bg-app-surface p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.dashboard.quickHistoryTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.dashboard.quickHistoryDesc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};
