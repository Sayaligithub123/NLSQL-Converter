import { api } from './api';
import type { ApiKey, ApiKeyCreatedResponse } from '../types/auth';

export const apiKeysApi = {
  /**
   * Fetch all active API keys for the authenticated user.
   */
  async list(): Promise<ApiKey[]> {
    const response = await api.get<ApiKey[]>('/api-keys');
    return response.data;
  },

  /**
   * Generate a new API key.
   * Note: The plaintext key is returned ONLY once in this response.
   */
  async create(name: string): Promise<ApiKeyCreatedResponse> {
    const response = await api.post<ApiKeyCreatedResponse>('/api-keys', { name });
    return response.data;
  },

  /**
   * Revoke/delete an API key permanently.
   */
  async revoke(keyId: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api-keys/${keyId}`);
    return response.data;
  },
};
