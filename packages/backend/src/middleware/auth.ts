import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { User } from '../entities/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

/**
 * Authentication middleware that validates access tokens and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Invalid authorization header format. Expected: Bearer <token>' });
      return;
    }

    const token = parts[1];

    // Validate token with Keycloak
    const authService = new AuthService();
    const validationResult = await authService.validateAccessToken(token);

    if (!validationResult.valid) {
      res.status(401).json({ error: 'Invalid or expired access token' });
      return;
    }

    // Get user from token
    const user = await authService.getUserFromToken(token);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication middleware that doesn't fail if no token is provided
 * Useful for endpoints that work differently for authenticated vs unauthenticated users
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];
    const authService = new AuthService();
    const validationResult = await authService.validateAccessToken(token);

    if (validationResult.valid) {
      const user = await authService.getUserFromToken(token);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};
