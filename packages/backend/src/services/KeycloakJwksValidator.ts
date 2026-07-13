import {
  createRemoteJWKSet,
  jwtVerify,
  JWTPayload,
  JWTVerifyGetKey,
  errors as joseErrors,
} from 'jose';

export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  expiresAt?: Date;
  scopes?: string[];
}

export class KeycloakJwksValidator {
  private readonly issuer: string;
  private readonly clientId: string;
  private readonly jwks: JWTVerifyGetKey;

  constructor(
    keycloakUrl: string,
    realm: string,
    clientId: string,
    jwks?: JWTVerifyGetKey
  ) {
    const realmUrl = `${keycloakUrl.replace(/\/$/, '')}/realms/${realm}`;
    this.issuer = realmUrl;
    this.clientId = clientId;
    this.jwks =
      jwks ??
      createRemoteJWKSet(
        new URL(`${realmUrl}/protocol/openid-connect/certs`)
      );
  }

  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
      });

      if (!this.isAccessTokenForClient(payload)) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: payload.sub,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
        scopes:
          typeof payload.scope === 'string'
            ? payload.scope.split(' ')
            : undefined,
      };
    } catch (error) {
      if (this.isTokenValidationError(error)) {
        return { valid: false };
      }
      throw error;
    }
  }

  private isAccessTokenForClient(payload: JWTPayload): boolean {
    const authorizedParty = payload.azp;
    if (typeof authorizedParty === 'string' && authorizedParty === this.clientId) {
      return true;
    }

    const audience = payload.aud;
    if (typeof audience === 'string') {
      return audience === this.clientId;
    }
    if (Array.isArray(audience)) {
      return audience.includes(this.clientId);
    }

    return false;
  }

  private isTokenValidationError(error: unknown): boolean {
    return (
      error instanceof joseErrors.JWTExpired ||
      error instanceof joseErrors.JWTClaimValidationFailed ||
      error instanceof joseErrors.JWSSignatureVerificationFailed ||
      error instanceof joseErrors.JWKSTimeout ||
      error instanceof joseErrors.JWKSNoMatchingKey ||
      error instanceof joseErrors.JWTInvalid ||
      error instanceof joseErrors.JWSInvalid
    );
  }
}
