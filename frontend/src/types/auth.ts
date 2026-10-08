export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  avatar_url?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

export interface GoogleAuthPayload {
  email: string;
  name: string;
  picture?: string;
}

export interface DbStatusResponse {
  connected: boolean;
  is_mock: boolean;
  mode: string;
  uri: string;
  database: string;
  error?: string | null;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string | null;
  is_active: boolean;
}

export interface ApiKeyCreatedResponse extends ApiKey {
  api_key: string;
  message?: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  role?: UserRole | string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  queryHistory: boolean;
  darkMode: boolean;
}

