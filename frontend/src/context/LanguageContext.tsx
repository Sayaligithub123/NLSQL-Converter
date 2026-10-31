import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Language } from '../types/auth';
import { translations, type Translations } from '../i18n/translations';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
}

const STORAGE_KEY = 'nlsql_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();

  const [language, setLanguageState] = useState<Language>(() => {
    // 1. First check if user is already in local storage or auth
    if (user?.language === 'en' || user?.language === 'hi') {
      return user.language;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'hi') {
      return saved;
    }
    return 'en';
  });

  // Sync state if user's language preference is loaded/changed from backend
  useEffect(() => {
    if (user?.language && (user.language === 'en' || user.language === 'hi')) {
      if (user.language !== language) {
        setLanguageState(user.language);
        localStorage.setItem(STORAGE_KEY, user.language);
      }
    }
  }, [user?.language]);

  // Sync html lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    document.documentElement.lang = newLang;

    // If user is authenticated, persist to MongoDB
    if (user) {
      try {
        const updated = await authService.updateLanguage(newLang);
        updateUser(updated);
      } catch (err) {
        console.error('Failed to persist language preference to backend:', err);
      }
    }
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
