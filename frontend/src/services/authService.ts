import { api } from './api';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  GoogleAuthPayload,
  User,
  DbStatusResponse,
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

  async updateProfile(data: { full_name?: string; role?: string }): Promise<User> {
    const response = await api.put<User>('/auth/profile', data);
    return response.data;
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string; reset_token?: string; reset_link?: string }> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', { token, new_password });
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
