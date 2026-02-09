import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate } from './auth';
import { AuthService } from '../services/AuthService';
import { User } from '../entities/User';

// Mock AuthService
vi.mock('../services/AuthService');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuthService: any;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn() as unknown as NextFunction;

    // Reset mocks
    vi.clearAllMocks();

    // Setup AuthService mock
    mockAuthService = {
      validateAccessToken: vi.fn(),
      getUserFromToken: vi.fn(),
    };
    (AuthService as any).mockImplementation(() => mockAuthService);
  });

  describe('authenticate', () => {
    it('should return 401 when no authorization header is provided', async () => {
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No authorization header provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header format is invalid', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat' };

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid authorization header format. Expected: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token validation fails', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockAuthService.validateAccessToken.mockResolvedValue({ valid: false });

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired access token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockAuthService.validateAccessToken.mockResolvedValue({ valid: true });
      mockAuthService.getUserFromToken.mockResolvedValue(null);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('valid-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user to request and call next when authentication succeeds', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockAuthService.validateAccessToken.mockResolvedValue({ valid: true });
      mockAuthService.getUserFromToken.mockResolvedValue(mockUser);

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.userId).toBe('user-123');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when an error occurs during authentication', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockAuthService.validateAccessToken.mockRejectedValue(new Error('Service error'));

      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should call next without attaching user when no authorization header is provided', async () => {
      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next without attaching user when authorization header format is invalid', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat' };

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next without attaching user when token validation fails', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockAuthService.validateAccessToken.mockResolvedValue({ valid: false });

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should attach user to request and call next when authentication succeeds', async () => {
      const mockUser: Partial<User> = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockAuthService.validateAccessToken.mockResolvedValue({ valid: true });
      mockAuthService.getUserFromToken.mockResolvedValue(mockUser);

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.validateAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockAuthService.getUserFromToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.userId).toBe('user-123');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next without attaching user when an error occurs', async () => {
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      mockAuthService.validateAccessToken.mockRejectedValue(new Error('Service error'));

      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
