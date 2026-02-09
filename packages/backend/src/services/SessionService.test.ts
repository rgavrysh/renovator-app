import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { SessionService } from './SessionService';
import { Session } from '../entities/Session';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { OAuthTokens } from './AuthService';

describe('SessionService', () => {
  let sessionService: SessionService;
  let testUser: User;

  beforeAll(async () => {
    await AppDataSource.initialize();
    sessionService = new SessionService();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up in correct order due to foreign key constraints
    const projectRepository = AppDataSource.getRepository(Project);
    const sessionRepository = AppDataSource.getRepository(Session);
    const userRepository = AppDataSource.getRepository(User);
    
    const projects = await projectRepository.find();
    if (projects.length > 0) {
      await projectRepository.remove(projects);
    }
    
    const sessions = await sessionRepository.find();
    if (sessions.length > 0) {
      await sessionRepository.remove(sessions);
    }
    
    const users = await userRepository.find();
    if (users.length > 0) {
      await userRepository.remove(users);
    }

    // Create a test user
    testUser = userRepository.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      idpUserId: 'test-idp-user-id',
    });
    testUser = await userRepository.save(testUser);
  });

  describe('createSession', () => {
    it('should create a new session with valid tokens', async () => {
      const tokens: OAuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const session = await sessionService.createSession(testUser.id, tokens);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(testUser.id);
      expect(session.accessToken).toBe(tokens.accessToken);
      expect(session.refreshToken).toBe(tokens.refreshToken);
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('should set correct expiration time', async () => {
      const tokens: OAuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const beforeCreate = new Date();
      const session = await sessionService.createSession(testUser.id, tokens);
      const afterCreate = new Date();

      const expectedExpiresAt = new Date(beforeCreate);
      expectedExpiresAt.setSeconds(expectedExpiresAt.getSeconds() + 3600);

      // Allow 2 second tolerance for test execution time
      const timeDiff = Math.abs(
        session.expiresAt.getTime() - expectedExpiresAt.getTime()
      );
      expect(timeDiff).toBeLessThan(2000);
    });
  });

  describe('getSession', () => {
    it('should retrieve session by ID', async () => {
      const tokens: OAuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const createdSession = await sessionService.createSession(
        testUser.id,
        tokens
      );
      const retrievedSession = await sessionService.getSession(
        createdSession.id
      );

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.id).toBe(createdSession.id);
      expect(retrievedSession?.userId).toBe(testUser.id);
      expect(retrievedSession?.user).toBeDefined();
      expect(retrievedSession?.user.email).toBe(testUser.email);
    });

    it('should return null for non-existent session', async () => {
      const session = await sessionService.getSession(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(session).toBeNull();
    });
  });

  describe('getSessionByAccessToken', () => {
    it('should retrieve session by access token', async () => {
      const tokens: OAuthTokens = {
        accessToken: 'unique-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const createdSession = await sessionService.createSession(
        testUser.id,
        tokens
      );
      const retrievedSession = await sessionService.getSessionByAccessToken(
        tokens.accessToken
      );

      expect(retrievedSession).toBeDefined();
      expect(retrievedSession?.id).toBe(createdSession.id);
      expect(retrievedSession?.accessToken).toBe(tokens.accessToken);
    });

    it('should return null for non-existent access token', async () => {
      const session = await sessionService.getSessionByAccessToken(
        'non-existent-token'
      );
      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session tokens', async () => {
      const initialTokens: OAuthTokens = {
        accessToken: 'initial-access-token',
        refreshToken: 'initial-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const session = await sessionService.createSession(
        testUser.id,
        initialTokens
      );

      const newTokens: OAuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 7200,
        tokenType: 'Bearer',
      };

      const updatedSession = await sessionService.updateSession(
        session.id,
        newTokens
      );

      expect(updatedSession).toBeDefined();
      expect(updatedSession?.accessToken).toBe(newTokens.accessToken);
      expect(updatedSession?.refreshToken).toBe(newTokens.refreshToken);
      expect(updatedSession?.id).toBe(session.id);
    });

    it('should return null for non-existent session', async () => {
      const tokens: OAuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const result = await sessionService.updateSession(
        '00000000-0000-0000-0000-000000000000',
        tokens
      );
      expect(result).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session by ID', async () => {
      const tokens: OAuthTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const session = await sessionService.createSession(testUser.id, tokens);
      await sessionService.deleteSession(session.id);

      const retrievedSession = await sessionService.getSession(session.id);
      expect(retrievedSession).toBeNull();
    });

    it('should not throw error when deleting non-existent session', async () => {
      await expect(
        sessionService.deleteSession('00000000-0000-0000-0000-000000000000')
      ).resolves.not.toThrow();
    });
  });

  describe('deleteUserSessions', () => {
    it('should delete all sessions for a user', async () => {
      const tokens1: OAuthTokens = {
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const tokens2: OAuthTokens = {
        accessToken: 'access-token-2',
        refreshToken: 'refresh-token-2',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      await sessionService.createSession(testUser.id, tokens1);
      await sessionService.createSession(testUser.id, tokens2);

      const sessionsBeforeDelete = await sessionService.getUserSessions(
        testUser.id
      );
      expect(sessionsBeforeDelete).toHaveLength(2);

      await sessionService.deleteUserSessions(testUser.id);

      const sessionsAfterDelete = await sessionService.getUserSessions(
        testUser.id
      );
      expect(sessionsAfterDelete).toHaveLength(0);
    });
  });

  describe('deleteExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      // Create an expired session
      const expiredTokens: OAuthTokens = {
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh',
        expiresIn: -3600, // Expired 1 hour ago
        tokenType: 'Bearer',
      };

      // Create a valid session
      const validTokens: OAuthTokens = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      await sessionService.createSession(testUser.id, expiredTokens);
      await sessionService.createSession(testUser.id, validTokens);

      const deletedCount = await sessionService.deleteExpiredSessions();

      expect(deletedCount).toBe(1);

      const remainingSessions = await sessionService.getUserSessions(
        testUser.id
      );
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].accessToken).toBe(validTokens.accessToken);
    });
  });

  describe('isSessionExpired', () => {
    it('should return true for expired session', async () => {
      const expiredTokens: OAuthTokens = {
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh',
        expiresIn: -3600,
        tokenType: 'Bearer',
      };

      const session = await sessionService.createSession(
        testUser.id,
        expiredTokens
      );
      const isExpired = sessionService.isSessionExpired(session);

      expect(isExpired).toBe(true);
    });

    it('should return false for valid session', async () => {
      const validTokens: OAuthTokens = {
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const session = await sessionService.createSession(
        testUser.id,
        validTokens
      );
      const isExpired = sessionService.isSessionExpired(session);

      expect(isExpired).toBe(false);
    });
  });

  describe('getUserSessions', () => {
    it('should retrieve all sessions for a user', async () => {
      const tokens1: OAuthTokens = {
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const tokens2: OAuthTokens = {
        accessToken: 'access-token-2',
        refreshToken: 'refresh-token-2',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      await sessionService.createSession(testUser.id, tokens1);
      await sessionService.createSession(testUser.id, tokens2);

      const sessions = await sessionService.getUserSessions(testUser.id);

      expect(sessions).toHaveLength(2);
      expect(sessions[0].userId).toBe(testUser.id);
      expect(sessions[1].userId).toBe(testUser.id);
    });

    it('should return sessions in descending order by creation date', async () => {
      const tokens1: OAuthTokens = {
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const tokens2: OAuthTokens = {
        accessToken: 'access-token-2',
        refreshToken: 'refresh-token-2',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const session1 = await sessionService.createSession(testUser.id, tokens1);
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      const session2 = await sessionService.createSession(testUser.id, tokens2);

      const sessions = await sessionService.getUserSessions(testUser.id);

      expect(sessions[0].id).toBe(session2.id);
      expect(sessions[1].id).toBe(session1.id);
    });

    it('should return empty array for user with no sessions', async () => {
      const sessions = await sessionService.getUserSessions(testUser.id);
      expect(sessions).toHaveLength(0);
    });
  });
});
