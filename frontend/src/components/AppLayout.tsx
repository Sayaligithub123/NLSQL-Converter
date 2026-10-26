import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Database,
  LayoutDashboard,
  Bot,
  History,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: t.nav.dashboard, icon: LayoutDashboard, to: '/dashboard' },
    { label: t.nav.databases, icon: Database, to: '/databases' },
    { label: t.nav.assistant, icon: Bot, to: '/assistant' },
    { label: t.nav.history, icon: History, to: '/history' },
    { label: t.nav.users, icon: Users, to: '/users' },
    { label: t.nav.settings, icon: Settings, to: '/settings' },
  ];

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-app-bg text-app-text transition-colors">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between flex-shrink-0 border-r border-slate-800">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/80 space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white tracking-tight leading-none">NL2SQL</span>
              <span className="text-[10px] text-slate-400 font-medium">{t.nav.brandSubtitle}</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="p-4 space-y-1.5">
            {navItems.map(({ label, icon: Icon, to }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + '/');
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-colors
                    ${active
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : ''}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User card */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
            <Link
              to="/settings"
              className="flex items-center space-x-3 overflow-hidden flex-1 group"
              title={t.nav.manageProfile}
            >
              {/* Show profile picture if available, otherwise show initials */}
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'Profile'}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-slate-700 group-hover:border-blue-500/50 transition-colors"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                  {user?.full_name ? getInitials(user.full_name) : 'JD'}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate leading-tight group-hover:text-blue-300 transition-colors">
                  {user?.full_name || 'John Doe'}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate">
                  {user?.role || 'user'}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title={t.nav.signOut}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
