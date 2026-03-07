import { OAuth2Client } from 'google-auth-library';
import config from '../config';
import { AppDataSource } from '../config/database';
import { UserGoogleDriveToken } from '../entities/UserGoogleDriveToken';
import { TokenEncryptionService } from './TokenEncryptionService';

const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export class GoogleDriveTokenError extends Error {
  constructor(message: string, public readonly userId: string) {
    super(message);
    this.name = 'GoogleDriveTokenError';
  }
}

export class GoogleDriveAuthService {
  private readonly oauth2Client: OAuth2Client;
  private readonly encryptionService: TokenEncryptionService;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri,
    );
    this.encryptionService = new TokenEncryptionService();
  }

  /**
   * Generate Google OAuth consent URL for Drive access.
   * Uses login_hint so Google pre-selects the user's account (skipping account chooser
   * for users who already logged in via Google through Keycloak).
   */
  getAuthorizationUrl(userEmail: string, state: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [DRIVE_FILE_SCOPE],
      login_hint: userEmail,
      state,
    });
  }

  /**
   * Exchange authorization code for tokens, encrypt, and persist.
   */
  async handleCallback(code: string, userId: string): Promise<UserGoogleDriveToken> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. User may need to re-consent.');
    }
    if (!tokens.access_token) {
      throw new Error('No access token received from Google.');
    }

    // Fetch the user's Google email from the token info
    this.oauth2Client.setCredentials(tokens);
    const tokenInfo = await this.oauth2Client.getTokenInfo(tokens.access_token);
    const googleEmail = tokenInfo.email || '';

    const repo = AppDataSource.getRepository(UserGoogleDriveToken);

    // Upsert: replace existing token row for this user
    let driveToken = await repo.findOne({ where: { userId } });

    const accessTokenEncrypted = this.encryptionService.encrypt(tokens.access_token);
    const refreshTokenEncrypted = this.encryptionService.encrypt(tokens.refresh_token);
    const tokenExpiresAt = new Date(tokens.expiry_date || Date.now() + 3600 * 1000);

    if (driveToken) {
      driveToken.googleEmail = googleEmail;
      driveToken.accessTokenEncrypted = accessTokenEncrypted;
      driveToken.refreshTokenEncrypted = refreshTokenEncrypted;
      driveToken.tokenExpiresAt = tokenExpiresAt;
      driveToken.scopes = DRIVE_FILE_SCOPE;
    } else {
      driveToken = repo.create({
        userId,
        googleEmail,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt,
        scopes: DRIVE_FILE_SCOPE,
      });
    }

    return repo.save(driveToken);
  }

  /**
   * Return a fresh access token, auto-refreshing if expired.
   */
  async getAccessToken(userId: string): Promise<string> {
    const repo = AppDataSource.getRepository(UserGoogleDriveToken);
    const driveToken = await repo.findOne({ where: { userId } });

    if (!driveToken) {
      throw new Error('Google Drive not connected for this user.');
    }

    const now = new Date();
    const bufferMs = 60_000; // refresh 1 minute before expiry

    if (driveToken.tokenExpiresAt.getTime() - bufferMs > now.getTime()) {
      return this.encryptionService.decrypt(driveToken.accessTokenEncrypted);
    }

    // Refresh the access token
    const refreshToken = this.encryptionService.decrypt(driveToken.refreshTokenEncrypted);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh Google access token.');
      }

      // Persist refreshed token
      driveToken.accessTokenEncrypted = this.encryptionService.encrypt(credentials.access_token);
      driveToken.tokenExpiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);
      if (credentials.refresh_token) {
        driveToken.refreshTokenEncrypted = this.encryptionService.encrypt(credentials.refresh_token);
      }
      await repo.save(driveToken);

      return credentials.access_token;
    } catch (error: any) {
      const isRevoked =
        error?.response?.status === 400 ||
        error?.response?.status === 401 ||
        error?.message?.includes('invalid_grant') ||
        error?.message?.includes('Token has been expired or revoked');

      if (isRevoked) {
        await repo.remove(driveToken);
        throw new GoogleDriveTokenError(
          'Google Drive access has been revoked. Please reconnect your account.',
          userId,
        );
      }
      throw error;
    }
  }

  /**
   * Build an authenticated OAuth2Client for Google API calls.
   */
  async getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
    const accessToken = await this.getAccessToken(userId);
    const client = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri,
    );
    client.setCredentials({ access_token: accessToken });
    return client;
  }

  /**
   * Revoke Google tokens and delete stored credentials.
   */
  async disconnect(userId: string): Promise<void> {
    const repo = AppDataSource.getRepository(UserGoogleDriveToken);
    const driveToken = await repo.findOne({ where: { userId } });

    if (!driveToken) return;

    try {
      const refreshToken = this.encryptionService.decrypt(driveToken.refreshTokenEncrypted);
      await this.oauth2Client.revokeToken(refreshToken);
    } catch {
      // Best effort — token may already be revoked
    }

    await repo.remove(driveToken);
  }

  async isConnected(userId: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(UserGoogleDriveToken);
    const count = await repo.count({ where: { userId } });
    return count > 0;
  }

  async getConnectionInfo(userId: string): Promise<{ connected: boolean; email?: string }> {
    const repo = AppDataSource.getRepository(UserGoogleDriveToken);
    const driveToken = await repo.findOne({ where: { userId } });

    if (!driveToken) {
      return { connected: false };
    }

    return { connected: true, email: driveToken.googleEmail };
  }
}
