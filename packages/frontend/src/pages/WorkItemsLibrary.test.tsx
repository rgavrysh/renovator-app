import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WorkItemsLibrary } from './WorkItemsLibrary';
import * as AuthContext from '../contexts/AuthContext';
import * as apiModule from '../utils/api';

// Mock the API client
vi.mock('../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WorkItemsLibrary', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    idpUserId: 'idp-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });
  });

  it('should render the page title', async () => {
    (apiModule.apiClient.get as any).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <WorkItemsLibrary />
      </BrowserRouter>
    );

    expect(screen.getByText('Work Items Library')).toBeInTheDocument();
    expect(screen.getByText('Manage your custom work item templates')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    (apiModule.apiClient.get as any).mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <WorkItemsLibrary />
      </BrowserRouter>
    );

    // Check for spinner by looking for the SVG with animate-spin class
    const spinner = screen.getByRole('main').querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display custom work items', async () => {
    const mockWorkItems = [
      {
        id: '1',
        name: 'Custom Task 1',
        description: 'Custom description',
        category: 'demolition',
        defaultPrice: 100,
        isDefault: false,
        ownerId: 'user-1',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Default Task',
        description: 'Default description',
        category: 'framing',
        defaultPrice: 200,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ];

    (apiModule.apiClient.get as any).mockResolvedValue(mockWorkItems);

    render(
      <BrowserRouter>
        <WorkItemsLibrary />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should only show custom work items (not default ones)
      expect(screen.getByText('Custom Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Default Task')).not.toBeInTheDocument();
    });
  });

  it('should display empty state when no custom work items exist', async () => {
    const mockWorkItems = [
      {
        id: '1',
        name: 'Default Task',
        description: 'Default description',
        category: 'framing',
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ];

    (apiModule.apiClient.get as any).mockResolvedValue(mockWorkItems);

    render(
      <BrowserRouter>
        <WorkItemsLibrary />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No custom work items found/i)).toBeInTheDocument();
    });
  });

  it('should display work item details', async () => {
    const mockWorkItems = [
      {
        id: '1',
        name: 'Custom Task',
        description: 'Task description',
        category: 'electrical',
        defaultPrice: 150.50,
        estimatedDuration: 4,
        isDefault: false,
        ownerId: 'user-1',
        createdAt: new Date().toISOString(),
      },
    ];

    (apiModule.apiClient.get as any).mockResolvedValue(mockWorkItems);

    render(
      <BrowserRouter>
        <WorkItemsLibrary />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Task')).toBeInTheDocument();
      expect(screen.getByText('Task description')).toBeInTheDocument();
      expect(screen.getByText('$150.50')).toBeInTheDocument();
      expect(screen.getByText('4 hours')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    (apiModule.apiClient.get as any).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <WorkItemsLibrary />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
