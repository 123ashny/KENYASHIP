import { UserRole, Permission } from '../../types/index.js';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    customer: ['read:own_delivery', 'write:own_delivery_consent', 'read:own_notification'],
    driver: ['read:assigned_delivery', 'write:delivery_status', 'read:emergency', 'write:emergency'],
    dispatcher: ['read:all_delivery', 'write:delivery_assignment', 'read:emergency', 'read:audit'],
    security_officer: ['read:security_alert', 'write:security_alert', 'read:emergency', 'read:audit', 'read:location_history'],
    admin: ['*'],
    system: ['*']
};

import { logger } from '../../utils/logger.js';

export function getUserPermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
    const perms = getUserPermissions(userRole);
    return perms.includes('*') || perms.includes(permission);
}

export function createAuditEntry(record: Record<string, any>): void {
    logger.info('AUDIT', record);
}
