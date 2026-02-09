import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { ComponentShowcase } from './pages/ComponentShowcase';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { ProjectForm } from './pages/ProjectForm';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProtectedRoute } from './components/ProtectedRoute';

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
        path: 'projects/new',
        element: (
          <ProtectedRoute>
            <ProjectForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projects/:id',
        element: (
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'projects/:id/edit',
        element: (
          <ProtectedRoute>
            <ProjectForm />
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
