import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import config from '../config';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'auth_tokens';
const USER_STORAGE_KEY = 'auth_user';
const SESSION_STORAGE_KEY = 'auth_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user and tokens from localStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);

        if (storedTokens && storedUser) {
          const tokens: AuthTokens = JSON.parse(storedTokens);
          const userData: User = JSON.parse(storedUser);

          // Verify token is still valid
          const isValid = await verifyToken(tokens.accessToken);
          
          if (isValid) {
            setUser(userData);
          } else {
            // Try to refresh token
            try {
              await refreshTokens(tokens.refreshToken);
            } catch (error) {
              // Refresh failed, clear auth
              clearAuth();
            }
          }
        }
      } catch (error) {
        console.error('Error loading auth:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const verifyToken = async (accessToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${config.api.url}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const refreshTokens = async (refreshToken: string): Promise<void> => {
    const response = await fetch(`${config.api.url}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    const tokens: AuthTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };

    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));

    // Get updated user info
    const userResponse = await fetch(`${config.api.url}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    }
  };

  const login = () => {
    // Generate state for CSRF protection
    const state = generateRandomState();
    sessionStorage.setItem('oauth_state', state);

    // Build redirect URI
    const redirectUri = `${window.location.origin}/auth/callback`;

    // Get authorization URL from backend
    const authUrl = new URL(`${config.api.url}/api/auth/login`);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);

    // Fetch the authorization URL and redirect
    fetch(authUrl.toString())
      .then(response => response.json())
      .then(data => {
        window.location.href = data.authorizationUrl;
      })
      .catch(error => {
        console.error('Error initiating login:', error);
      });
  };

  const logout = async () => {
    try {
      const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);

      if (storedTokens) {
        const tokens: AuthTokens = JSON.parse(storedTokens);

        await fetch(`${config.api.url}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: tokens.accessToken,
            sessionId,
          }),
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearAuth();
    }
  };

  const refreshToken = async () => {
    const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedTokens) {
      const tokens: AuthTokens = JSON.parse(storedTokens);
      await refreshTokens(tokens.refreshToken);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem('oauth_state');
    setUser(null);
  };

  const generateRandomState = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to get access token
export const getAccessToken = (): string | null => {
  const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (storedTokens) {
    const tokens: AuthTokens = JSON.parse(storedTokens);
    return tokens.accessToken;
  }
  return null;
};

// Helper function to get refresh token
export const getRefreshToken = (): string | null => {
  const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (storedTokens) {
    const tokens: AuthTokens = JSON.parse(storedTokens);
    return tokens.refreshToken;
  }
  return null;
};
