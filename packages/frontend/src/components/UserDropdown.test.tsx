import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserDropdown } from './UserDropdown';
import * as AuthContext from '../contexts/AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UserDropdown', () => {
  const mockLogout = vi.fn();
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
      logout: mockLogout,
      refreshToken: vi.fn(),
    });
  });

  it('should display user name', () => {
    render(
      <BrowserRouter>
        <UserDropdown />
      </BrowserRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should toggle dropdown on click', () => {
    render(
      <BrowserRouter>
        <UserDropdown />
      </BrowserRouter>
    );

    const button = screen.getByText('John Doe');
    
    // Dropdown should not be visible initially
    expect(screen.queryByText('Work Items Library')).not.toBeInTheDocument();
    
    // Click to open dropdown
    fireEvent.click(button);
    
    // Dropdown should be visible
    expect(screen.getByText('Work Items Library')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should navigate to work items library when clicked', () => {
    render(
      <BrowserRouter>
        <UserDropdown />
      </BrowserRouter>
    );

    // Open dropdown
    fireEvent.click(screen.getByText('John Doe'));
    
    // Click Work Items Library
    fireEvent.click(screen.getByText('Work Items Library'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/work-items-library');
  });

  it('should call logout when logout is clicked', async () => {
    render(
      <BrowserRouter>
        <UserDropdown />
      </BrowserRouter>
    );

    // Open dropdown
    fireEvent.click(screen.getByText('John Doe'));
    
    // Click Logout
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('should close dropdown when clicking outside', () => {
    render(
      <BrowserRouter>
        <div>
          <UserDropdown />
          <div data-testid="outside">Outside</div>
        </div>
      </BrowserRouter>
    );

    // Open dropdown
    fireEvent.click(screen.getByText('John Doe'));
    expect(screen.getByText('Work Items Library')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));
    
    // Dropdown should be closed
    expect(screen.queryByText('Work Items Library')).not.toBeInTheDocument();
  });
});
