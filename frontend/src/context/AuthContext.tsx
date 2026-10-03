import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  googleLogin: (email?: string, name?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('nlsql_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nlsql_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('nlsql_token');
      if (storedToken) {
        try {
          const currentUser = await authService.getMe();
          setUser(currentUser);
          localStorage.setItem('nlsql_user', JSON.stringify(currentUser));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('nlsql_token');
          localStorage.removeItem('nlsql_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const data = await authService.login(payload);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('nlsql_token', data.access_token);
      localStorage.setItem('nlsql_user', JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const data = await authService.register(payload);
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('nlsql_token', data.access_token);
      localStorage.setItem('nlsql_user', JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (customEmail?: string, customName?: string) => {
    setIsLoading(true);
    try {
      const email = customEmail || 'john.doe@company.com';
      const name = customName || 'John Doe';
      const data = await authService.googleAuth({
        email,
        name,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      });
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('nlsql_token', data.access_token);
      localStorage.setItem('nlsql_user', JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('nlsql_token');
    localStorage.removeItem('nlsql_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('nlsql_user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
        localStorage.setItem('nlsql_user', JSON.stringify(currentUser));
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
