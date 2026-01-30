import { z } from 'zod';

// Core Types
export type UUID = string;
export type H3Index = string;
export type DateTimeString = string; // ISO 8601

export type UserRole = 'customer' | 'driver' | 'dispatcher' | 'security_officer' | 'admin' | 'system';
export type Permission = string;

// API Response Wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        requestId: string;
        timestamp: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
        };
    };
}

// Location & Privacy
export interface RawCoordinates {
    latitude: number;
    longitude: number;
}

export interface ObfuscatedLocation {
    zoneId: H3Index;
    approximateTime: DateTimeString;
    movementState: 'stationary' | 'moving' | 'unknown';
    resolution: number;
    zoneDescription?: string;
}

// Code Generation
export interface DeliveryCode {
    id: UUID;
    deliveryId: UUID;
    code: string;
    theme: string;
    expiresAt: DateTimeString;
    usedAt: DateTimeString | null;
    generatedBy: UUID;
    createdAt: DateTimeString;
}

// Verification
export type VerificationMethod = 'otp' | 'code' | 'photo' | 'signature' | 'geofence' | 'biometric';

export interface DeliveryVerification {
    id: UUID;
    deliveryId: UUID;
    methodsRequired: VerificationMethod[];
    methodsCompleted: VerificationMethod[];
    isComplete: boolean;
    completedAt?: DateTimeString;
}

export interface OTPRecord {
    id: UUID;
    deliveryId: UUID;
    recipientId: UUID;
    otpEncrypted: string;
    expiresAt: DateTimeString;
    createdAt: DateTimeString;
    attemptCount: number;
    isVerified: boolean;
    verifiedAt?: DateTimeString;
}

export interface DeliveryPhoto {
    id: UUID;
    deliveryId: UUID;
    photoEncrypted: string; // Base64 encrypted
    metadata: {
        width: number;
        height: number;
        mimeType: string;
        sizeBytes: number;
    };
    capturedAt: DateTimeString;
    zoneId?: H3Index;
}

export interface DeliverySignature {
    id: UUID;
    deliveryId: UUID;
    signatureEncrypted: string;
    signatureHash: string; // SHA-256 for integrity
    signerName?: string; // Encrypted
    capturedAt: DateTimeString;
}

// Security & Cargo
export type AnomalyType = 'route_deviation' | 'unusual_stop' | 'speed_anomaly' | 'time_anomaly' | 'geofence_breach' | 'tampering_detected' | 'communication_lost';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityAlert {
    id: UUID;
    deliveryId: UUID;
    driverId: UUID;
    vehicleId?: UUID;
    anomalyType: AnomalyType;
    severity: AlertSeverity;
    zoneId: H3Index;
    detectedAt: DateTimeString;
    description: string;
    isAcknowledged: boolean;
    acknowledgedAt?: DateTimeString;
    acknowledgedBy?: UUID;
    resolution?: {
        status: 'false_positive' | 'investigated' | 'escalated' | 'resolved';
        notes?: string;
        resolvedAt: DateTimeString;
        resolvedBy: UUID;
    };
}

// Emergency
export type EmergencyType = 'panic_button' | 'accident_detected' | 'medical' | 'security_threat';

export interface EmergencyRecord {
    id: UUID;
    driverId: UUID;
    deliveryId?: UUID;
    emergencyType: EmergencyType;
    location: RawCoordinates; // PRIVACY EXCEPTION
    triggeredAt: DateTimeString;
    status: 'triggered' | 'responding' | 'acknowledged' | 'resolved';
    notificationsent: string[];
}

// Notifications
export type NotificationChannel = 'sms' | 'push' | 'whatsapp' | 'ussd' | 'email';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationRecord {
    id: UUID;
    recipientId: UUID;
    channel: NotificationChannel;
    priority: NotificationPriority;
    templateId: string;
    contentEncrypted: string;
    scheduledAt: DateTimeString;
    sentAt?: DateTimeString;
    deliveredAt?: DateTimeString;
    readAt?: DateTimeString;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    retryCount: number;
    maxRetries: number;
    failureReason?: string;
}

// Real-Time
export type RealtimeEventType = 'delivery:status_update' | 'alert:security' | 'alert:emergency' | 'location:update';

export interface RealtimeEvent {
    eventId: string;
    type: string; // extensible
    timestamp: DateTimeString;
    audience: {
        userIds?: UUID[];
        roles?: UserRole[];
        deliveryId?: UUID;
    };
    payload: Record<string, any>;
}
