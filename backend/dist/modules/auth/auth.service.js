import bcrypt from 'bcryptjs';
import { Admin, RefreshToken, Responder, User } from '../../models/index.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { hashRefreshToken, mintRefreshToken, signAccessToken, verifyRefreshToken, } from './jwt.js';
const SALT_ROUNDS = 10;
function clientMeta(req) {
    const fwd = req.header('x-forwarded-for');
    const ip = (fwd ? fwd.split(',')[0]?.trim() : req.ip) ?? undefined;
    const ua = req.header('user-agent') ?? undefined;
    return { ip, userAgent: ua?.slice(0, 250) };
}
async function persistRefresh(accountId, role, meta) {
    const minted = mintRefreshToken(accountId, role);
    await RefreshToken.create({
        jti: minted.jti,
        tokenHash: minted.tokenHash,
        accountId,
        role,
        expiresAt: minted.expiresAt,
        ip: meta.ip,
        userAgent: meta.userAgent,
    });
    return { token: minted.token };
}
export async function registerUser(input, req) {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
        throw new AppError('Email already registered', 409, 'EMAIL_TAKEN');
    }
    const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await User.create({
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: hashed,
        municipality: input.municipality,
        barangay: input.barangay,
        contacts: [],
    });
    const accessToken = signAccessToken({
        sub: user.id,
        email: user.email,
        role: 'user',
    });
    const { token: refreshToken } = await persistRefresh(user.id, 'user', clientMeta(req));
    return {
        accessToken,
        refreshToken,
        account: {
            id: user.id,
            email: user.email,
            role: 'user',
            name: user.name,
            approvalStatus: user.approvalStatus,
            isApproved: user.isApproved,
        },
    };
}
export async function registerResponder(input, req) {
    const existing = await Responder.findOne({
        $or: [{ email: input.email }, { badgeId: input.badgeId }],
    });
    if (existing) {
        throw new AppError('Email or badge ID already registered', 409, 'RESPONDER_TAKEN');
    }
    const hashed = await bcrypt.hash(input.password, SALT_ROUNDS);
    const responder = await Responder.create({
        name: input.name,
        email: input.email,
        password: hashed,
        badgeId: input.badgeId,
        department: input.department,
        agencyType: input.agencyType,
        stationName: input.stationName,
        position: input.position,
        coverageArea: input.coverageArea,
        isOnDuty: false,
    });
    const accessToken = signAccessToken({
        sub: responder.id,
        email: responder.email,
        role: 'responder',
    });
    const { token: refreshToken } = await persistRefresh(responder.id, 'responder', clientMeta(req));
    return {
        accessToken,
        refreshToken,
        account: {
            id: responder.id,
            email: responder.email,
            role: 'responder',
            name: responder.name,
            approvalStatus: responder.approvalStatus,
            isApproved: responder.isApproved,
        },
    };
}
export async function login(input, req) {
    const role = input.role;
    if (!role || role === 'admin') {
        const admin = await Admin.findOne({ email: input.email });
        if (admin) {
            if (!admin.isActive) {
                throw new AppError('Admin account disabled', 403, 'ACCOUNT_DISABLED');
            }
            const ok = await bcrypt.compare(input.password, admin.password);
            if (!ok)
                throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            admin.lastLoginAt = new Date();
            await admin.save();
            const accessToken = signAccessToken({
                sub: admin.id,
                email: admin.email,
                role: 'admin',
            });
            const { token: refreshToken } = await persistRefresh(admin.id, 'admin', clientMeta(req));
            return {
                accessToken,
                refreshToken,
                account: { id: admin.id, email: admin.email, role: 'admin', name: admin.name },
            };
        }
        if (role === 'admin')
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    if (!role || role === 'user') {
        const user = await User.findOne({ email: input.email });
        if (user) {
            const ok = await bcrypt.compare(input.password, user.password);
            if (!ok)
                throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            if (user.approvalStatus !== 'approved' || !user.isApproved) {
                throw new AppError(`Account ${user.approvalStatus}`, 403, 'ACCOUNT_NOT_APPROVED');
            }
            const accessToken = signAccessToken({
                sub: user.id,
                email: user.email,
                role: 'user',
            });
            const { token: refreshToken } = await persistRefresh(user.id, 'user', clientMeta(req));
            return {
                accessToken,
                refreshToken,
                account: {
                    id: user.id,
                    email: user.email,
                    role: 'user',
                    name: user.name,
                    approvalStatus: user.approvalStatus,
                    isApproved: user.isApproved,
                },
            };
        }
        if (role === 'user')
            throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    if (!role || role === 'responder') {
        const responder = await Responder.findOne({ email: input.email });
        if (responder) {
            const ok = await bcrypt.compare(input.password, responder.password);
            if (!ok)
                throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            if (responder.approvalStatus !== 'approved' || !responder.isApproved) {
                throw new AppError(`Account ${responder.approvalStatus}`, 403, 'ACCOUNT_NOT_APPROVED');
            }
            const accessToken = signAccessToken({
                sub: responder.id,
                email: responder.email,
                role: 'responder',
            });
            const { token: refreshToken } = await persistRefresh(responder.id, 'responder', clientMeta(req));
            return {
                accessToken,
                refreshToken,
                account: {
                    id: responder.id,
                    email: responder.email,
                    role: 'responder',
                    name: responder.name,
                    approvalStatus: responder.approvalStatus,
                    isApproved: responder.isApproved,
                },
            };
        }
    }
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
}
export async function refresh(rawRefreshToken, req) {
    let claims;
    try {
        claims = verifyRefreshToken(rawRefreshToken);
    }
    catch {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH');
    }
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const stored = await RefreshToken.findOne({ jti: claims.jti, tokenHash });
    if (!stored)
        throw new AppError('Refresh token not recognized', 401, 'INVALID_REFRESH');
    if (stored.revokedAt)
        throw new AppError('Refresh token revoked', 401, 'INVALID_REFRESH');
    if (stored.expiresAt.getTime() < Date.now()) {
        throw new AppError('Refresh token expired', 401, 'INVALID_REFRESH');
    }
    const accountId = stored.accountId.toString();
    const role = stored.role;
    let email;
    let name;
    if (role === 'user') {
        const u = await User.findById(accountId);
        if (!u)
            throw new AppError('Account not found', 401, 'ACCOUNT_GONE');
        if (u.approvalStatus !== 'approved' || !u.isApproved) {
            throw new AppError('Account no longer approved', 403, 'ACCOUNT_NOT_APPROVED');
        }
        email = u.email;
        name = u.name;
    }
    else if (role === 'responder') {
        const r = await Responder.findById(accountId);
        if (!r)
            throw new AppError('Account not found', 401, 'ACCOUNT_GONE');
        if (r.approvalStatus !== 'approved' || !r.isApproved) {
            throw new AppError('Account no longer approved', 403, 'ACCOUNT_NOT_APPROVED');
        }
        email = r.email;
        name = r.name;
    }
    else {
        const a = await Admin.findById(accountId);
        if (!a)
            throw new AppError('Account not found', 401, 'ACCOUNT_GONE');
        if (!a.isActive)
            throw new AppError('Admin disabled', 403, 'ACCOUNT_DISABLED');
        email = a.email;
        name = a.name;
    }
    const accessToken = signAccessToken({ sub: accountId, email, role });
    const minted = mintRefreshToken(accountId, role);
    const meta = clientMeta(req);
    await RefreshToken.create({
        jti: minted.jti,
        tokenHash: minted.tokenHash,
        accountId,
        role,
        expiresAt: minted.expiresAt,
        ip: meta.ip,
        userAgent: meta.userAgent,
    });
    stored.revokedAt = new Date();
    stored.replacedBy = minted.jti;
    await stored.save();
    return {
        accessToken,
        refreshToken: minted.token,
        account: { id: accountId, email, role, name },
    };
}
export async function logout(rawRefreshToken) {
    if (!rawRefreshToken)
        return;
    const tokenHash = hashRefreshToken(rawRefreshToken);
    await RefreshToken.updateOne({ tokenHash, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
}
export async function getMe(accountId, role) {
    if (role === 'user') {
        const u = await User.findById(accountId).select('-password').lean();
        if (!u)
            throw new AppError('Account not found', 404, 'NOT_FOUND');
        return { role: 'user', account: u };
    }
    if (role === 'responder') {
        const r = await Responder.findById(accountId).select('-password').lean();
        if (!r)
            throw new AppError('Account not found', 404, 'NOT_FOUND');
        return { role: 'responder', account: r };
    }
    const a = await Admin.findById(accountId).select('-password').lean();
    if (!a)
        throw new AppError('Account not found', 404, 'NOT_FOUND');
    return { role: 'admin', account: a };
}
