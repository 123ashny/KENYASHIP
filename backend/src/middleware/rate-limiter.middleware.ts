import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

/**
 * Rate Limiting Middleware
 */

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ?? req.ip ?? 'unknown',
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many login attempts' },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Very strict limiter for sensitive operations
export const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many sensitive operations' },
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// OTP/code verification limiter
export const verificationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,
    message: {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many verification attempts' },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
