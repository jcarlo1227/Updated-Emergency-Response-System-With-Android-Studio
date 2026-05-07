import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { env } from '../../config/env.js';
function isAccessTokenClaims(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const v = value;
    return (typeof v.sub === 'string' &&
        typeof v.email === 'string' &&
        (v.role === 'user' || v.role === 'responder' || v.role === 'admin'));
}
function isRefreshTokenClaims(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const v = value;
    return (typeof v.sub === 'string' &&
        typeof v.jti === 'string' &&
        (v.role === 'user' || v.role === 'responder' || v.role === 'admin'));
}
export function signAccessToken(claims) {
    const opts = { expiresIn: env.JWT_ACCESS_TTL };
    return jwt.sign(claims, env.JWT_SECRET, opts);
}
function parseTtlMs(ttl) {
    const match = /^(\d+)\s*([smhd])$/.exec(ttl.trim());
    if (!match)
        return 30 * 24 * 60 * 60 * 1000;
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
export function mintRefreshToken(accountId, role) {
    const jti = randomBytes(24).toString('hex');
    const payload = { sub: accountId, jti, role };
    const opts = { expiresIn: env.JWT_REFRESH_TTL };
    const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, opts);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + parseTtlMs(env.JWT_REFRESH_TTL));
    return { token, jti, tokenHash, expiresAt };
}
export function verifyAccessToken(token) {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!isAccessTokenClaims(decoded))
        throw new Error('Invalid access token claims');
    return decoded;
}
export function verifyRefreshToken(token) {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (!isRefreshTokenClaims(decoded))
        throw new Error('Invalid refresh token claims');
    return decoded;
}
export function hashRefreshToken(token) {
    return createHash('sha256').update(token).digest('hex');
}
