import { api } from './api';
import type { ChatRequest, ChatResponse, SchemaResponse, QueryHistoryDoc } from '../types/chat';

/**
 * Send a natural-language question to the AI chatbot.
 * The backend will convert it to SQL, execute it, and return results.
 */
export const sendChatMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat/query', payload, {
    timeout: 60000, // Gemini + DB execution can take time
  });
  return response.data;
};

/**
 * Fetch the full schema for a saved database connection.
 * Password is required per-session (never stored in localStorage).
 */
export const getConnectionSchema = async (
  connectionId: string,
  dbPassword: string,
): Promise<SchemaResponse> => {
  const response = await api.post<SchemaResponse>(`/chat/schema/${connectionId}`, {
    db_password: dbPassword,
  });
  return response.data;
};

/**
 * Fetch the authenticated user's query history (most recent first).
 */
export const getQueryHistory = async (limit = 100): Promise<QueryHistoryDoc[]> => {
  const response = await api.get<QueryHistoryDoc[]>('/chat/history', { params: { limit } });
  return response.data;
};
