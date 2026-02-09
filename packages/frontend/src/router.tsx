import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { ComponentShowcase } from './pages/ComponentShowcase';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';

// Placeholder components for routes (to be implemented in later tasks)
const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <p className="mt-4 text-gray-600">Project dashboard coming soon...</p>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-xl text-gray-600">Page not found</p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'components',
        element: (
          <ProtectedRoute>
            <ComponentShowcase />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
