import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AppShell, RouteHandle } from './AppShell';
import { useAppShell } from './AppShellContext';
import * as AuthContext from '../../contexts/AuthContext';

vi.mock('../../hooks/useGoogleDrive', () => ({
  useGoogleDrive: () => ({
    isConnected: false,
    googleEmail: null,
    loading: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshStatus: vi.fn(),
  }),
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  idpUserId: 'idp-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DashboardStub = () => <div>Dashboard content</div>;

const projectsParent: RouteHandle['parent'] = { crumbKey: 'nav.projects', path: '/dashboard' };

const ProjectDetailStub = () => {
  const { setBreadcrumbLabel } = useAppShell();
  useEffect(() => {
    setBreadcrumbLabel('Kitchen Remodel');
    return () => setBreadcrumbLabel(null);
  }, [setBreadcrumbLabel]);
  return <div>Project detail content</div>;
};

const PageActionsStub = () => {
  const { setPageActions } = useAppShell();
  useEffect(() => {
    setPageActions(<button>Page action</button>);
    return () => setPageActions(null);
  }, [setPageActions]);
  return <div>Page with actions</div>;
};

const buildRouter = (initialEntry: string) =>
  createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardStub />,
            handle: { crumbKey: 'nav.projects' } satisfies RouteHandle,
          },
          {
            path: 'projects/:id',
            element: <ProjectDetailStub />,
            handle: { parent: projectsParent, dynamicCrumb: true } satisfies RouteHandle,
          },
          {
            path: 'work-items-library',
            element: <PageActionsStub />,
            handle: { crumbKey: 'nav.workCatalog' } satisfies RouteHandle,
          },
          {
            path: 'suppliers',
            element: <div>Suppliers content</div>,
            handle: { crumbKey: 'nav.suppliers' } satisfies RouteHandle,
          },
        ],
      },
    ],
    { initialEntries: [initialEntry] }
  );

describe('AppShell', () => {
  beforeEach(() => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });
    document.title = '';
    localStorage.clear();
  });

  it('renders the persistent workspace navigation with links to every surfaced feature', () => {
    render(<RouterProvider router={buildRouter('/dashboard')} />);

    expect(screen.getByRole('link', { name: /Projects/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /Work catalog/i })).toHaveAttribute(
      'href',
      '/work-items-library'
    );
    expect(screen.getByRole('link', { name: /Suppliers/i })).toHaveAttribute('href', '/suppliers');
  });

  it('marks the active nav item for the current route', () => {
    render(<RouterProvider router={buildRouter('/suppliers')} />);

    const suppliersLink = screen.getByRole('link', { name: /Suppliers/i });
    expect(suppliersLink.className).toMatch(/bg-gray-200/);
  });

  it('collapses the desktop sidebar to icon-only width and back again', () => {
    render(<RouterProvider router={buildRouter('/dashboard')} />);

    expect(screen.getByText('Renovator')).toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    const suppliersLink = screen.getByRole('link', { name: 'Suppliers' });
    const aside = suppliersLink.closest('aside');
    expect(aside?.className).toMatch(/lg:w-60/);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(aside?.className).toMatch(/lg:w-14/);
    expect(screen.queryByText('Renovator')).not.toBeInTheDocument();
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
    // The nav item is still present and reachable, just icon-only with a tooltip.
    const collapsedSuppliersLink = screen.getByRole('link', { name: /Suppliers/i });
    expect(collapsedSuppliersLink).toHaveAttribute('title', 'Suppliers');
    expect(collapsedSuppliersLink).toHaveAttribute('href', '/suppliers');

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));

    expect(aside?.className).toMatch(/lg:w-60/);
    expect(screen.getByText('Renovator')).toBeInTheDocument();
  });

  it('persists the collapsed sidebar preference across mounts', () => {
    const { unmount } = render(<RouterProvider router={buildRouter('/dashboard')} />);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(localStorage.getItem('appShell.sidebarCollapsed')).toBe('true');
    unmount();

    render(<RouterProvider router={buildRouter('/dashboard')} />);
    expect(screen.queryByText('Renovator')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });

  it('renders a static breadcrumb from route handle data', () => {
    render(<RouterProvider router={buildRouter('/dashboard')} />);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Projects');
  });

  it('renders a parent link plus a dynamic breadcrumb label supplied by the page', async () => {
    render(<RouterProvider router={buildRouter('/projects/project-1')} />);

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    await waitFor(() => {
      expect(breadcrumb).toHaveTextContent('Kitchen Remodel');
    });

    const parentLink = within(breadcrumb).getByRole('link', { name: 'Projects' });
    expect(parentLink).toHaveAttribute('href', '/dashboard');
  });

  it('updates document.title to include the current breadcrumb label', async () => {
    render(<RouterProvider router={buildRouter('/projects/project-1')} />);

    await waitFor(() => {
      expect(document.title).toContain('Kitchen Remodel');
    });
  });

  it('renders page actions supplied by the current page in the top bar', async () => {
    render(<RouterProvider router={buildRouter('/work-items-library')} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Page action' })).toBeInTheDocument();
    });
  });

  it('clears page actions once the page that set them unmounts, without the shell fighting the update', async () => {
    const TogglePage = () => {
      const [showActionsPage, setShowActionsPage] = React.useState(true);
      return (
        <div>
          <button onClick={() => setShowActionsPage(false)}>Unmount page</button>
          {showActionsPage ? <PageActionsStub /> : <div>No actions here</div>}
        </div>
      );
    };
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppShell />,
          children: [{ path: 'toggle', element: <TogglePage /> }],
        },
      ],
      { initialEntries: ['/toggle'] }
    );
    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Page action' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Unmount page' }));

    expect(screen.getByText('No actions here')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page action' })).not.toBeInTheDocument();
  });

  it('renders the persistent chrome: user menu and language switcher', () => {
    render(<RouterProvider router={buildRouter('/dashboard')} />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('hides the desktop sidebar nav from the accessibility tree on narrow viewports via responsive classes', () => {
    render(<RouterProvider router={buildRouter('/dashboard')} />);

    const desktopNavLinks = screen.getAllByRole('link', { name: /Projects/i });
    // The link that lives inside the always-hidden-below-lg <aside> carries the responsive class.
    const desktopAside = desktopNavLinks[0].closest('aside');
    expect(desktopAside?.className).toMatch(/hidden/);
    expect(desktopAside?.className).toMatch(/lg:flex/);
  });

  it('opens a mobile nav drawer from the hamburger button and closes it again', () => {
    render(<RouterProvider router={buildRouter('/dashboard')} />);

    // Only the desktop sidebar nav is present until the drawer opens.
    expect(screen.getAllByRole('link', { name: /Suppliers/i })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getAllByRole('link', { name: /Suppliers/i })).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));

    expect(screen.getAllByRole('link', { name: /Suppliers/i })).toHaveLength(1);
  });

  it('closes the mobile nav drawer when Escape is pressed', () => {
    render(<RouterProvider router={buildRouter('/dashboard')} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getAllByRole('link', { name: /Suppliers/i })).toHaveLength(2);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.getAllByRole('link', { name: /Suppliers/i })).toHaveLength(1);
  });

  it('closes the mobile nav drawer after navigating to a link inside it', () => {
    render(<RouterProvider router={buildRouter('/dashboard')} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const drawerSuppliersLink = screen.getAllByRole('link', { name: /Suppliers/i })[1];
    fireEvent.click(drawerSuppliersLink);

    expect(screen.getAllByRole('link', { name: /Suppliers/i })).toHaveLength(1);
  });
});
