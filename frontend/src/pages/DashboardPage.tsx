import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
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
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);

  useEffect(() => {
    authService.getDbStatus().then(setDbStatus).catch(console.error);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <AppLayout>
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name ? user.full_name.split(' ')[0] : 'John'}! 👋
          </h1>
          <p className="text-xs text-slate-500">Let's explore your data with AI</p>
        </div>

        <div className="flex items-center space-x-3">
          {dbStatus && (
            <div className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              dbStatus.is_mock
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${dbStatus.is_mock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span>MongoDB: {dbStatus.is_mock ? 'In-Memory' : 'Live'}</span>
            </div>
          )}
          <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="p-8 space-y-8 max-w-7xl">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">2</div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Databases</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">25</div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Queries this month</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">5</div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active users</p>
            </div>
          </div>
        </div>

        {/* Your Databases */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Your Databases</h2>
            <Link
              to="/databases"
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Database</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { name: 'Company DB', tables: 12, color: 'blue', date: '14 Sep 2026' },
              { name: 'HR Database', tables: 8, color: 'amber', date: '12 Sep 2026' },
            ].map((db) => (
              <div key={db.name} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-200 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl bg-${db.color}-50 text-${db.color}-600 flex items-center justify-center`}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{db.name}</h3>
                      <p className="text-xs text-slate-500">MySQL</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                    Connected
                  </span>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 flex space-x-4">
                  <span>{db.tables} Tables</span>
                  <span>•</span>
                  <span>Last updated: {db.date}</span>
                </div>
                <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer">
                  <span>Open Assistant</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Queries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Queries</h2>
            <a href="#history" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all</a>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {[
                { q: 'Show total employees in each department', db: 'Company DB', time: '2 min ago' },
                { q: 'List students with attendance below 75%',  db: 'HR Database', time: '1 hour ago' },
                { q: 'Count of employees joined this year',      db: 'Company DB', time: '3 hours ago' },
              ].map((item) => (
                <div key={item.q} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.q}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.db} • {item.time}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Success
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
