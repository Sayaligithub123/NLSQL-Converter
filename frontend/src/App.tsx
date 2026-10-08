import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth pages (public)
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// App pages (protected)
import { DashboardPage } from './pages/DashboardPage';
import { ConnectDatabasePage } from './pages/ConnectDatabasePage';
import { SchemaIndexingPlaceholderPage } from './pages/SchemaIndexingPlaceholderPage';
import { AssistantPage } from './pages/AssistantPage';
import { QueryHistoryPage } from './pages/QueryHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Public Auth Routes ─────────────────────────────────── */}
          <Route
            path="/"
            element={<LoginPage />}
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />

          <Route
            path="/reset-password"
            element={<ForgotPasswordPage />}
          />


          {/* ── Protected App Routes ───────────────────────────────── */}

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Databases */}
          <Route
            path="/databases"
            element={
              <ProtectedRoute>
                <ConnectDatabasePage />
              </ProtectedRoute>
            }
          />

          {/* AI Assistant */}
          <Route
            path="/assistant"
            element={
              <ProtectedRoute>
                <AssistantPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assistant/:connectionId"
            element={
              <ProtectedRoute>
                <AssistantPage />
              </ProtectedRoute>
            }
          />

          {/* Query History */}
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <QueryHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Schema Indexing */}
          <Route
            path="/schema-indexing/:connectionId"
            element={
              <ProtectedRoute>
                <SchemaIndexingPlaceholderPage />
              </ProtectedRoute>
            }
          />

          {/* Settings & Profile */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;