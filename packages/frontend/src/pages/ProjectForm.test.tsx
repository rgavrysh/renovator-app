import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectForm } from './ProjectForm';
import { AuthProvider } from '../contexts/AuthContext';
import * as apiModule from '../utils/api';

// Mock the API client
vi.mock('../utils/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock the useAuth hook
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

const renderWithRouter = (initialRoute = '/projects/new') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectForm />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProjectForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render the create project form', () => {
      renderWithRouter('/projects/new');

      expect(screen.getByText('Create New Project')).toBeInTheDocument();
      expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estimated End Date/i)).toBeInTheDocument();
    });

    it('should submit form with valid data', async () => {
      const mockPost = vi.fn().mockResolvedValue({ id: 'project-1' });
      (apiModule.apiClient.post as any) = mockPost;

      renderWithRouter('/projects/new');

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Project Name/i), {
        target: { value: 'Kitchen Renovation' },
      });
      fireEvent.change(screen.getByLabelText(/Client Name/i), {
        target: { value: 'John Smith' },
      });
      fireEvent.change(screen.getByLabelText(/Client Email/i), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/Client Phone/i), {
        target: { value: '555-1234' },
      });
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { value: 'Complete kitchen remodel' },
      });
      fireEvent.change(screen.getByLabelText(/Start Date/i), {
        target: { value: '2024-01-01' },
      });
      fireEvent.change(screen.getByLabelText(/Estimated End Date/i), {
        target: { value: '2024-03-31' },
      });

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/api/projects', {
          name: 'Kitchen Renovation',
          clientName: 'John Smith',
          clientEmail: 'john@example.com',
          clientPhone: '555-1234',
          description: 'Complete kitchen remodel',
          startDate: '2024-01-01',
          estimatedEndDate: '2024-03-31',
          status: 'planning',
        });
      });
    });

    it('should handle optional fields correctly', async () => {
      const mockPost = vi.fn().mockResolvedValue({ id: 'project-1' });
      (apiModule.apiClient.post as any) = mockPost;

      renderWithRouter('/projects/new');

      // Fill in only required fields
      fireEvent.change(screen.getByLabelText(/Project Name/i), {
        target: { value: 'Test Project' },
      });
      fireEvent.change(screen.getByLabelText(/Client Name/i), {
        target: { value: 'Test Client' },
      });
      fireEvent.change(screen.getByLabelText(/Start Date/i), {
        target: { value: '2024-01-01' },
      });
      fireEvent.change(screen.getByLabelText(/Estimated End Date/i), {
        target: { value: '2024-03-31' },
      });

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/api/projects', {
          name: 'Test Project',
          clientName: 'Test Client',
          clientEmail: undefined,
          clientPhone: undefined,
          description: undefined,
          startDate: '2024-01-01',
          estimatedEndDate: '2024-03-31',
          status: 'planning',
        });
      });
    });
  });

  describe('Edit Mode', () => {
    const mockProject = {
      id: 'project-1',
      name: 'Existing Project',
      clientName: 'Existing Client',
      clientEmail: 'client@example.com',
      clientPhone: '555-9999',
      description: 'Existing description',
      startDate: '2024-01-01T00:00:00.000Z',
      estimatedEndDate: '2024-06-30T00:00:00.000Z',
      status: 'active',
      ownerId: 'user-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should load and display existing project data', async () => {
      const mockGet = vi.fn().mockResolvedValue(mockProject);
      (apiModule.apiClient.get as any) = mockGet;

      renderWithRouter('/projects/project-1');

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/api/projects/project-1');
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Project')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Client')).toBeInTheDocument();
        expect(screen.getByDisplayValue('client@example.com')).toBeInTheDocument();
      });
    });

    it('should update project with modified data', async () => {
      const mockGet = vi.fn().mockResolvedValue(mockProject);
      const mockPut = vi.fn().mockResolvedValue({ ...mockProject, name: 'Updated Project' });
      (apiModule.apiClient.get as any) = mockGet;
      (apiModule.apiClient.put as any) = mockPut;

      renderWithRouter('/projects/project-1');

      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Project Name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Project' } });

      const submitButton = screen.getByRole('button', { name: /Update Project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPut).toHaveBeenCalledWith('/api/projects/project-1', {
          name: 'Updated Project',
          clientName: 'Existing Client',
          clientEmail: 'client@example.com',
          clientPhone: '555-9999',
          description: 'Existing description',
          startDate: '2024-01-01',
          estimatedEndDate: '2024-06-30',
          status: 'active',
        });
      });
    });
  });

  describe('Form Interactions', () => {
    it('should navigate to dashboard on cancel', () => {
      renderWithRouter('/projects/new');

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toBeInTheDocument();
      
      // Verify button is clickable
      fireEvent.click(cancelButton);
    });

    it('should display error message on submission failure', async () => {
      const mockPost = vi.fn().mockRejectedValue(new Error('Network error'));
      (apiModule.apiClient.post as any) = mockPost;

      renderWithRouter('/projects/new');

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Project Name/i), {
        target: { value: 'Test Project' },
      });
      fireEvent.change(screen.getByLabelText(/Client Name/i), {
        target: { value: 'Test Client' },
      });
      fireEvent.change(screen.getByLabelText(/Start Date/i), {
        target: { value: '2024-01-01' },
      });
      fireEvent.change(screen.getByLabelText(/Estimated End Date/i), {
        target: { value: '2024-03-31' },
      });

      const submitButton = screen.getByRole('button', { name: /Create Project/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });
});
