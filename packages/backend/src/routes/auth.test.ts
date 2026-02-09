import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { AppDataSource } from '../config/database';
import authRoutes from './auth';
import { User } from '../entities/User';
import { Session } from '../entities/Session';
import { Project } from '../entities/Project';
import { Supplier } from '../entities/Supplier';

// Mock AuthService
vi.mock('../services/AuthService', () => {
  return {
    AuthService: vi.fn().mockImplementation(() => ({
      getAuthorizationUrl: vi.fn((redirectUri: string, state?: string) => {
        const url = new URL('http://localhost:8080/realms/renovator/protocol/openid-connect/auth');
        url.searchParams.append('client_id', 'renovator-app');
        url.searchParams.append('redirect_uri', redirectUri);
        url.searchParams.append('response_type', 'code');
        url.searchParams.append('scope', 'openid profile email');
        if (state) {
          url.searchParams.append('state', state);
        }
        return url.toString();
      }),
      exchangeCodeForTokens: vi.fn(async () => ({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })),
      getUserInfo: vi.fn(async () => ({
        sub: 'mock-user-id',
        email: 'test@example.com',
        given_name: 'Test',
        family_name: 'User',
      })),
      createOrUpdateUser: vi.fn(async (userInfo) => {
        const userRepository = AppDataSource.getRepository(User);
        let user = await userRepository.findOne({ where: { email: userInfo.email } });
        
        if (!user) {
          user = userRepository.create({
            email: userInfo.email,
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            idpUserId: userInfo.sub,
          });
          await userRepository.save(user);
        }
        
        return user;
      }),
      createSession: vi.fn(async (userId, tokens) => {
        const sessionRepository = AppDataSource.getRepository(Session);
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expiresIn);
        
        const session = sessionRepository.create({
          userId,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt,
        });
        
        return await sessionRepository.save(session);
      }),
      refreshAccessToken: vi.fn(async () => ({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      })),
      revokeToken: vi.fn(async () => {}),
      getUserFromToken: vi.fn(async () => {
        const userRepository = AppDataSource.getRepository(User);
        return await userRepository.findOne({ where: { email: 'test@example.com' } });
      }),
    })),
  };
});

describe('Auth Routes', () => {
  let app: Express;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean up database in correct order (respecting foreign key constraints)
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      // Disable foreign key checks temporarily
      await queryRunner.query('SET session_replication_role = replica;');
      
      // Clear tables
      await queryRunner.query('TRUNCATE TABLE sessions CASCADE;');
      await queryRunner.query('TRUNCATE TABLE projects CASCADE;');
      await queryRunner.query('TRUNCATE TABLE suppliers CASCADE;');
      await queryRunner.query('TRUNCATE TABLE users CASCADE;');
      
      // Re-enable foreign key checks
      await queryRunner.query('SET session_replication_role = DEFAULT;');
    } finally {
      await queryRunner.release();
    }
  });

  describe('GET /api/auth/login', () => {
    it('should return authorization URL', async () => {
      const response = await request(app)
        .get('/api/auth/login')
        .query({ redirect_uri: 'http://localhost:3000/auth/callback' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('authorizationUrl');
      expect(response.body.authorizationUrl).toContain('http://localhost:8080');
      expect(response.body.authorizationUrl).toContain('client_id=renovator-app');
      expect(response.body.authorizationUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback');
    });

    it('should include state parameter when provided', async () => {
      const response = await request(app)
        .get('/api/auth/login')
        .query({
          redirect_uri: 'http://localhost:3000/auth/callback',
          state: 'random-state-123',
        });

      expect(response.status).toBe(200);
      expect(response.body.authorizationUrl).toContain('state=random-state-123');
    });
  });

  describe('GET /api/auth/callback', () => {
    it('should exchange code for tokens and create session', async () => {
      const response = await request(app)
        .get('/api/auth/callback')
        .query({
          code: 'auth-code-123',
          redirect_uri: 'http://localhost:3000/auth/callback',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 if code is missing', async () => {
      const response = await request(app)
        .get('/api/auth/callback')
        .query({ redirect_uri: 'http://localhost:3000/auth/callback' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Authorization code is required');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      // First create a session
      const callbackResponse = await request(app)
        .get('/api/auth/callback')
        .query({
          code: 'auth-code-123',
          redirect_uri: 'http://localhost:3000/auth/callback',
        });

      const { refreshToken } = callbackResponse.body;

      // Now refresh the token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
    });

    it('should return 400 if refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Refresh token is required');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and delete session', async () => {
      // First create a session
      const callbackResponse = await request(app)
        .get('/api/auth/callback')
        .query({
          code: 'auth-code-123',
          redirect_uri: 'http://localhost:3000/auth/callback',
        });

      const { accessToken, sessionId } = callbackResponse.body;

      // Now logout
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ accessToken, sessionId });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');

      // Verify session is deleted
      const sessionRepository = AppDataSource.getRepository(Session);
      const session = await sessionRepository.findOne({ where: { id: sessionId } });
      expect(session).toBeNull();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info for valid token', async () => {
      // First create a session
      const callbackResponse = await request(app)
        .get('/api/auth/callback')
        .query({
          code: 'auth-code-123',
          redirect_uri: 'http://localhost:3000/auth/callback',
        });

      const { accessToken } = callbackResponse.body;

      // Get user info
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should return 401 if no token provided', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });
  });
});
