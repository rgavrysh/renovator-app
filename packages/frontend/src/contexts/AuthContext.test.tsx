import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import React from 'react';

// Mock the config
vi.mock('../config', () => ({
  default: {
    api: {
      url: 'http://localhost:3000',
    },
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should initialize with no user when localStorage is empty', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should load user from localStorage on mount', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    };

    localStorage.setItem('auth_tokens', JSON.stringify(mockTokens));
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should refresh token when stored token is invalid', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockTokens = {
      accessToken: 'expired-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    };

    localStorage.setItem('auth_tokens', JSON.stringify(mockTokens));
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    // First call to /me fails (token invalid)
    // Second call to /refresh succeeds
    // Third call to /me succeeds
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);

    // Verify refresh was called
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should clear auth when token refresh fails', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockTokens = {
      accessToken: 'expired-token',
      refreshToken: 'invalid-refresh-token',
      expiresIn: 3600,
    };

    localStorage.setItem('auth_tokens', JSON.stringify(mockTokens));
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    // First call to /me fails (token invalid)
    // Second call to /refresh fails
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('auth_tokens')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });

  it('should handle logout correctly', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    };

    localStorage.setItem('auth_tokens', JSON.stringify(mockTokens));
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    localStorage.setItem('auth_session', 'session-123');

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logged out successfully' }),
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

    await act(async () => {
      await result.current.logout();
    });

    // Verify logout endpoint was called
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          accessToken: 'valid-token',
          sessionId: 'session-123',
        }),
      })
    );

    // Verify local storage was cleared
    expect(localStorage.getItem('auth_tokens')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(localStorage.getItem('auth_session')).toBeNull();

    // Verify redirect to login
    expect(window.location.href).toBe('/login');
  });

  it('should schedule automatic token refresh', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
      expiresIn: 600, // 10 minutes
    };

    localStorage.setItem('auth_tokens', JSON.stringify(mockTokens));
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Fast-forward time to trigger refresh (10 minutes - 5 minutes threshold = 5 minutes)
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/refresh',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should manually refresh token', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockTokens = {
      accessToken: 'valid-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    };

    localStorage.setItem('auth_tokens', JSON.stringify(mockTokens));
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'new-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshToken();
    });

    // Verify refresh was called
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
      })
    );

    // Verify new tokens were stored
    const storedTokens = JSON.parse(localStorage.getItem('auth_tokens')!);
    expect(storedTokens.accessToken).toBe('new-token');
    expect(storedTokens.refreshToken).toBe('new-refresh-token');
  });
});
