import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { SessionService } from '../services/SessionService';

const router = Router();
const authService = new AuthService();
const sessionService = new SessionService();

/**
 * Get OAuth authorization URL
 * GET /api/auth/login
 */
router.get('/login', (req: Request, res: Response) => {
  try {
    const redirectUri = req.query.redirect_uri as string || `${req.protocol}://${req.get('host')}/api/auth/callback`;
    const state = req.query.state as string;
    
    const authUrl = authService.getAuthorizationUrl(redirectUri, state);
    
    res.json({ authorizationUrl: authUrl });
  } catch (error) {
    console.error('Error generating authorization URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * OAuth callback handler - exchange code for tokens
 * GET /api/auth/callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const redirectUri = req.query.redirect_uri as string || `${req.protocol}://${req.get('host')}/api/auth/callback`;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    // Exchange code for tokens
    const tokens = await authService.exchangeCodeForTokens(code, redirectUri);
    
    // Get user info
    const userInfo = await authService.getUserInfo(tokens.accessToken);
    
    // Create or update user
    const user = await authService.createOrUpdateUser(userInfo);
    
    // Create session
    const session = await authService.createSession(user.id, tokens);
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Refresh tokens
    const tokens = await authService.refreshAccessToken(refreshToken);
    
    // Get session by refresh token
    const session = await sessionService.getSessionByRefreshToken(refreshToken);
    
    if (session) {
      // Update session with new tokens
      await sessionService.updateSession(session.id, tokens);
    }
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(401).json({ error: 'Failed to refresh token' });
  }
});

/**
 * Logout - revoke tokens and delete session
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { accessToken, sessionId } = req.body;
    
    if (accessToken) {
      // Revoke token with Keycloak
      await authService.revokeToken(accessToken);
    }
    
    if (sessionId) {
      // Delete session from database
      await sessionService.deleteSession(sessionId);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * Get current user info
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // Validate token and get user
    const user = await authService.getUserFromToken(token);
    
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      company: user.company,
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

export default router;
