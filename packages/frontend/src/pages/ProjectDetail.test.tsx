import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectDetail } from './ProjectDetail';
import { AuthProvider } from '../contexts/AuthContext';
import * as apiModule from '../utils/api';

// Mock the API client
vi.mock('../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
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
  firstName: 'Test',
  lastName: 'User',
};

const mockProject = {
  id: 'project-1',
  name: 'Kitchen Renovation',
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  clientPhone: '555-1234',
  description: 'Complete kitchen remodel',
  startDate: '2024-01-01',
  estimatedEndDate: '2024-03-01',
  status: 'active',
  ownerId: 'user-1',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockMilestones = [
  {
    id: 'milestone-1',
    projectId: 'project-1',
    name: 'Demolition',
    description: 'Remove old cabinets',
    targetDate: '2024-01-15',
    status: 'completed',
    completedDate: '2024-01-14',
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z',
  },
  {
    id: 'milestone-2',
    projectId: 'project-1',
    name: 'Installation',
    description: 'Install new cabinets',
    targetDate: '2024-02-15',
    status: 'in_progress',
    order: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockTasks = [
  {
    id: 'task-1',
    projectId: 'project-1',
    milestoneId: 'milestone-1',
    name: 'Remove cabinets',
    description: 'Remove all old cabinets',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-01-10',
    completedDate: '2024-01-09',
    estimatedPrice: 500,
    actualPrice: 450,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-09T00:00:00Z',
  },
  {
    id: 'task-2',
    projectId: 'project-1',
    milestoneId: 'milestone-2',
    name: 'Install cabinets',
    description: 'Install new cabinets',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2024-02-10',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockBudget = {
  id: 'budget-1',
  projectId: 'project-1',
  totalEstimated: 10000,
  totalActual: 5000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const renderWithRouter = (route = '/projects/project-1') => {
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
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ProjectDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should render loading state initially', () => {
    vi.mocked(apiModule.apiClient.get).mockImplementation(() => new Promise(() => {}));

    renderWithRouter();

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display project information', async () => {
    // Mock fetch for photos and documents BEFORE rendering
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/photos')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (typeof url === 'string' && url.includes('/documents')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUser,
      });
    });

    vi.mocked(apiModule.apiClient.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/milestones')) return Promise.resolve(mockMilestones);
      if (endpoint.includes('/tasks')) return Promise.resolve(mockTasks);
      if (endpoint.includes('/budget')) return Promise.resolve(mockBudget);
      return Promise.resolve(mockProject);
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });

    expect(screen.getByText('Client: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Complete kitchen remodel')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('should display milestones', async () => {
    // Mock fetch for photos and documents BEFORE rendering
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/photos')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (typeof url === 'string' && url.includes('/documents')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUser,
      });
    });

    vi.mocked(apiModule.apiClient.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/milestones')) return Promise.resolve(mockMilestones);
      if (endpoint.includes('/tasks')) return Promise.resolve(mockTasks);
      if (endpoint.includes('/budget')) return Promise.resolve(mockBudget);
      return Promise.resolve(mockProject);
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Demolition')).toBeInTheDocument();
    });

    expect(screen.getByText('Installation')).toBeInTheDocument();
    expect(screen.getByText('Remove old cabinets')).toBeInTheDocument();
  });

  it('should display task statistics', async () => {
    // Mock fetch for photos and documents BEFORE rendering
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/photos')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (typeof url === 'string' && url.includes('/documents')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUser,
      });
    });

    vi.mocked(apiModule.apiClient.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/milestones')) return Promise.resolve(mockMilestones);
      if (endpoint.includes('/tasks')) return Promise.resolve(mockTasks);
      if (endpoint.includes('/budget')) return Promise.resolve(mockBudget);
      return Promise.resolve(mockProject);
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Kitchen Renovation')).toBeInTheDocument();
    });

    // Verify task names are displayed in the tasks section
    expect(screen.getByText('Remove cabinets')).toBeInTheDocument();
    expect(screen.getByText('Install cabinets')).toBeInTheDocument();
    // Check for the Tasks card header (using getAllByText since it appears in multiple places)
    const tasksHeaders = screen.getAllByText('Tasks');
    expect(tasksHeaders.length).toBeGreaterThan(0);
  });

  it('should display budget summary', async () => {
    // Mock fetch for photos and documents BEFORE rendering
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/photos')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (typeof url === 'string' && url.includes('/documents')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUser,
      });
    });

    vi.mocked(apiModule.apiClient.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/milestones')) return Promise.resolve(mockMilestones);
      if (endpoint.includes('/tasks')) return Promise.resolve(mockTasks);
      if (endpoint.includes('/budget')) return Promise.resolve(mockBudget);
      return Promise.resolve(mockProject);
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    });

    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    expect(screen.getByText('-$5,000.00')).toBeInTheDocument(); // Variance
  });

  it('should handle missing budget gracefully', async () => {
    // Mock fetch for photos and documents BEFORE rendering
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/photos')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (typeof url === 'string' && url.includes('/documents')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUser,
      });
    });

    vi.mocked(apiModule.apiClient.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/milestones')) return Promise.resolve(mockMilestones);
      if (endpoint.includes('/tasks')) return Promise.resolve(mockTasks);
      if (endpoint.includes('/budget')) return Promise.reject(new Error('Not found'));
      return Promise.resolve(mockProject);
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('No budget set')).toBeInTheDocument();
    });
  });

  it('should display error message when project fails to load', async () => {
    vi.mocked(apiModule.apiClient.get).mockRejectedValue(
      new Error('Failed to load project')
    );

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Failed to load project')).toBeInTheDocument();
    });
  });

  it('should calculate progress correctly', async () => {
    // Mock fetch for photos and documents BEFORE rendering
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/photos')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      if (typeof url === 'string' && url.includes('/documents')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockUser,
      });
    });

    vi.mocked(apiModule.apiClient.get).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/milestones')) return Promise.resolve(mockMilestones);
      if (endpoint.includes('/tasks')) return Promise.resolve(mockTasks);
      if (endpoint.includes('/budget')) return Promise.resolve(mockBudget);
      return Promise.resolve(mockProject);
    });

    renderWithRouter();

    await waitFor(() => {
      // 1 out of 2 milestones completed = 50%
      expect(screen.getByText('Progress: 50%')).toBeInTheDocument();
    });
  });
});
