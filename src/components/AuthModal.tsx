import React, { useState } from 'react';
import { X, Loader2, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        setResetSent(true);
      } else if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      setEmail('');
      setPassword('');
      if (!isForgotPassword) {
        onAuthenticated();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setIsForgotPassword(false);
    setResetSent(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create an Account' : 'Sign In'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {resetSent ? (
          <div className="text-center space-y-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
              Password reset instructions have been sent to your email.
            </div>
            <button
              onClick={handleBack}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isForgotPassword ? (
                'Send Reset Instructions'
              ) : isSignUp ? (
                'Sign Up'
              ) : (
                'Sign In'
              )}
            </button>

            <div className="mt-4 text-center space-y-2">
              {!isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              )}
              
              {!isSignUp && !isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                  }}
                  className="block w-full text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  Forgot your password?
                </button>
              )}

              {isForgotPassword && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;