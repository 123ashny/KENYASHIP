import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schema with validation
const configSchema = z.object({
    // Server
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
    port: z.coerce.number().int().min(1).max(65535).default(3001),
    host: z.string().default('0.0.0.0'),

    // Security Keys
    jwtSecret: z.string().min(32),
    encryptionKey: z.string().min(32),
    hmacSecret: z.string().min(32),

    // Database
    databaseUrl: z.string().default('./data/kenyaship.db'),

    // Redis (optional)
    redisUrl: z.string().optional(),

    // Location Privacy
    locationGridSizeMeters: z.coerce.number().int().min(50).max(5000).default(500),
    privacyZoneDefaultRadiusMeters: z.coerce.number().int().min(50).max(2000).default(200),
    maxLocationHistoryHours: z.coerce.number().int().min(1).max(168).default(24),

    // Delivery Codes
    codeTtlMinutes: z.coerce.number().int().min(5).max(1440).default(30),
    codeMaxAttempts: z.coerce.number().int().min(1).max(10).default(5),
    codeTheme: z.enum(['adventure', 'nature', 'tech', 'kenyan']).default('kenyan'),

    // OTP
    otpTtlSeconds: z.coerce.number().int().min(60).max(900).default(300),
    otpLength: z.coerce.number().int().min(4).max(8).default(6),

    // Africa's Talking
    atApiKey: z.string().optional(),
    atUsername: z.string().default('sandbox'),
    atSenderId: z.string().default('KenyaShip'),

    // Firebase
    firebaseProjectId: z.string().optional(),
    firebaseClientEmail: z.string().optional(),
    firebasePrivateKey: z.string().optional(),

    // WhatsApp
    whatsappApiUrl: z.string().optional(),
    whatsappAuthToken: z.string().optional(),
    whatsappPhoneNumberId: z.string().optional(),

    // Emergency
    emergencyDispatchUrl: z.string().optional(),
    emergencyApiKey: z.string().optional(),

    // Data Retention (Kenya DPA)
    retentionDaysLocation: z.coerce.number().int().min(7).max(90).default(30),
    retentionDaysDelivery: z.coerce.number().int().min(30).max(730).default(365),
    retentionDaysAudit: z.coerce.number().int().min(365).max(3650).default(2555),

    // Rate Limiting
    rateLimitWindowMs: z.coerce.number().int().min(1000).max(3600000).default(60000),
    rateLimitMaxRequests: z.coerce.number().int().min(10).max(10000).default(100),

    // Logging
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    logFormat: z.enum(['json', 'simple']).default('json'),

    // CORS
    corsOrigin: z.string().default('http://localhost:5173'),
});

type Config = z.infer<typeof configSchema>;

// Parse environment variables into config
function loadConfig(): Config {
    const rawConfig = {
        nodeEnv: process.env['NODE_ENV'],
        port: process.env['PORT'],
        host: process.env['HOST'],
        jwtSecret: process.env['JWT_SECRET'] ?? 'CHANGE_ME_jwt_secret_key_minimum_32_characters_long',
        encryptionKey: process.env['ENCRYPTION_KEY'] ?? 'CHANGE_ME_aes256_encryption_key_32_bytes_hex',
        hmacSecret: process.env['HMAC_SECRET'] ?? 'CHANGE_ME_hmac_secret_key_for_code_generation',
        databaseUrl: process.env['DATABASE_URL'],
        redisUrl: process.env['REDIS_URL'] || undefined,
        locationGridSizeMeters: process.env['LOCATION_GRID_SIZE_METERS'],
        privacyZoneDefaultRadiusMeters: process.env['PRIVACY_ZONE_DEFAULT_RADIUS_METERS'],
        maxLocationHistoryHours: process.env['MAX_LOCATION_HISTORY_HOURS'],
        codeTtlMinutes: process.env['CODE_TTL_MINUTES'],
        codeMaxAttempts: process.env['CODE_MAX_ATTEMPTS'],
        codeTheme: process.env['CODE_THEME'],
        otpTtlSeconds: process.env['OTP_TTL_SECONDS'],
        otpLength: process.env['OTP_LENGTH'],
        atApiKey: process.env['AT_API_KEY'] || undefined,
        atUsername: process.env['AT_USERNAME'],
        atSenderId: process.env['AT_SENDER_ID'],
        firebaseProjectId: process.env['FIREBASE_PROJECT_ID'] || undefined,
        firebaseClientEmail: process.env['FIREBASE_CLIENT_EMAIL'] || undefined,
        firebasePrivateKey: process.env['FIREBASE_PRIVATE_KEY'] || undefined,
        whatsappApiUrl: process.env['WHATSAPP_API_URL'] || undefined,
        whatsappAuthToken: process.env['WHATSAPP_AUTH_TOKEN'] || undefined,
        whatsappPhoneNumberId: process.env['WHATSAPP_PHONE_NUMBER_ID'] || undefined,
        emergencyDispatchUrl: process.env['EMERGENCY_DISPATCH_URL'] || undefined,
        emergencyApiKey: process.env['EMERGENCY_API_KEY'] || undefined,
        retentionDaysLocation: process.env['RETENTION_DAYS_LOCATION'],
        retentionDaysDelivery: process.env['RETENTION_DAYS_DELIVERY'],
        retentionDaysAudit: process.env['RETENTION_DAYS_AUDIT'],
        rateLimitWindowMs: process.env['RATE_LIMIT_WINDOW_MS'],
        rateLimitMaxRequests: process.env['RATE_LIMIT_MAX_REQUESTS'],
        logLevel: process.env['LOG_LEVEL'],
        logFormat: process.env['LOG_FORMAT'],
        corsOrigin: process.env['CORS_ORIGIN'],
    };

    const result = configSchema.safeParse(rawConfig);

    if (!result.success) {
        console.error('❌ Invalid configuration:');
        result.error.issues.forEach(issue => {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        });
        throw new Error('Configuration validation failed');
    }

    // Warn about default security keys in production
    if (result.data.nodeEnv === 'production') {
        if (result.data.jwtSecret.includes('CHANGE_ME')) {
            throw new Error('JWT_SECRET must be changed in production!');
        }
        if (result.data.encryptionKey.includes('CHANGE_ME')) {
            throw new Error('ENCRYPTION_KEY must be changed in production!');
        }
        if (result.data.hmacSecret.includes('CHANGE_ME')) {
            throw new Error('HMAC_SECRET must be changed in production!');
        }
    }

    return result.data;
}

export const config = loadConfig();

/** Validate configuration on startup */
export function validateConfig(): void {
    // Config already validated during loadConfig
    // This is a no-op but provides explicit validation point
}

export type { Config };

