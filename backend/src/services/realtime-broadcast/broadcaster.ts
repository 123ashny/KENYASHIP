import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import type {
    RealtimeEvent,
    RealtimeEventType,
    UserRole,
    UUID
} from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

/**
 * Real-Time Status Broadcasting System
 * WebSocket server with privacy-filtered updates
 */

let io: SocketIOServer | null = null;

// Connected clients
const clients = new Map<string, { userId: UUID; role: UserRole; socket: Socket }>();

// Offline message queue (per user)
const offlineQueue = new Map<UUID, RealtimeEvent[]>();

// Room management
const deliveryRooms = new Map<UUID, Set<string>>(); // deliveryId -> socket IDs

export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: { origin: config.corsOrigin, methods: ['GET', 'POST'] },
        pingTimeout: 30000,
        pingInterval: 25000,
    });

    io.on('connection', (socket: Socket) => {
        logger.info('WebSocket client connected', { socketId: socket.id });

        socket.on('authenticate', (data: { userId: UUID; role: UserRole }) => {
            clients.set(socket.id, { userId: data.userId, role: data.role, socket });

            // Send queued messages
            const queued = offlineQueue.get(data.userId);
            if (queued && queued.length > 0) {
                queued.forEach(event => socket.emit('event', event));
                offlineQueue.delete(data.userId);
                logger.info('Delivered queued messages', { userId: data.userId, count: queued.length });
            }

            socket.emit('authenticated', { success: true });
            logger.info('Client authenticated', { userId: data.userId, role: data.role });
        });

        socket.on('subscribe:delivery', (deliveryId: UUID) => {
            socket.join(`delivery:${deliveryId}`);
            const room = deliveryRooms.get(deliveryId) || new Set();
            room.add(socket.id);
            deliveryRooms.set(deliveryId, room);
            logger.debug('Client subscribed to delivery', { socketId: socket.id, deliveryId });
        });

        socket.on('unsubscribe:delivery', (deliveryId: UUID) => {
            socket.leave(`delivery:${deliveryId}`);
            const room = deliveryRooms.get(deliveryId);
            if (room) room.delete(socket.id);
        });

        socket.on('disconnect', () => {
            clients.delete(socket.id);
            deliveryRooms.forEach(room => room.delete(socket.id));
            logger.info('WebSocket client disconnected', { socketId: socket.id });
        });

        socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }));
    });

    logger.info('WebSocket server initialized');
    return io;
}

export function broadcast(event: RealtimeEvent): void {
    if (!io) {
        logger.warn('Cannot broadcast - WebSocket not initialized');
        return;
    }

    const { audience } = event;

    // Broadcast to specific delivery room
    if (audience.deliveryId) {
        io.to(`delivery:${audience.deliveryId}`).emit('event', event);
    }

    // Broadcast to specific users
    if (audience.userIds && audience.userIds.length > 0) {
        for (const [, client] of clients) {
            if (audience.userIds.includes(client.userId)) {
                client.socket.emit('event', event);
            }
        }

        // Queue for offline users
        audience.userIds.forEach(userId => {
            const isOnline = Array.from(clients.values()).some(c => c.userId === userId);
            if (!isOnline) {
                const queue = offlineQueue.get(userId) || [];
                queue.push(event);
                if (queue.length > 50) queue.shift(); // Limit queue size
                offlineQueue.set(userId, queue);
            }
        });
    }

    // Broadcast to roles
    if (audience.roles && audience.roles.length > 0) {
        for (const [, client] of clients) {
            if (audience.roles.includes(client.role)) {
                client.socket.emit('event', event);
            }
        }
    }

    logger.debug('Event broadcast', { type: event.type, eventId: event.eventId });
}

export function broadcastDeliveryUpdate(
    deliveryId: UUID,
    status: string,
    zoneDescription?: string
): void {
    broadcast({
        type: 'delivery:status_update',
        timestamp: new Date().toISOString(),
        audience: { deliveryId },
        payload: { deliveryId, status, zoneDescription },
        eventId: `${deliveryId}-${Date.now()}`,
    });
}

export function broadcastSecurityAlert(
    deliveryId: UUID,
    alertType: string,
    severity: string
): void {
    broadcast({
        type: 'alert:security',
        timestamp: new Date().toISOString(),
        audience: { deliveryId, roles: ['security_officer', 'admin'] },
        payload: { deliveryId, alertType, severity },
        eventId: `alert-${Date.now()}`,
    });
}

export function broadcastEmergency(driverId: UUID, emergencyId: UUID): void {
    broadcast({
        type: 'alert:emergency',
        timestamp: new Date().toISOString(),
        audience: { roles: ['security_officer', 'admin', 'dispatcher'] },
        payload: { driverId, emergencyId },
        eventId: `emergency-${emergencyId}`,
    });
}

export function getConnectionStats(): { total: number; byRole: Record<UserRole, number> } {
    const byRole: Record<UserRole, number> = {
        customer: 0, driver: 0, dispatcher: 0, security_officer: 0, admin: 0, system: 0,
    };
    for (const client of clients.values()) {
        byRole[client.role]++;
    }
    return { total: clients.size, byRole };
}

export function closeWebSocket(): void {
    if (io) {
        io.close();
        io = null;
        clients.clear();
        deliveryRooms.clear();
        offlineQueue.clear();
        logger.info('WebSocket server closed');
    }
}
