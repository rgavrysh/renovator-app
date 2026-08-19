import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell, RouteHandle } from './components/layout/AppShell';
import { ComponentShowcase } from './pages/ComponentShowcase';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Dashboard } from './pages/Dashboard';
import { ProjectForm } from './pages/ProjectForm';
import { ProjectDetail } from './pages/ProjectDetail';
import { WorkItemsLibrary } from './pages/WorkItemsLibrary';
import { SuppliersPage } from './pages/SuppliersPage';
import { GoogleDriveCallback } from './pages/GoogleDriveCallback';
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

const dashboardCrumb: RouteHandle = { crumbKey: 'nav.projects' };
const projectsParent = { crumbKey: 'nav.projects', path: '/dashboard' };

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
    path: '/google/callback',
    element: <GoogleDriveCallback />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
        handle: dashboardCrumb,
      },
      {
        path: 'projects/new',
        element: <ProjectForm />,
        handle: { parent: projectsParent, crumbKey: 'projectForm.createTitle' } satisfies RouteHandle,
      },
      {
        path: 'projects/:id',
        element: <ProjectDetail />,
        handle: { parent: projectsParent, dynamicCrumb: true } satisfies RouteHandle,
      },
      {
        path: 'projects/:id/edit',
        element: <ProjectForm />,
        handle: { parent: projectsParent, crumbKey: 'projectForm.editTitle' } satisfies RouteHandle,
      },
      {
        path: 'work-items-library',
        element: <WorkItemsLibrary />,
        handle: { crumbKey: 'nav.workCatalog' } satisfies RouteHandle,
      },
      {
        path: 'suppliers',
        element: <SuppliersPage />,
        handle: { crumbKey: 'nav.suppliers' } satisfies RouteHandle,
      },
      {
        path: 'components',
        element: <ComponentShowcase />,
        handle: { crumbKey: 'nav.components' } satisfies RouteHandle,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
