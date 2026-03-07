import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api';

interface GoogleDriveState {
  isConnected: boolean;
  googleEmail: string | null;
  loading: boolean;
  error: string | null;
}

export function useGoogleDrive() {
  const [state, setState] = useState<GoogleDriveState>({
    isConnected: false,
    googleEmail: null,
    loading: true,
    error: null,
  });

  const refreshStatus = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const data = await apiClient.get<{ connected: boolean; email?: string }>(
        '/api/google/status',
      );
      setState({
        isConnected: data.connected,
        googleEmail: data.email || null,
        loading: false,
        error: null,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: 'Failed to check Google Drive status' }));
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const connect = useCallback(async () => {
    try {
      const data = await apiClient.get<{ authorizationUrl: string }>(
        '/api/google/connect',
      );
      window.open(data.authorizationUrl, '_blank', 'width=600,height=700');
    } catch {
      setState((prev) => ({ ...prev, error: 'Failed to start Google Drive connection' }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      await apiClient.post('/api/google/disconnect');
      setState({
        isConnected: false,
        googleEmail: null,
        loading: false,
        error: null,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: 'Failed to disconnect Google Drive' }));
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    refreshStatus,
  };
}
