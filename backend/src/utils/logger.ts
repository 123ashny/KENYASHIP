import winston from 'winston';
import { config } from '../config/index.js';

// Regex to catch sensitive keys
const sensitivePattern = new RegExp(
    '(?:\\bpassword\\b|\\bsecret\\b|\\bapiKey\\b|\\btoken\\b|\\b_private\\b|\\bcoordinates\\b|\\blatitude\\b|\\blongitude\\b|\\b_raw\\b)\\s*:\\s*\'?\"?([^\'",\\s]+)[\'\"\\s,]*',
    'gi'
);

const redactSensitiveData = winston.format((info) => {
    // Redact message
    if (info.message && typeof info.message === 'string') {
        info.message = info.message.replace(sensitivePattern, '$1: [REDACTED]');
    }

    // Redact error
    if (info.error && info.error instanceof Error) {
        info.error.message = info.error.message.replace(sensitivePattern, '[REDACTED]');
    }

    // Redact metadata objects
    if (typeof info === 'object') {
        const redactObject = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            for (const key in obj) {
                if (sensitivePattern.test(key)) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object') {
                    redactObject(obj[key]);
                } else if (typeof obj[key] === 'string' && sensitivePattern.test(obj[key])) {
                    // Check values for leaks too if they look like secrets
                }
            }
        };
        // Clone to avoid mutating original if needed, but winston usually passes a mutable info
        // We'll just carefully check the top level info object properties that aren't symbol
        for (const key of Object.getOwnPropertyNames(info)) {
            if (key !== 'message' && key !== 'level' && key !== 'timestamp') {
                redactObject(info[key]);
            }
        }
    }

    return info;
});

const logger = winston.createLogger({
    level: config.logLevel || 'info',
    format: winston.format.combine(
        redactSensitiveData(),
        winston.format.timestamp(),
        config.nodeEnv === 'production'
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })
            )
    ),
    transports: [
        new winston.transports.Console()
    ]
});

export const createRequestLogger = (requestId: string) => {
    return logger.child({ requestId });
};

export const logSecurityEvent = (details: Record<string, any>) => {
    logger.warn('SECURITY_EVENT', { ...details, category: 'audit_log' });
};

export const logDataAccess = (details: Record<string, any>) => {
    logger.info('DATA_ACCESS', { ...details, category: 'audit_log' });
};

export { logger };
