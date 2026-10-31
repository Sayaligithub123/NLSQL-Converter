import { api } from './api';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  GoogleAuthPayload,
  User,
  DbStatusResponse,
  Language,
} from '../types/auth';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },

  async googleAuth(payload: GoogleAuthPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google', payload);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async updateProfile(data: { full_name?: string; language?: Language }): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    return response.data;
  },

  /**
   * Update the user's language preference on the backend.
   */
  async updateLanguage(language: Language): Promise<User> {
    const response = await api.put<User>('/auth/language', { language });
    return response.data;
  },

  /**
   * Upload or remove the profile picture for the current user.
   * @param avatarDataUrl Base64 data URL (e.g. "data:image/png;base64,...").
   *                      Pass null to remove the current avatar.
   */
  async updateAvatar(avatarDataUrl: string | null): Promise<User> {
    const response = await api.put<User>('/auth/avatar', {
      avatar_data_url: avatarDataUrl,
    });
    return response.data;
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  /**
   * Permanently delete the current user's account.
   */
  async deleteAccount(): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>('/auth/account');
    return response.data;
  },

  async getDbStatus(): Promise<DbStatusResponse> {
    const response = await api.get<DbStatusResponse>('/auth/db-status');
    return response.data;
  },

  async seedDemoUser(): Promise<{ message: string; email: string; password: string }> {
    const response = await api.post('/auth/seed-demo');
    return response.data;
  },
};
