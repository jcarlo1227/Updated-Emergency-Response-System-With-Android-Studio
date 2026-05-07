import { describe, it, expect, beforeAll } from 'vitest';

// Set required env before importing anything that reads env
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-32-chars';
  process.env.ADMIN_EMAIL = 'admin@test.local';
  process.env.ADMIN_PASSWORD = 'testpassword123';
});

describe('JWT token utilities', async () => {
  const { signAccessToken, mintRefreshToken, verifyAccessToken, verifyRefreshToken, hashRefreshToken } =
    await import('../src/modules/auth/jwt.js');

  it('signs and verifies an access token', () => {
    const claims = { sub: 'user123', email: 'test@test.com', role: 'user' as const };
    const token = signAccessToken(claims);
    expect(typeof token).toBe('string');
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user123');
    expect(decoded.role).toBe('user');
    expect(decoded.email).toBe('test@test.com');
  });

  it('signs and verifies a refresh token', () => {
    const minted = mintRefreshToken('user456', 'responder');
    expect(typeof minted.token).toBe('string');
    expect(typeof minted.jti).toBe('string');
    expect(typeof minted.tokenHash).toBe('string');
    expect(minted.expiresAt).toBeInstanceOf(Date);

    const decoded = verifyRefreshToken(minted.token);
    expect(decoded.sub).toBe('user456');
    expect(decoded.role).toBe('responder');
    expect(decoded.jti).toBe(minted.jti);
  });

  it('hashRefreshToken produces consistent sha256', () => {
    const token = 'sometoken';
    const h1 = hashRefreshToken(token);
    const h2 = hashRefreshToken(token);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64); // sha256 hex
  });

  it('verifyAccessToken throws on tampered token', () => {
    const token = signAccessToken({ sub: 'x', email: 'x@x.com', role: 'admin' });
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('access token payload contains expected roles', () => {
    for (const role of ['user', 'responder', 'admin'] as const) {
      const token = signAccessToken({ sub: 'id', email: 'x@x.com', role });
      const decoded = verifyAccessToken(token);
      expect(decoded.role).toBe(role);
    }
  });
});
