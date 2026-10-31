import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, type ThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services/authService';
import { AppLayout } from '../components/AppLayout';
import type { Language } from '../types/auth';
import {
  User,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Laptop,
  Camera,
  Trash2,
  Upload,
  AlertTriangle,
  Globe,
} from 'lucide-react';

type SettingsTab = 'profile' | 'password' | 'appearance' | 'language';

// Allowed image MIME types for client-side validation
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// Maximum file size: 2 MB
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? 'Recently'
      : d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
  } catch {
    return dateStr;
  }
};

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { themeMode, setThemeMode, resolvedTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ── Profile ───────────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState<string>(() => user?.full_name || '');
  const [lastUserId, setLastUserId] = useState<string | undefined>(() => user?.id);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // ── Avatar ────────────────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => user?.avatar_url ?? null);
  const [savingAvatar, setSavingAvatar] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<string>('');
  const [avatarDirty, setAvatarDirty] = useState<boolean>(false);
  const [pendingAvatarDataUrl, setPendingAvatarDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Change Password ───────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  // ── Delete Account (Danger Zone) ──────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');

  // ── Language changing state ───────────────────────────────────────────────
  const [savingLanguage, setSavingLanguage] = useState<boolean>(false);

  // Sync profile fields when user changes
  useEffect(() => {
    if (user && user.id !== lastUserId) {
      setFullName(user.full_name || '');
      setAvatarPreview(user.avatar_url ?? null);
      setLastUserId(user.id);
    }
  }, [user, lastUserId]);

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
    setDeleteError('');
  };

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    clearMessages();
  };

  // ── Profile handlers ──────────────────────────────────────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!fullName.trim()) {
      setErrorMessage(t.settings.nameRequired);
      return;
    }
    if (fullName.trim().length < 2) {
      setErrorMessage(t.settings.nameMinLength);
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await authService.updateProfile({
        full_name: fullName.trim(),
      });
      updateUser(updated);
      setSuccessMessage(t.settings.profileUpdatedSuccess);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail
        || (err as { message?: string })?.message
        || 'Failed to update profile. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Avatar handlers ───────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError(t.settings.photoInvalidType);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setAvatarError(t.settings.photoTooLarge.replace('{size}', sizeMb));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatarPreview(dataUrl);
      setPendingAvatarDataUrl(dataUrl);
      setAvatarDirty(true);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarError('');
    setAvatarPreview(null);
    setPendingAvatarDataUrl(null);
    setAvatarDirty(true);
  };

  const handleCancelAvatarEdit = () => {
    setAvatarError('');
    setAvatarPreview(user?.avatar_url ?? null);
    setPendingAvatarDataUrl(null);
    setAvatarDirty(false);
  };

  const handleSaveAvatar = async () => {
    clearMessages();
    setSavingAvatar(true);
    setAvatarError('');
    try {
      const updated = await authService.updateAvatar(pendingAvatarDataUrl);
      updateUser(updated);
      setAvatarPreview(updated.avatar_url ?? null);
      setPendingAvatarDataUrl(null);
      setAvatarDirty(false);
      setSuccessMessage(
        pendingAvatarDataUrl ? t.settings.photoSavedSuccess : t.settings.photoRemovedSuccess,
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || 'Failed to save profile picture. Please try again.';
      setAvatarError(msg);
      setAvatarPreview(user?.avatar_url ?? null);
      setAvatarDirty(false);
      setPendingAvatarDataUrl(null);
    } finally {
      setSavingAvatar(false);
    }
  };

  // ── Change Password handlers ──────────────────────────────────────────────
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage(t.settings.fillAllPwFields);
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage(t.settings.pwMinChars);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(t.settings.pwMismatch);
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMessage(t.settings.pwSameAsCurrent);
      return;
    }

    try {
      setChangingPassword(true);
      const res = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage(res.message || t.settings.passwordUpdatedSuccess);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data?.detail
        || (err as { message?: string })?.message
        || 'Failed to change password. Please verify your current password.';
      setErrorMessage(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  // ── Language Preference Handler ───────────────────────────────────────────
  const handleLanguageChange = async (newLang: Language) => {
    if (newLang === language) return;
    clearMessages();
    setSavingLanguage(true);
    try {
      await setLanguage(newLang);
      setSuccessMessage(t.settings.languageUpdatedSuccess);
    } catch (err: unknown) {
      console.error('Failed to change language:', err);
    } finally {
      setSavingLanguage(false);
    }
  };

  // ── Delete Account handlers ───────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim() !== 'DELETE') {
      setDeleteError(t.settings.deleteWordError);
      return;
    }

    setDeleteError('');
    setIsDeletingAccount(true);

    try {
      await authService.deleteAccount();
      logout();
      navigate('/login');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || t.settings.deleteFailed;
      setDeleteError(msg);
      setIsDeletingAccount(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
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
    { id: 'profile' as SettingsTab, label: t.settings.tabProfile, icon: User },
    { id: 'password' as SettingsTab, label: t.settings.tabPassword, icon: Lock },
    { id: 'appearance' as SettingsTab, label: t.settings.tabAppearance, icon: Sun },
    { id: 'language' as SettingsTab, label: t.settings.tabLanguage, icon: Globe },
  ];

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-input text-sm text-app-text placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';

  const deleteWarningText = t.settings.deleteConfirmWarning.replace('{email}', user?.email || '');
  const deleteTypePrompt = t.settings.deleteTypeConfirm.replace('{word}', 'DELETE');

  return (
    <AppLayout>
      <header className="h-16 bg-app-surface border-b border-app-border flex items-center px-8 flex-shrink-0 sticky top-0 z-10 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-app-text leading-tight">{t.settings.headerTitle}</h1>
            <p className="text-xs text-app-text-muted">{t.settings.headerSubtitle}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto">
        {/* Tab navigation */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-1.5 mb-6 shadow-xs transition-colors">
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
                      : 'text-app-text-muted hover:text-app-text hover:bg-app-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global messages */}
        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3.5 text-sm text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-600 dark:text-emerald-400 cursor-pointer text-xs">
              {t.common.dismiss}
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800/80 bg-red-50 dark:bg-red-950/40 px-4 py-3.5 text-sm text-red-800 dark:text-red-300">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button onClick={() => setErrorMessage('')} className="text-red-600 dark:text-red-400 cursor-pointer text-xs">
              {t.common.dismiss}
            </button>
          </div>
        )}

        {/* ── Profile Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* ── Profile Picture card ── */}
            <section className="bg-app-surface border border-app-border rounded-2xl shadow-xs overflow-hidden transition-colors">
              <div className="p-6 border-b border-app-border">
                <h2 className="text-base font-bold text-app-text">{t.settings.avatarSectionTitle}</h2>
                <p className="text-xs text-app-text-muted mt-0.5">
                  {t.settings.avatarSectionSubtitle}
                </p>
              </div>
              <div className="p-6">
                {avatarError && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800/80 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-800 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{avatarError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Avatar preview */}
                  <div className="relative flex-shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile picture"
                        className="w-24 h-24 rounded-full object-cover border-2 border-app-border shadow-sm"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold border-2 border-app-border shadow-sm select-none">
                        {getInitials(fullName || user?.full_name || '')}
                      </div>
                    )}

                    {/* Camera overlay button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title={t.settings.changePhotoBtn}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ALLOWED_TYPES.join(',')}
                      className="hidden"
                      onChange={handleFileChange}
                      aria-label="Upload profile picture"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-app-text-muted">
                      {avatarPreview
                        ? t.settings.avatarSetMessage
                        : t.settings.avatarNoneMessage}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-app-border bg-app-input hover:bg-app-muted text-app-text rounded-xl text-sm font-medium transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        {avatarPreview ? t.settings.changePhotoBtn : t.settings.uploadPhotoBtn}
                      </button>

                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/60 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t.settings.removePhotoBtn}
                        </button>
                      )}
                    </div>

                    {/* Pending changes action bar */}
                    {avatarDirty && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-app-border">
                        <button
                          type="button"
                          onClick={handleSaveAvatar}
                          disabled={savingAvatar}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                        >
                          {savingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {savingAvatar ? t.settings.savingPictureBtn : t.settings.savePictureBtn}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelAvatarEdit}
                          disabled={savingAvatar}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-app-border bg-app-input hover:bg-app-muted text-app-text rounded-xl text-sm font-medium transition-colors cursor-pointer"
                        >
                          {t.common.cancel}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Personal Information card ── */}
            <section className="bg-app-surface border border-app-border rounded-2xl shadow-xs overflow-hidden transition-colors">
              <div className="p-6 border-b border-app-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-app-text">{t.settings.personalInfoTitle}</h2>
                  <p className="text-xs text-app-text-muted mt-0.5">
                    {t.settings.personalInfoSubtitle}
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 capitalize">
                  {user?.role || 'user'}
                </span>
              </div>

              <form onSubmit={handleProfileSubmit} className="p-6">
                <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-app-muted border border-app-border">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-app-border shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-xs flex-shrink-0">
                      {getInitials(fullName || user?.full_name || '')}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-app-text text-base">
                      {fullName || user?.full_name || 'User'}
                    </h3>
                    <p className="text-xs text-app-text-muted mt-0.5 flex items-center gap-1.5">
                      <span>{user?.email}</span>
                      <span className="inline-block w-1 h-1 rounded-full bg-app-border"></span>
                      <span className="capitalize text-blue-600 dark:text-blue-400 font-medium">{user?.role}</span>
                    </p>
                    <p className="text-[11px] text-app-text-muted mt-1">
                      {t.settings.memberSince.replace('{date}', formatDate(user?.created_at))}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-2">
                      {t.settings.fullNameLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder={t.settings.fullNamePlaceholder}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-2">
                      {t.settings.emailLabel} <span className="text-app-text-muted font-normal">{t.settings.emailNote}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className={`${inputClass} bg-app-muted text-app-text-muted cursor-not-allowed`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-2">
                      {t.settings.roleLabel} <span className="text-app-text-muted font-normal">{t.settings.roleNote}</span>
                    </label>
                    <input
                      type="text"
                      value={user?.role || 'user'}
                      disabled
                      className={`${inputClass} bg-app-muted text-app-text-muted cursor-not-allowed capitalize`}
                    />
                    <p className="text-[11px] text-app-text-muted mt-1.5">
                      {t.settings.roleNotice}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-app-border flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t.settings.saveProfileBtn}
                  </button>
                </div>
              </form>
            </section>

            {/* ── Danger Zone: Delete Account card ── */}
            <section className="bg-app-surface border border-red-300 dark:border-red-900/60 rounded-2xl shadow-xs overflow-hidden transition-colors">
              <div className="p-6 border-b border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-red-600 dark:text-red-400">{t.settings.dangerZoneTitle}</h2>
                    <p className="text-xs text-app-text-muted">{t.settings.dangerZoneSubtitle}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-app-text">{t.settings.deleteAccountTitle}</h3>
                    <p className="text-xs text-app-text-muted mt-1 max-w-xl">
                      {t.settings.deleteAccountDesc}
                    </p>
                  </div>
                  {!showDeleteConfirm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setDeleteConfirmationText('');
                        setDeleteError('');
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t.settings.deleteAccountBtn}
                    </button>
                  )}
                </div>

                {/* Explicit confirmation drawer */}
                {showDeleteConfirm && (
                  <div className="mt-6 p-5 rounded-xl border border-red-300 dark:border-red-800 bg-red-50/80 dark:bg-red-950/40 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-red-700 dark:text-red-300">
                          {t.settings.deleteConfirmTitle}
                        </h4>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 leading-relaxed">
                          {deleteWarningText}
                        </p>
                      </div>
                    </div>

                    {deleteError && (
                      <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 text-xs font-medium">
                        {deleteError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-2">
                        {deleteTypePrompt}
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        placeholder={t.settings.deleteInputPlaceholder}
                        className={`${inputClass} border-red-300 dark:border-red-700 focus:border-red-600 focus:ring-red-500/20`}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmationText('');
                          setDeleteError('');
                        }}
                        disabled={isDeletingAccount}
                        className="px-4 py-2 border border-app-border bg-app-input hover:bg-app-muted text-app-text rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount || deleteConfirmationText.trim() !== 'DELETE'}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {t.settings.deletingBtn}
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            {t.settings.deleteConfirmBtn}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ── Change Password Tab ──────────────────────────────────────────── */}
        {activeTab === 'password' && (
          <section className="bg-app-surface border border-app-border rounded-2xl shadow-xs overflow-hidden transition-colors">
            <div className="p-6 border-b border-app-border">
              <h2 className="text-base font-bold text-app-text">{t.settings.changePasswordTitle}</h2>
              <p className="text-xs text-app-text-muted mt-0.5">
                {t.settings.changePasswordSubtitle}
              </p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6 max-w-xl">
              <div className="mb-5">
                <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-2">
                  {t.settings.currentPasswordLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder={t.settings.currentPasswordPlaceholder}
                    autoComplete="current-password"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted p-1 cursor-pointer"
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-2">
                  {t.settings.newPasswordLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder={t.settings.newPasswordPlaceholder}
                    autoComplete="new-password"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted p-1 cursor-pointer"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-2">
                  {t.settings.confirmPasswordLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={t.settings.confirmPasswordPlaceholder}
                    autoComplete="new-password"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text-muted p-1 cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-app-border">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {t.settings.updatePasswordBtn}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── Appearance Tab ───────────────────────────────────────────────── */}
        {activeTab === 'appearance' && (
          <section className="bg-app-surface border border-app-border rounded-2xl shadow-xs overflow-hidden transition-colors">
            <div className="p-6 border-b border-app-border">
              <h2 className="text-base font-bold text-app-text">{t.settings.appearanceTitle}</h2>
              <p className="text-xs text-app-text-muted mt-0.5">
                {t.settings.appearanceSubtitle}
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {resolvedTheme === 'dark' ? (
                    <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-app-text">{t.settings.themeCardTitle}</h3>
                  <p className="text-xs text-app-text-muted mt-0.5">
                    {themeMode === 'system'
                      ? t.settings.themeActiveSystem.replace('{resolved}', resolvedTheme)
                      : resolvedTheme === 'dark'
                      ? t.settings.themeActiveDark
                      : t.settings.themeActiveLight}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { mode: 'light' as ThemeMode, label: t.settings.themeLightLabel, description: t.settings.themeLightDesc, icon: Sun },
                  { mode: 'dark' as ThemeMode, label: t.settings.themeDarkLabel, description: t.settings.themeDarkDesc, icon: Moon },
                  { mode: 'system' as ThemeMode, label: t.settings.themeSystemLabel, description: t.settings.themeSystemDesc, icon: Laptop },
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = themeMode === option.mode;
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      onClick={() => setThemeMode(option.mode)}
                      className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-app-border bg-app-input text-app-text hover:bg-app-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-app-muted text-app-text-muted'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                            {t.common.active}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-app-text">{option.label}</span>
                      <span className="text-xs text-app-text-muted mt-1">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Language Preferences Tab ─────────────────────────────────────── */}
        {activeTab === 'language' && (
          <section className="bg-app-surface border border-app-border rounded-2xl shadow-xs overflow-hidden transition-colors">
            <div className="p-6 border-b border-app-border">
              <h2 className="text-base font-bold text-app-text">{t.settings.languageTitle}</h2>
              <p className="text-xs text-app-text-muted mt-0.5">
                {t.settings.languageSubtitle}
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-app-text">{t.settings.currentLanguageLabel}</h3>
                  <p className="text-xs text-app-text-muted mt-0.5">
                    {language === 'hi' ? t.settings.langHindiName : t.settings.langEnglishName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* English Option */}
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  disabled={savingLanguage}
                  className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    language === 'en'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-app-border bg-app-input text-app-text hover:bg-app-muted'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={`p-2 rounded-xl ${language === 'en' ? 'bg-blue-600 text-white' : 'bg-app-muted text-app-text-muted'}`}>
                      <Globe className="w-5 h-5" />
                    </div>
                    {language === 'en' && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                        {t.common.active}
                      </span>
                    )}
                  </div>
                  <span className="text-base font-bold text-app-text">{t.settings.langEnglishName}</span>
                  <span className="text-xs text-app-text-muted mt-1 leading-relaxed">{t.settings.langEnglishDesc}</span>
                </button>

                {/* Hindi Option */}
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi')}
                  disabled={savingLanguage}
                  className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                    language === 'hi'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-app-border bg-app-input text-app-text hover:bg-app-muted'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={`p-2 rounded-xl ${language === 'hi' ? 'bg-blue-600 text-white' : 'bg-app-muted text-app-text-muted'}`}>
                      <Globe className="w-5 h-5" />
                    </div>
                    {language === 'hi' && (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-600 text-white uppercase tracking-wider">
                        {t.common.active}
                      </span>
                    )}
                  </div>
                  <span className="text-base font-bold text-app-text">{t.settings.langHindiName}</span>
                  <span className="text-xs text-app-text-muted mt-1 leading-relaxed">{t.settings.langHindiDesc}</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
