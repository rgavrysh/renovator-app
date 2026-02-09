import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, refreshToken } = useAuth();
  const location = useLocation();
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Attempt to refresh token if not authenticated and we haven't tried yet
  useEffect(() => {
    const attemptRefresh = async () => {
      if (!isAuthenticated && !isLoading && !hasAttemptedRefresh) {
        setHasAttemptedRefresh(true);
        setIsRefreshing(true);
        try {
          await refreshToken();
        } catch (error) {
          console.error('Token refresh failed in ProtectedRoute:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    attemptRefresh();
  }, [isAuthenticated, isLoading, hasAttemptedRefresh, refreshToken]);

  // Show loading state while checking authentication or attempting refresh
  if (isLoading || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children immediately
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated and we've attempted refresh, redirect to login
  if (!isAuthenticated && hasAttemptedRefresh) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If not authenticated and haven't attempted refresh yet, show loading
  // (This state should be brief as useEffect will trigger refresh)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};
