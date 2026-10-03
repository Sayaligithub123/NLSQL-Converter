import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthGraphic } from '../components/AuthGraphic';
import {
  Database,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessMessage(res.message);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to process password reset request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please enter both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!resetToken) {
      setErrorMessage('Reset token is missing.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await authService.resetPassword(resetToken, newPassword);
      setResetSuccess(true);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to reset password. Token may be expired.'
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      <AuthGraphic />

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3 text-white">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">NL2SQL</h2>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">AI</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">AI Database Assistant</p>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-6 tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter your email and we'll help you securely reset it
            </p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-start space-x-2.5">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {/* Flow Step 1: Request Reset */}
          {!resetToken && !resetSuccess && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@company.com"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          {/* Flow Step 2: Set New Password with Token */}
          {resetToken && !resetSuccess && (
            <form onSubmit={handleConfirmReset} className="space-y-4 mt-2">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Reset token verified for <strong>{email}</strong></span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-70 cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Confirm & Set New Password'
                )}
              </button>
            </form>
          )}

          {/* Reset Finished */}
          {resetSuccess && (
            <div className="mt-4">
              <Link
                to="/login"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center"
              >
                Sign In With New Password
              </Link>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
