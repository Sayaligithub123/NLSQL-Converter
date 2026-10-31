import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
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
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
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

              {/* Connect DB (Screen 2) */}
              <Route
                path="/databases/connect"
                element={
                  <ProtectedRoute>
                    <ConnectDatabasePage />
                  </ProtectedRoute>
                }
              />

              {/* Indexing / Schema (Screen 3) */}
              <Route
                path="/databases/indexing"
                element={
                  <ProtectedRoute>
                    <SchemaIndexingPlaceholderPage />
                  </ProtectedRoute>
                }
              />

              {/* Databases fallback to connect for now */}
              <Route
                path="/databases"
                element={
                  <ProtectedRoute>
                    <ConnectDatabasePage />
                  </ProtectedRoute>
                }
              />

              {/* AI Assistant (Screen 4 & 5) */}
              <Route
                path="/assistant"
                element={
                  <ProtectedRoute>
                    <AssistantPage />
                  </ProtectedRoute>
                }
              />

              {/* Query History (Screen 6) */}
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <QueryHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Users management */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <div className="p-8 text-center text-slate-500">
                      Users module placeholder
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Settings & Profile (Screen 7) */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
