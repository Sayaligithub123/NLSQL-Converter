import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { apiKeysApi } from '../services/apiKeysApi';
import { AppLayout } from '../components/AppLayout';
import type { ApiKey, ApiKeyCreatedResponse, UserPreferences, UserRole } from '../types/auth';
import {
  User,
  Lock,
  SlidersHorizontal,
  KeyRound,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Plus,
  Shield,
  Bell,
  History,
  Moon,
  Clock,
} from 'lucide-react';

type SettingsTab = 'profile' | 'password' | 'preferences' | 'api-keys';

const PREFERENCES_STORAGE_KEY = 'nlsql_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  queryHistory: true,
  darkMode: false,
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? 'Recently'
      : d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  } catch {
    return dateStr;
  }
};

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Global messages
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ── Profile State ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState<string>(() => user?.full_name || '');
  const [role, setRole] = useState<UserRole>(() => (user?.role as UserRole) || 'manager');
  const [lastUserId, setLastUserId] = useState<string | undefined>(() => user?.id);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // ── Change Password State ──────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  // ── Preferences State ──────────────────────────────────────────────────────
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // fallback to defaults
    }
    return DEFAULT_PREFERENCES;
  });
  const [savingPreferences, setSavingPreferences] = useState<boolean>(false);

  // ── API Keys State ─────────────────────────────────────────────────────────
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(false);
  const [creatingKey, setCreatingKey] = useState<boolean>(false);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [createdKeyData, setCreatedKeyData] = useState<ApiKeyCreatedResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    try {
      setLoadingKeys(true);
      const keys = await apiKeysApi.list();
      setApiKeys(keys);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to load API keys.';
      setErrorMessage(msg);
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  // Sync profile form when user identity loads or switches
  useEffect(() => {
    if (user && user.id !== lastUserId) {
      setFullName(user.full_name || '');
      setRole((user.role as UserRole) || 'manager');
      setLastUserId(user.id);
    }
  }, [user, lastUserId]);

  // Apply dark mode preference on change/mount
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  // Fetch API keys when opening API keys tab
  useEffect(() => {
    if (activeTab === 'api-keys') {
      fetchApiKeys();
    }
  }, [activeTab, fetchApiKeys]);

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    clearMessages();
  };

  // ── 1. Profile Update Handler ──────────────────────────────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await authService.updateProfile({
        full_name: fullName.trim(),
        role,
      });

      // Synchronize global auth context and localStorage
      updateUser(updated);
      setSuccessMessage('Profile details updated successfully.');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to update profile. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── 2. Change Password Handler ─────────────────────────────────────────────
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('New password must be different from your current password.');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      // Clear password fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage(res.message || 'Password changed successfully.');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to change password. Please verify your current password.';
      setErrorMessage(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  // ── 3. Preferences Handler ─────────────────────────────────────────────────
  const handleTogglePreference = (key: keyof UserPreferences) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleSavePreferences = () => {
    clearMessages();
    setSavingPreferences(true);
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
      setSuccessMessage('Preferences saved successfully. These will persist across reloads.');
    } catch {
      setErrorMessage('Could not save preferences to local storage.');
    } finally {
      setTimeout(() => setSavingPreferences(false), 300);
    }
  };

  // ── 4. API Keys Handlers ───────────────────────────────────────────────────
  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const name = newKeyName.trim();
    if (!name) {
      setErrorMessage('Please provide a name/label for your API key.');
      return;
    }

    try {
      setCreatingKey(true);
      const created = await apiKeysApi.create(name);
      setCreatedKeyData(created);
      setNewKeyName('');
      setSuccessMessage('API key generated successfully! Make sure to copy it now.');
      // Refresh list
      await fetchApiKeys();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to generate API key.';
      setErrorMessage(msg);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleCopyKey = async (keyString: string) => {
    try {
      await navigator.clipboard.writeText(keyString);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleRevokeApiKey = async (keyId: string, keyName: string) => {
    if (!window.confirm(`Are you sure you want to revoke the API key "${keyName}"? Applications using this key will immediately lose access.`)) {
      return;
    }

    clearMessages();
    try {
      setRevokingKeyId(keyId);
      await apiKeysApi.revoke(keyId);
      setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      if (createdKeyData?.id === keyId) {
        setCreatedKeyData(null);
      }
      setSuccessMessage(`API key "${keyName}" was successfully revoked.`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to revoke API key.';
      setErrorMessage(msg);
    } finally {
      setRevokingKeyId(null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'password' as SettingsTab, label: 'Change Password', icon: Lock },
    { id: 'preferences' as SettingsTab, label: 'Preferences', icon: SlidersHorizontal },
    { id: 'api-keys' as SettingsTab, label: 'API Keys', icon: KeyRound },
  ];

  return (
    <AppLayout>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Settings & Profile</h1>
            <p className="text-xs text-slate-500">Manage account information, security credentials, preferences, and API keys</p>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ─────────────────────────────────────────── */}
      <div className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto">
        {/* Navigation Tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 mb-6 shadow-xs">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Feedback Alerts */}
        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-emerald-600 hover:text-emerald-800 cursor-pointer text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-800 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-600 hover:text-red-800 cursor-pointer text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── 1. PROFILE SECTION ────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your display name and role settings. Email address is managed by your account administrator.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                {user?.role || 'manager'}
              </span>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6">
              {/* User Avatar Badge */}
              <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                  {getInitials(fullName || user?.full_name || '')}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">
                    {fullName || user?.full_name || 'User'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>{user?.email}</span>
                    <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="capitalize text-blue-600 font-medium">{role}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Member since {formatDate(user?.created_at)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    This name will appear on your activity log and generated SQL reports.
                  </p>
                </div>

                {/* Email Address (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address <span className="text-slate-400 font-normal">(Read-only)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500 cursor-not-allowed select-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Your primary login email address cannot be changed directly.
                  </p>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    System Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="admin">Admin (Full permissions)</option>
                    <option value="manager">Manager (Database & query management)</option>
                    <option value="analyst">Analyst (Execute queries & export data)</option>
                    <option value="viewer">Viewer (Read-only)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Defines your database execution and administration permissions.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── 2. CHANGE PASSWORD SECTION ────────────────────────────────────── */}
        {activeTab === 'password' && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your account password. Ensure your password is at least 6 characters and unique.
              </p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6 max-w-xl">
              {/* Current Password */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password (min. 6 characters)"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Must be at least 6 characters. Use letters, numbers, and symbols for best security.
                </p>
              </div>

              {/* Confirm New Password */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {changingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── 3. PREFERENCES SECTION ────────────────────────────────────────── */}
        {activeTab === 'preferences' && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Application Preferences</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize your workspace experience. Your preferences are saved in your browser and persist across sessions.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Email Notifications */}
              <div className="flex items-start justify-between gap-6 py-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Email Notifications</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Receive email updates regarding schema indexing status, security alerts, and background job completions.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePreference('emailNotifications')}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    preferences.emailNotifications ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle email notifications"
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Query History */}
              <div className="flex items-start justify-between gap-6 py-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <History className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Query History Logging</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Save natural-language queries, generated SQL, and execution metrics to your personal Query History log.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePreference('queryHistory')}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    preferences.queryHistory ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle query history"
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.queryHistory ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Dark Mode */}
              <div className="flex items-start justify-between gap-6 py-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Moon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Dark Mode</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Switch between light and high-contrast dark visual mode for low-light working environments.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePreference('darkMode')}
                  className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    preferences.darkMode ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle dark mode"
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  disabled={savingPreferences}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {savingPreferences ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Preferences
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── 4. API KEYS SECTION ───────────────────────────────────────────── */}
        {activeTab === 'api-keys' && (
          <section className="space-y-6">
            {/* Generate Key Form Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">API Key Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate personal API keys to authenticate external scripts, CLI utilities, and automated services with NL2SQL.
                </p>
              </div>

              <form onSubmit={handleCreateApiKey} className="p-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                      Key Label / Purpose
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Reporting Bot, Python Analytics Script, CLI Access"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="sm:self-end">
                    <button
                      type="submit"
                      disabled={creatingKey}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {creatingKey ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Generate New Key
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Newly Created Key Modal / High-visibility Alert */}
            {createdKeyData && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-amber-900">
                        New API Key Created: <span className="underline decoration-amber-400">{createdKeyData.name}</span>
                      </h3>
                      <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                        <strong>Important:</strong> Please copy this key right now. For security purposes, this key is cryptographically hashed with SHA-256 and will <strong>never be shown again</strong> once you navigate away or close this box.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCreatedKeyData(null)}
                    className="text-xs font-semibold px-2.5 py-1 text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg cursor-pointer"
                  >
                    Done
                  </button>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-stretch gap-2 bg-white p-2 rounded-xl border border-amber-200">
                  <div className="flex-1 font-mono text-sm px-3 py-2 text-slate-900 bg-slate-50 rounded-lg break-all select-all flex items-center">
                    {createdKeyData.api_key}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyKey(createdKeyData.api_key)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* List of Existing API Keys */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Your Active API Keys</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Keys associated with your account ({user?.email}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchApiKeys}
                  disabled={loadingKeys}
                  className="text-xs text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {loadingKeys ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-xs">Loading API keys...</p>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">No API keys generated yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Use the form above to generate your first API key for scripts and programmatic integrations.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {apiKeys.map((key) => {
                    const isRevoking = revokingKeyId === key.id;
                    return (
                      <div
                        key={key.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{key.name}</h4>
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-[11px]">
                              {key.key_prefix}
                            </span>
                            <span>•</span>
                            <span>Created {formatDate(key.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleRevokeApiKey(key.id, key.name)}
                            disabled={isRevoking}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Revoke and permanently delete this API key"
                          >
                            {isRevoking ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Revoke Key
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default SettingsPage;