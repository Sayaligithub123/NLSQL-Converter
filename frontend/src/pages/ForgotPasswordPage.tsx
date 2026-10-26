import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { AuthGraphic } from '../components/AuthGraphic';
import {
  Database,
  ArrowLeft,
  ShieldAlert,
  Globe,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

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

      <AuthGraphic />

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-app-surface overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3 text-white">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-xl font-bold text-app-text tracking-tight">NL2SQL</h2>
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">AI</span>
            </div>
            <p className="text-xs text-app-text-muted font-medium">{t.nav.brandSubtitle}</p>

            <h1 className="text-2xl sm:text-3xl font-bold text-app-text mt-6 tracking-tight">
              {t.forgotPassword.title}
            </h1>
            <p className="text-sm text-app-text-muted mt-1">
              {t.forgotPassword.subtitle}
            </p>
          </div>

          <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-sm flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1.5">
              <div className="font-semibold text-amber-950 dark:text-amber-100">
                {t.forgotPassword.noticeTitle}
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                {t.forgotPassword.noticeDesc}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.forgotPassword.returnToSignIn}
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-app-text-muted">
              {t.forgotPassword.noAccountPrompt}{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {t.forgotPassword.signUpLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
