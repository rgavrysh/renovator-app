import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import App from './App';
import { ComponentShowcase } from './pages/ComponentShowcase';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { ProjectForm } from './pages/ProjectForm';
import { ProjectDetail } from './pages/ProjectDetail';
import { WorkItemsLibrary } from './pages/WorkItemsLibrary';
import { ProtectedRoute } from './components/ProtectedRoute';

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">{t('notFound.title')}</h1>
        <p className="mt-4 text-xl text-gray-600">{t('notFound.message')}</p>
      </div>
    </div>
  );
};

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
        path: 'work-items-library',
        element: (
          <ProtectedRoute>
            <WorkItemsLibrary />
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
