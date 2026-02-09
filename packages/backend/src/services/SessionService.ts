import { AppDataSource } from '../config/database';
import { Session } from '../entities/Session';
import { OAuthTokens } from './AuthService';

export class SessionService {
  /**
   * Create a new session for a user
   */
  async createSession(userId: string, tokens: OAuthTokens): Promise<Session> {
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
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const sessionRepository = AppDataSource.getRepository(Session);
    return await sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });
  }

  /**
   * Get session by access token
   */
  async getSessionByAccessToken(accessToken: string): Promise<Session | null> {
    const sessionRepository = AppDataSource.getRepository(Session);
    return await sessionRepository.findOne({
      where: { accessToken },
      relations: ['user'],
    });
  }
  /**
   * Get session by refresh token
   */
  async getSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    const sessionRepository = AppDataSource.getRepository(Session);
    return await sessionRepository.findOne({
      where: { refreshToken },
      relations: ['user'],
    });
  }


  /**
   * Update session tokens (e.g., after token refresh)
   */
  async updateSession(
    sessionId: string,
    tokens: OAuthTokens
  ): Promise<Session | null> {
    const sessionRepository = AppDataSource.getRepository(Session);
    
    const session = await sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      return null;
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expiresIn);

    session.accessToken = tokens.accessToken;
    session.refreshToken = tokens.refreshToken;
    session.expiresAt = expiresAt;

    return await sessionRepository.save(session);
  }

  /**
   * Delete session by ID (logout)
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionRepository = AppDataSource.getRepository(Session);
    await sessionRepository.delete({ id: sessionId });
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    const sessionRepository = AppDataSource.getRepository(Session);
    await sessionRepository.delete({ userId });
  }

  /**
   * Delete expired sessions (cleanup utility)
   */
  async deleteExpiredSessions(): Promise<number> {
    const sessionRepository = AppDataSource.getRepository(Session);
    const result = await sessionRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(session: Session): boolean {
    return session.expiresAt < new Date();
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    const sessionRepository = AppDataSource.getRepository(Session);
    return await sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
