// chat.ts — TypeScript types for the AI Chat feature

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  connection_id: string;
  db_password: string;
  question: string;
  chat_history: ChatMessage[];
}

export interface ChatResponse {
  success: boolean;
  question: string;
  sql?: string;
  columns: string[];
  results: (string | number | null)[][];
  row_count: number;
  error?: string;
  execution_time_ms?: number;
  cannot_convert: boolean;
}

export interface SchemaColumn {
  column: string;
  type: string;
  nullable: boolean;
  key: string;
  default?: string;
  extra: string;
}

export interface SchemaResponse {
  success: boolean;
  database: string;
  tables: Record<string, SchemaColumn[]>;
  error?: string;
}

export interface QueryHistoryDoc {
  id: string;
  user_id: string;
  connection_id: string;
  database_name: string;
  question: string;
  sql: string;
  row_count: number;
  success: boolean;
  error?: string;
  execution_time_ms?: number;
  created_at: string;
}

// UI-only: a message shown in the chat bubble list
export interface ChatBubble {
  id: string;
  role: 'user' | 'assistant' | 'system';
  question?: string;
  content?: string;        // plain text message
  sql?: string;            // generated SQL (for assistant)
  columns?: string[];
  results?: (string | number | null)[][];
  row_count?: number;
  error?: string;
  cannot_convert?: boolean;
  execution_time_ms?: number;
  timestamp: Date;
  loading?: boolean;
}
