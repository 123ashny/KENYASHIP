import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { config, validateConfig } from './config/index.js';
import { logger } from './utils/logger.js';

// Middleware
import { authMiddleware } from './middleware/auth.middleware.js';
import { apiLimiter } from './middleware/rate-limiter.middleware.js';
import { auditMiddleware } from './middleware/audit.middleware.js';

// Service routers
import { locationRouter } from './services/location-obfuscation/index.js';
import { codeRouter } from './services/code-generation/index.js';
import { verificationRouter } from './services/delivery-verification/index.js';
import { securityRouter } from './services/cargo-security/index.js';
import { emergencyRouter } from './services/emergency-response/index.js';
import { privacyRouter } from './services/privacy-access-control/index.js';
import { notificationRouter } from './services/notification-delivery/index.js';
import { realtimeRouter, initializeWebSocket } from './services/realtime-broadcast/index.js';

/**
 * KenyaShip Privacy-Enhanced Security Backend
 * Main Server Entry Point
 */

// Validate configuration on startup
validateConfig();

const app = express();
const httpServer = createServer(app);

// Global middleware
app.use(helmet({
    contentSecurityPolicy: config.nodeEnv === 'production',
    crossOriginEmbedderPolicy: false,
}));
app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth and audit
app.use(authMiddleware);
app.use(auditMiddleware);

// Rate limiting
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'kenyaship-security',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use('/api/location', locationRouter);
app.use('/api/codes', codeRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/security', securityRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/privacy', privacyRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/realtime', realtimeRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack, requestId: req.requestId });
    res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: config.nodeEnv === 'production' ? 'Internal server error' : err.message },
    });
});

// Initialize WebSocket
initializeWebSocket(httpServer);

// Start server
httpServer.listen(config.port, () => {
    logger.info(`KenyaShip Security Server started`, {
        port: config.port,
        env: config.nodeEnv,
        services: [
            'location-obfuscation',
            'code-generation',
            'delivery-verification',
            'cargo-security',
            'emergency-response',
            'privacy-access-control',
            'notification-delivery',
            'realtime-broadcast',
        ],
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down...');
    httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

export { app, httpServer };
