import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { AuthProvider } from '../contexts/AuthContext';
import * as apiModule from '../utils/api';

// Mock the API client
vi.mock('../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock the config
vi.mock('../config', () => ({
  default: {
    api: {
      url: 'http://localhost:4000',
    },
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

const mockProjects = [
  {
    id: 'project-1',
    name: 'Kitchen Renovation',
    clientName: 'Alice Smith',
    clientEmail: 'alice@example.com',
    description: 'Complete kitchen remodel',
    startDate: '2024-01-15',
    estimatedEndDate: '2024-03-15',
    status: 'active',
    ownerId: 'user-1',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'project-2',
    name: 'Bathroom Update',
    clientName: 'Bob Johnson',
    clientEmail: 'bob@example.com',
    description: 'Master bathroom renovation',
    startDate: '2024-02-01',
    estimatedEndDate: '2024-04-01',
    status: 'planning',
    ownerId: 'user-1',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

const renderDashboard = () => {
  // Setup auth state in localStorage
  const mockTokens = {
    accessToken: 'valid-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
  };

  localStorage.setItem('auth_tokens', JSON.stringify(mockTokens));
  localStorage.setItem('auth_user', JSON.stringify(mockUser));

  // Mock the /me endpoint to verify token
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => mockUser,
  });

  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should display loading state initially', () => {
    vi.mocked(apiModule.apiClient.get).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderDashboard();

    // Check for the spinner SVG element
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display list of active projects', async () => {
    vi.mocked(apiModule.apiClient.get).mockResolvedValue(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
      expect(screen.getByText('Bathroom Update')).toBeInTheDocument();
    });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('should display project status indicators', async () => {
    vi.mocked(apiModule.apiClient.get).mockResolvedValue(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Planning')).toBeInTheDocument();
    });
  });

  it('should filter projects based on search query', async () => {
    vi.mocked(apiModule.apiClient.get).mockResolvedValue(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search projects by name, client, or description/i
    );

    fireEvent.change(searchInput, { target: { value: 'Kitchen' } });

    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
      expect(screen.queryByText('Bathroom Update')).not.toBeInTheDocument();
    });
  });

  it('should filter projects by client name', async () => {
    vi.mocked(apiModule.apiClient.get).mockResolvedValue(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search projects by name, client, or description/i
    );

    fireEvent.change(searchInput, { target: { value: 'Bob' } });

    await waitFor(() => {
      expect(screen.queryByText('Kitchen Renovation')).not.toBeInTheDocument();
      expect(screen.getByText('Bathroom Update')).toBeInTheDocument();
    });
  });

  it('should display empty state when no projects exist', async () => {
    vi.mocked(apiModule.apiClient.get).mockResolvedValue([]);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No active projects')).toBeInTheDocument();
      expect(
        screen.getByText('Get started by creating your first renovation project')
      ).toBeInTheDocument();
    });
  });

  it('should display empty state when search returns no results', async () => {
    vi.mocked(apiModule.apiClient.get).mockResolvedValue(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search projects by name, client, or description/i
    );

    fireEvent.change(searchInput, { target: { value: 'NonexistentProject' } });

    await waitFor(() => {
      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search query')).toBeInTheDocument();
    });
  });

  it('should display error state when API call fails', async () => {
    vi.mocked(apiModule.apiClient.get).mockRejectedValue(
      new Error('Network error')
    );

    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load projects. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('should display user name in header', async () => {
    vi.mocked(apiModule.apiClient.get).mockResolvedValue(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should call API with correct filter for active projects', async () => {
    vi.mocked(apiModule.apiClient.get).mockResolvedValue(mockProjects);

    renderDashboard();

    await waitFor(() => {
      expect(apiModule.apiClient.get).toHaveBeenCalledWith(
        '/api/projects?status=planning,active,on_hold'
      );
    });
  });
});
