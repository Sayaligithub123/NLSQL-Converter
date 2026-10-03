import { api } from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DBConnectionPayload {
  db_type: 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export interface ConnectSaveResult {
  success: boolean;
  message: string;
  connection_id?: string;
}

export interface DatabaseConnection {
  id: string;
  user_id: string;
  db_type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Service Functions ─────────────────────────────────────────────────────────

/**
 * Test a MySQL connection without saving.
 * Uses the existing Axios instance (which attaches JWT automatically if present).
 */
export const testDatabaseConnection = async (
  payload: DBConnectionPayload
): Promise<TestConnectionResult> => {
  const response = await api.post<TestConnectionResult>(
    '/databases/test-connection',
    payload,
    { timeout: 15000 } // give MySQL connect_timeout room
  );
  return response.data;
};

/**
 * Test and save a MySQL connection (requires JWT).
 * Password is sent to backend but NEVER stored in localStorage or returned.
 */
export const connectDatabase = async (
  payload: DBConnectionPayload
): Promise<ConnectSaveResult> => {
  const response = await api.post<ConnectSaveResult>(
    '/databases/connect',
    payload,
    { timeout: 15000 }
  );
  return response.data;
};

/**
 * Fetch all database connections belonging to the authenticated user.
 */
export const getUserConnections = async (): Promise<DatabaseConnection[]> => {
  const response = await api.get<DatabaseConnection[]>('/databases/');
  return response.data;
};

/**
 * Delete a database connection by ID.
 */
export const deleteConnection = async (connectionId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/databases/${connectionId}`);
  return response.data;
};
