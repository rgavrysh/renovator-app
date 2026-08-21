import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Login } from './Login';
import * as AuthContext from '../contexts/AuthContext';

describe('Login', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      refreshToken: vi.fn(),
    });
  });

  it('renders the brand mark, title and product copy', () => {
    render(<Login />);

    expect(screen.getByText('Renovator')).toBeInTheDocument();
    expect(screen.getByText('Project Management Platform')).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to manage your renovation projects')
    ).toBeInTheDocument();
  });

  it('renders a "Continue with Google" button, not the protocol name', () => {
    render(<Login />);

    expect(
      screen.getByRole('button', { name: 'Continue with Google' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/sign in with oauth/i)).not.toBeInTheDocument();
  });

  it('calls login and shows a loading state when clicked', () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    const signInButton = screen.getByRole('button', { name: 'Signing in…' });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).toBeDisabled();
  });

  it('renders the terms notice', () => {
    render(<Login />);

    expect(
      screen.getByText(
        'By signing in, you agree to our Terms of Service and Privacy Policy'
      )
    ).toBeInTheDocument();
  });
});
