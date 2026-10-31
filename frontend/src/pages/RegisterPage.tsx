import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AuthGraphic } from '../components/AuthGraphic';
import type { UserRole } from '../types/auth';
import {
  Database,
  Mail,
  Lock,
  User as UserIcon,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Globe,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [role, setRole] = useState<UserRole>('manager');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage(t.register.fillAllFields);
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t.register.passwordLength);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.register.passwordsMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setErrorMessage(
        typeof detail === 'string'
          ? detail
          : t.register.registerFailed
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    setErrorMessage(t.register.googleNotConfigured);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="min-h-screen w-full flex bg-app-bg relative">
      {/* Top right language switcher toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-app-border bg-app-surface hover:bg-app-muted text-xs font-medium text-app-text shadow-xs transition-colors cursor-pointer"
          title={language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
        >
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
        </button>
      </div>

      {/* Left Pane: Branding & Graphics */}
      <AuthGraphic />

      {/* Right Pane: Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-app-surface overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3 text-white">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-xl font-bold text-app-text tracking-tight">NL2SQL</h2>
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">AI</span>
            </div>
            <p className="text-xs text-app-text-muted font-medium">{t.nav.brandSubtitle}</p>

            <h1 className="text-2xl sm:text-3xl font-bold text-app-text mt-5 tracking-tight">
              {t.register.createAccount}
            </h1>
            <p className="text-sm text-app-text-muted mt-1">
              {t.register.createSubtitle}
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-1">
                {t.register.fullNameLabel}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-text-muted">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.register.fullNamePlaceholder}
                  className="block w-full pl-10 pr-3.5 py-2 bg-app-input border border-app-border rounded-xl text-sm placeholder-app-text-muted text-app-text focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-1">
                {t.register.emailLabel}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.register.emailPlaceholder}
                  autoComplete="email"
                  className="block w-full pl-10 pr-3.5 py-2 bg-app-input border border-app-border rounded-xl text-sm placeholder-app-text-muted text-app-text focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* Role Field */}
            <div>
              <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-1">
                {t.register.roleLabel}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-text-muted">
                  <Shield className="w-4 h-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="block w-full pl-10 pr-8 py-2 bg-app-input border border-app-border rounded-xl text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                >
                  <option value="manager">{t.register.roles.manager}</option>
                  <option value="analyst">{t.register.roles.analyst}</option>
                  <option value="admin">{t.register.roles.admin}</option>
                  <option value="viewer">{t.register.roles.viewer}</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-1">
                {t.register.passwordLabel}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.register.passwordPlaceholder}
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-10 py-2 bg-app-input border border-app-border rounded-xl text-sm placeholder-app-text-muted text-app-text focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-app-text-muted hover:text-app-text focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-app-text uppercase tracking-wider mb-1">
                {t.register.confirmPasswordLabel}
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.register.confirmPasswordPlaceholder}
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-3.5 py-2 bg-app-input border border-app-border rounded-xl text-sm placeholder-app-text-muted text-app-text focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                />
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.register.creatingAccountBtn}
                </>
              ) : (
                t.register.createAccountBtn
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-app-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-app-surface px-3 text-app-text-muted font-semibold tracking-wider">
                {t.register.orSignUpWith}
              </span>
            </div>
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full py-2.5 px-4 border border-app-border bg-app-input hover:bg-app-muted text-app-text font-medium text-sm rounded-xl shadow-xs focus:outline-none transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <span>{t.register.continueWithGoogle}</span>
          </button>

          {/* Footer Navigation */}
          <div className="mt-6 text-center">
            <p className="text-xs text-app-text-muted">
              {t.register.alreadyHaveAccount}{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t.register.signInLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
