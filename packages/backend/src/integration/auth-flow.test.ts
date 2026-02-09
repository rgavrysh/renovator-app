import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { AuthService, OAuthTokens } from '../services/AuthService';
import { SessionService } from '../services/SessionService';
import { User } from '../entities/User';
import { Session } from '../entities/Session';

/**
 * End-to-End Integration Test for OAuth Authentication Flow
 * 
 * This test suite validates the complete OAuth 2.0 authorization code flow:
 * 1. Authorization URL generation
 * 2. Token exchange (simulated)
 * 3. Token validation
 * 4. Session creation
 * 5. Token refresh
 * 6. Session cleanup
 */
describe('OAuth Authentication Flow - End-to-End', () => {
  let authService: AuthService;
  let sessionService: SessionService;

  beforeAll(async () => {
    await AppDataSource.initialize();
    authService = new AuthService();
    sessionService = new SessionService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up database before each test
    const sessionRepository = AppDataSource.getRepository(Session);
    const userRepository = AppDataSource.getRepository(User);
    
    // Delete all sessions first (due to foreign key constraint)
    await sessionRepository.createQueryBuilder().delete().execute();
    
    // Then delete all users
    await userRepository.createQueryBuilder().delete().execute();
  });

  describe('Complete OAuth Flow', () => {
    it('should successfully complete the full OAuth authentication flow', async () => {
      // Step 1: Generate authorization URL
      const redirectUri = 'http://localhost:4000/auth/callback';
      const state = 'random-state-123';
      const authUrl = authService.getAuthorizationUrl(redirectUri, state);

      expect(authUrl).toContain('client_id=renovator-app');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('state=random-state-123');
      expect(authUrl).toContain('scope=openid+email+profile');

      // Step 2: Simulate user authentication and create mock tokens
      // In a real scenario, the user would authenticate with Keycloak
      // and we'd receive an authorization code to exchange for tokens
      const mockTokens: OAuthTokens = {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        idToken: 'mock-id-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      // Step 3: Create or update user from OAuth user info
      const mockUserInfo = {
        sub: 'test-idp-user-' + Date.now(),
        email: 'testuser@example.com',
        given_name: 'Test',
        family_name: 'User',
        phone: '555-0100',
        company: 'Test Company',
      };

      const user = await authService.createOrUpdateUser(mockUserInfo);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(mockUserInfo.email);
      expect(user.firstName).toBe(mockUserInfo.given_name);
      expect(user.lastName).toBe(mockUserInfo.family_name);
      expect(user.idpUserId).toBe(mockUserInfo.sub);
      expect(user.lastLoginAt).toBeInstanceOf(Date);

      // Step 4: Create session for the authenticated user
      const session = await authService.createSession(user.id, mockTokens);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(user.id);
      expect(session.accessToken).toBe(mockTokens.accessToken);
      expect(session.refreshToken).toBe(mockTokens.refreshToken);
      expect(session.expiresAt).toBeInstanceOf(Date);

      // Step 5: Verify session can be retrieved
      const retrievedSession = await authService.getSession(session.id);

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.id).toBe(session.id);
      expect(retrievedSession?.userId).toBe(user.id);

      // Step 6: Simulate token refresh
      const newMockTokens: OAuthTokens = {
        accessToken: 'new-access-token-' + Date.now(),
        refreshToken: 'new-refresh-token-' + Date.now(),
        idToken: 'new-id-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const updatedSession = await sessionService.updateSession(
        session.id,
        newMockTokens
      );

      expect(updatedSession).toBeDefined();
      expect(updatedSession?.accessToken).toBe(newMockTokens.accessToken);
      expect(updatedSession?.refreshToken).toBe(newMockTokens.refreshToken);

      // Step 7: Verify session cleanup (logout)
      await authService.deleteSession(session.id);

      const deletedSession = await authService.getSession(session.id);
      expect(deletedSession).toBeNull();
    });

    it('should handle multiple sessions for the same user', async () => {
      // Create user
      const mockUserInfo = {
        sub: 'multi-session-user-' + Date.now(),
        email: 'multisession@example.com',
        given_name: 'Multi',
        family_name: 'Session',
      };

      const user = await authService.createOrUpdateUser(mockUserInfo);

      // Create first session (e.g., from desktop browser)
      const tokens1: OAuthTokens = {
        accessToken: 'desktop-token-' + Date.now(),
        refreshToken: 'desktop-refresh-' + Date.now(),
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const session1 = await authService.createSession(user.id, tokens1);

      // Create second session (e.g., from mobile device)
      const tokens2: OAuthTokens = {
        accessToken: 'mobile-token-' + Date.now(),
        refreshToken: 'mobile-refresh-' + Date.now(),
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const session2 = await authService.createSession(user.id, tokens2);

      // Verify both sessions exist
      const userSessions = await sessionService.getUserSessions(user.id);
      expect(userSessions).toHaveLength(2);

      // Delete all sessions for user (e.g., logout from all devices)
      await authService.deleteUserSessions(user.id);

      const remainingSessions = await sessionService.getUserSessions(user.id);
      expect(remainingSessions).toHaveLength(0);
    });

    it('should update existing user on subsequent logins', async () => {
      // First login
      const mockUserInfo1 = {
        sub: 'update-test-user',
        email: 'original@example.com',
        given_name: 'Original',
        family_name: 'Name',
        phone: '555-0100',
      };

      const user1 = await authService.createOrUpdateUser(mockUserInfo1);
      const originalId = user1.id;

      // Second login with updated information
      const mockUserInfo2 = {
        sub: 'update-test-user', // Same IDP user ID
        email: 'updated@example.com',
        given_name: 'Updated',
        family_name: 'Name',
        phone: '555-0200',
        company: 'New Company',
      };

      const user2 = await authService.createOrUpdateUser(mockUserInfo2);

      // Should be the same user (same ID)
      expect(user2.id).toBe(originalId);
      
      // But with updated information
      expect(user2.email).toBe(mockUserInfo2.email);
      expect(user2.firstName).toBe(mockUserInfo2.given_name);
      expect(user2.phone).toBe(mockUserInfo2.phone);
      expect(user2.company).toBe(mockUserInfo2.company);

      // Verify only one user exists in database
      const userRepository = AppDataSource.getRepository(User);
      const allUsers = await userRepository.find({
        where: { idpUserId: 'update-test-user' },
      });
      expect(allUsers).toHaveLength(1);
    });

    it('should handle expired sessions correctly', async () => {
      // Create user
      const mockUserInfo = {
        sub: 'expired-session-user-' + Date.now(),
        email: 'expired@example.com',
        given_name: 'Expired',
        family_name: 'Session',
      };

      const user = await authService.createOrUpdateUser(mockUserInfo);

      // Create expired session
      const expiredTokens: OAuthTokens = {
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh',
        expiresIn: -3600, // Expired 1 hour ago
        tokenType: 'Bearer',
      };

      const expiredSession = await authService.createSession(
        user.id,
        expiredTokens
      );

      // Create valid session
      const validTokens: OAuthTokens = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const validSession = await authService.createSession(user.id, validTokens);

      // Check if sessions are expired
      expect(sessionService.isSessionExpired(expiredSession)).toBe(true);
      expect(sessionService.isSessionExpired(validSession)).toBe(false);

      // Clean up expired sessions
      const deletedCount = await sessionService.deleteExpiredSessions();
      expect(deletedCount).toBe(1);

      // Verify only valid session remains
      const remainingSessions = await sessionService.getUserSessions(user.id);
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].id).toBe(validSession.id);
    });
  });

  describe('Session Management', () => {
    it('should retrieve session by access token', async () => {
      const mockUserInfo = {
        sub: 'token-lookup-user-' + Date.now(),
        email: 'tokenlookup@example.com',
        given_name: 'Token',
        family_name: 'Lookup',
      };

      const user = await authService.createOrUpdateUser(mockUserInfo);

      const uniqueToken = 'unique-access-token-' + Date.now();
      const tokens: OAuthTokens = {
        accessToken: uniqueToken,
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const session = await authService.createSession(user.id, tokens);

      // Retrieve session by access token
      const foundSession = await sessionService.getSessionByAccessToken(
        uniqueToken
      );

      expect(foundSession).toBeDefined();
      expect(foundSession?.id).toBe(session.id);
      expect(foundSession?.accessToken).toBe(uniqueToken);
      expect(foundSession?.user).toBeDefined();
      expect(foundSession?.user.email).toBe(user.email);
    });

    it('should order user sessions by creation date descending', async () => {
      const mockUserInfo = {
        sub: 'order-test-user-' + Date.now(),
        email: 'ordertest@example.com',
        given_name: 'Order',
        family_name: 'Test',
      };

      const user = await authService.createOrUpdateUser(mockUserInfo);

      // Create multiple sessions with small delays
      const session1 = await authService.createSession(user.id, {
        accessToken: 'token-1',
        refreshToken: 'refresh-1',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const session2 = await authService.createSession(user.id, {
        accessToken: 'token-2',
        refreshToken: 'refresh-2',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const session3 = await authService.createSession(user.id, {
        accessToken: 'token-3',
        refreshToken: 'refresh-3',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });

      // Get sessions (should be ordered newest first)
      const sessions = await sessionService.getUserSessions(user.id);

      expect(sessions).toHaveLength(3);
      expect(sessions[0].id).toBe(session3.id);
      expect(sessions[1].id).toBe(session2.id);
      expect(sessions[2].id).toBe(session1.id);
    });
  });
});
