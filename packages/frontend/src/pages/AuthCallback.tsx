import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import config from '../config';

const TOKEN_STORAGE_KEY = 'auth_tokens';
const USER_STORAGE_KEY = 'auth_user';
const SESSION_STORAGE_KEY = 'auth_session';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing (React StrictMode runs effects twice in dev)
    if (hasProcessed.current) {
      return;
    }

    const handleCallback = async () => {
      hasProcessed.current = true;

      try {
        // Get authorization code from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        // Check for errors from OAuth provider
        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Verify state to prevent CSRF attacks
        const storedState = sessionStorage.getItem('oauth_state');
        if (state && storedState && state !== storedState) {
          setError('Invalid state parameter - possible CSRF attack');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Exchange code for tokens
        const redirectUri = `${window.location.origin}/auth/callback`;
        const callbackUrl = new URL(`${config.api.url}/api/auth/callback`);
        callbackUrl.searchParams.append('code', code);
        callbackUrl.searchParams.append('redirect_uri', redirectUri);

        const response = await fetch(callbackUrl.toString());

        if (!response.ok) {
          throw new Error('Failed to exchange authorization code');
        }

        const data = await response.json();

        // Store tokens and user info
        const tokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
        };

        localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);

        // Clear state from session storage
        sessionStorage.removeItem('oauth_state');

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Error handling OAuth callback:', err);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">Please wait while we authenticate you.</p>
      </div>
    </div>
  );
};
