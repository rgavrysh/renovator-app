import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { AuthService } from './AuthService';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

vi.mock('../config', () => ({
  default: {
    keycloak: {
      url: 'http://localhost:8080',
      realm: 'renovator',
      clientId: 'renovator-app',
      clientSecret: 'test-secret',
    },
  },
}));

vi.mock('../config/database', () => ({
  AppDataSource: {
    getRepository: vi.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL with required parameters', () => {
      const redirectUri = 'http://localhost:4000/auth/callback';
      const url = authService.getAuthorizationUrl(redirectUri);

      expect(url).toContain('http://localhost:8080/realms/renovator/protocol/openid-connect/auth');
      expect(url).toContain('client_id=renovator-app');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fauth%2Fcallback');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid+email+profile');
    });

    it('should include state parameter when provided', () => {
      const redirectUri = 'http://localhost:4000/auth/callback';
      const state = 'random-state-value';
      const url = authService.getAuthorizationUrl(redirectUri, state);

      expect(url).toContain('state=random-state-value');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          id_token: 'mock-id-token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const code = 'auth-code-123';
      const redirectUri = 'http://localhost:4000/auth/callback';
      const tokens = await authService.exchangeCodeForTokens(code, redirectUri);

      expect(tokens).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        idToken: 'mock-id-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/realms/renovator/protocol/openid-connect/token',
        expect.stringContaining('grant_type=authorization_code'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should throw error when token exchange fails', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error_description: 'Invalid authorization code',
          },
        },
      });

      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      const code = 'invalid-code';
      const redirectUri = 'http://localhost:4000/auth/callback';

      await expect(
        authService.exchangeCodeForTokens(code, redirectUri)
      ).rejects.toThrow('Failed to exchange code for tokens: Invalid authorization code');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token using refresh token', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          id_token: 'new-id-token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const refreshToken = 'old-refresh-token';
      const tokens = await authService.refreshAccessToken(refreshToken);

      expect(tokens).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        idToken: 'new-id-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/realms/renovator/protocol/openid-connect/token',
        expect.stringContaining('grant_type=refresh_token'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should throw error when refresh fails', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error_description: 'Invalid refresh token',
          },
        },
      });

      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        authService.refreshAccessToken('invalid-token')
      ).rejects.toThrow('Failed to refresh access token: Invalid refresh token');
    });
  });

  describe('validateAccessToken', () => {
    it('should validate active token and return validation result', async () => {
      const mockResponse = {
        data: {
          active: true,
          sub: 'user-123',
          exp: Math.floor(Date.now() / 1000) + 3600,
          scope: 'openid email profile',
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const token = 'valid-token';
      const result = await authService.validateAccessToken(token);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.scopes).toEqual(['openid', 'email', 'profile']);
    });

    it('should return invalid result for inactive token', async () => {
      const mockResponse = {
        data: {
          active: false,
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const token = 'invalid-token';
      const result = await authService.validateAccessToken(token);

      expect(result.valid).toBe(false);
      expect(result.userId).toBeUndefined();
    });

    it('should throw error when validation request fails', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error_description: 'Token validation failed',
          },
        },
      });

      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        authService.validateAccessToken('token')
      ).rejects.toThrow('Failed to validate access token: Token validation failed');
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info from access token', async () => {
      const mockResponse = {
        data: {
          sub: 'user-123',
          email: 'test@example.com',
          given_name: 'John',
          family_name: 'Doe',
          phone: '555-0100',
          company: 'Test Company',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const token = 'valid-token';
      const userInfo = await authService.getUserInfo(token);

      expect(userInfo).toEqual({
        sub: 'user-123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        phone: '555-0100',
        company: 'Test Company',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:8080/realms/renovator/protocol/openid-connect/userinfo',
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid-token' },
        })
      );
    });

    it('should throw error when user info request fails', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error_description: 'Invalid token',
          },
        },
      });

      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        authService.getUserInfo('invalid-token')
      ).rejects.toThrow('Failed to get user info: Invalid token');
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      const token = 'token-to-revoke';
      await authService.revokeToken(token);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8080/realms/renovator/protocol/openid-connect/logout',
        expect.stringContaining('token=token-to-revoke'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should throw error when revocation fails', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error_description: 'Revocation failed',
          },
        },
      });

      mockedAxios.isAxiosError.mockReturnValueOnce(true);

      await expect(
        authService.revokeToken('token')
      ).rejects.toThrow('Failed to revoke token: Revocation failed');
    });
  });
});
