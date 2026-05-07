import jwt, { type SignOptions } from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { env } from '../../config/env.js';
import type { AuthRole } from '../../shared/types/http.js';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: AuthRole;
}

export interface RefreshTokenClaims {
  sub: string;
  jti: string;
  role: AuthRole;
}

function isAccessTokenClaims(value: unknown): value is AccessTokenClaims {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.sub === 'string' &&
    typeof v.email === 'string' &&
    (v.role === 'user' || v.role === 'responder' || v.role === 'admin')
  );
}

function isRefreshTokenClaims(value: unknown): value is RefreshTokenClaims {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.sub === 'string' &&
    typeof v.jti === 'string' &&
    (v.role === 'user' || v.role === 'responder' || v.role === 'admin')
  );
}

export function signAccessToken(claims: AccessTokenClaims): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'] };
  return jwt.sign(claims, env.JWT_SECRET, opts);
}

export interface MintedRefresh {
  token: string;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
}

function parseTtlMs(ttl: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(ttl.trim());
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default: return 30 * 24 * 60 * 60 * 1000;
  }
}

export function mintRefreshToken(accountId: string, role: AuthRole): MintedRefresh {
  const jti = randomBytes(24).toString('hex');
  const payload: RefreshTokenClaims = { sub: accountId, jti, role };
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions['expiresIn'] };
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, opts);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + parseTtlMs(env.JWT_REFRESH_TTL));
  return { token, jti, tokenHash, expiresAt };
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (!isAccessTokenClaims(decoded)) throw new Error('Invalid access token claims');
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (!isRefreshTokenClaims(decoded)) throw new Error('Invalid refresh token claims');
  return decoded;
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
