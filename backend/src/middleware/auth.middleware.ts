import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { UUID, UserRole, Permission } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { getUserPermissions } from '../services/privacy-access-control/access-control.js';

/**
 * Authentication Middleware
 * JWT-based with role extraction
 */

interface JWTPayload {
    userId: UUID;
    role: UserRole;
    exp: number;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Add request ID
    req.requestId = req.headers['x-request-id']?.toString() ?? uuidv4();
    res.setHeader('X-Request-ID', req.requestId);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Allow unauthenticated access for public endpoints
        next();
        return;
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;

        req.user = {
            id: decoded.userId,
            role: decoded.role,
            permissions: getUserPermissions(decoded.role),
        };

        next();
    } catch (error) {
        logger.warn('JWT verification failed', { error: (error as Error).message });
        res.status(401).json({
            success: false,
            error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
        });
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
    }
    next();
}

export function requireRole(...roles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
            });
            return;
        }
        next();
    };
}

export function requirePermission(permission: Permission): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !req.user.permissions.includes(permission)) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Permission denied' },
            });
            return;
        }
        next();
    };
}

export function generateToken(userId: UUID, role: UserRole): string {
    const payload: JWTPayload = {
        userId,
        role,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };
    return jwt.sign(payload, config.jwtSecret);
}
