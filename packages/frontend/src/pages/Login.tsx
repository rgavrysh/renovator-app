import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Renovator</h2>
          <p className="mt-2 text-sm text-gray-600">
            Project Management Platform
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="text-center">
            <p className="text-gray-700 mb-6">
              Sign in to manage your renovation projects
            </p>
            <Button
              onClick={login}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Sign in with OAuth
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
