import { describe, it, expect, beforeAll } from 'vitest';
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
} from 'jose';
import { KeycloakJwksValidator } from './KeycloakJwksValidator';

const KEYCLOAK_URL = 'https://lemur-2.cloud-iam.com/auth';
const REALM = 'renovator';
const CLIENT_ID = 'renovator-app';
const ISSUER = `${KEYCLOAK_URL}/realms/${REALM}`;

describe('KeycloakJwksValidator', () => {
  let privateKey: CryptoKey;
  let jwks: ReturnType<typeof createLocalJWKSet>;

  beforeAll(async () => {
    const keyPair = await generateKeyPair('RS256');
    privateKey = keyPair.privateKey;
    const publicJwk = await exportJWK(keyPair.publicKey);
    publicJwk.alg = 'RS256';
    publicJwk.kid = 'test-key';
    jwks = createLocalJWKSet({ keys: [publicJwk] });
  });

  const createToken = async (
    claims: Record<string, unknown>,
    expiresInSeconds = 3600
  ): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);

    return new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(ISSUER)
      .setSubject('user-123')
      .setIssuedAt(now)
      .setExpirationTime(now + expiresInSeconds)
      .sign(privateKey);
  };

  const validator = () =>
    new KeycloakJwksValidator(KEYCLOAK_URL, REALM, CLIENT_ID, jwks);

  it('should validate a token issued for this client via azp', async () => {
    const token = await createToken({
      azp: CLIENT_ID,
      scope: 'openid email profile',
      typ: 'Bearer',
    });

    const result = await validator().validateAccessToken(token);

    expect(result).toEqual({
      valid: true,
      userId: 'user-123',
      expiresAt: expect.any(Date),
      scopes: ['openid', 'email', 'profile'],
    });
  });

  it('should validate a token when audience includes this client', async () => {
    const token = await createToken({
      aud: ['account', CLIENT_ID],
      scope: 'openid',
    });

    const result = await validator().validateAccessToken(token);

    expect(result.valid).toBe(true);
    expect(result.userId).toBe('user-123');
  });

  it('should reject tokens issued to a different client', async () => {
    const token = await createToken({
      azp: 'other-client',
      aud: 'account',
    });

    const result = await validator().validateAccessToken(token);

    expect(result).toEqual({ valid: false });
  });

  it('should reject expired tokens', async () => {
    const token = await createToken({ azp: CLIENT_ID }, -60);

    const result = await validator().validateAccessToken(token);

    expect(result).toEqual({ valid: false });
  });

  it('should reject tokens with an invalid signature', async () => {
    const otherKeyPair = await generateKeyPair('RS256');
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ azp: CLIENT_ID })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(ISSUER)
      .setSubject('user-123')
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(otherKeyPair.privateKey);

    const result = await validator().validateAccessToken(token);

    expect(result).toEqual({ valid: false });
  });

  it('should reject tokens from a different issuer', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ azp: CLIENT_ID })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer('https://other-idp.example.com/realms/renovator')
      .setSubject('user-123')
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(privateKey);

    const result = await validator().validateAccessToken(token);

    expect(result).toEqual({ valid: false });
  });
});
