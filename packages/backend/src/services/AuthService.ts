import axios from 'axios';
import config from '../config';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Session } from '../entities/Session';
import { SessionService } from './SessionService';

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  expiresAt?: Date;
  scopes?: string[];
}

export interface UserInfo {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  phone?: string;
  company?: string;
}

export class AuthService {
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authorizationEndpoint: string;
  private readonly tokenEndpoint: string;
  private readonly userInfoEndpoint: string;
  private readonly tokenIntrospectionEndpoint: string;
  private readonly logoutEndpoint: string;
  private readonly sessionService: SessionService;

  constructor() {
    this.keycloakUrl = config.keycloak.url;
    this.realm = config.keycloak.realm;
    this.clientId = config.keycloak.clientId;
    this.clientSecret = config.keycloak.clientSecret;

    const realmUrl = `${this.keycloakUrl}/realms/${this.realm}`;
    this.authorizationEndpoint = `${realmUrl}/protocol/openid-connect/auth`;
    this.tokenEndpoint = `${realmUrl}/protocol/openid-connect/token`;
    this.userInfoEndpoint = `${realmUrl}/protocol/openid-connect/userinfo`;
    this.tokenIntrospectionEndpoint = `${realmUrl}/protocol/openid-connect/token/introspect`;
    this.logoutEndpoint = `${realmUrl}/protocol/openid-connect/logout`;
    this.sessionService = new SessionService();
  }

  /**
   * Generate OAuth 2.0 authorization URL for the authorization code flow
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<OAuthTokens> {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await axios.post(this.tokenEndpoint, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        idToken: response.data.id_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to exchange code for tokens: ${error.response?.data?.error_description || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await axios.post(this.tokenEndpoint, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        idToken: response.data.id_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to refresh access token: ${error.response?.data?.error_description || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Validate access token using token introspection endpoint
   */
  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      const params = new URLSearchParams({
        token,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      const response = await axios.post(
        this.tokenIntrospectionEndpoint,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = response.data;

      if (!data.active) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: data.sub,
        expiresAt: data.exp ? new Date(data.exp * 1000) : undefined,
        scopes: data.scope ? data.scope.split(' ') : undefined,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to validate access token: ${error.response?.data?.error_description || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get user information from access token
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const response = await axios.get(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get user info: ${error.response?.data?.error_description || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Revoke token (logout)
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const params = new URLSearchParams({
        token,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      await axios.post(this.logoutEndpoint, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to revoke token: ${error.response?.data?.error_description || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get user from token by fetching user info and looking up in database
   */
  async getUserFromToken(accessToken: string): Promise<User | null> {
    const userInfo = await this.getUserInfo(accessToken);
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { idpUserId: userInfo.sub },
    });

    return user;
  }

  /**
   * Create or update user from OAuth user info
   */
  async createOrUpdateUser(userInfo: UserInfo): Promise<User> {
    const userRepository = AppDataSource.getRepository(User);
    
    let user = await userRepository.findOne({
      where: { idpUserId: userInfo.sub },
    });

    if (user) {
      // Update existing user
      user.email = userInfo.email;
      user.firstName = userInfo.given_name || '';
      user.lastName = userInfo.family_name || '';
      user.phone = userInfo.phone;
      user.company = userInfo.company;
      user.lastLoginAt = new Date();
    } else {
      // Create new user
      user = userRepository.create({
        email: userInfo.email,
        idpUserId: userInfo.sub,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        phone: userInfo.phone,
        company: userInfo.company,
        lastLoginAt: new Date(),
      });
    }

    return await userRepository.save(user);
  }

  /**
   * Create session for user
   */
  async createSession(userId: string, tokens: OAuthTokens): Promise<Session> {
    return this.sessionService.createSession(userId, tokens);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessionService.getSession(sessionId);
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(sessionId: string): Promise<void> {
    return this.sessionService.deleteSession(sessionId);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    return this.sessionService.deleteUserSessions(userId);
  }
}
