import type { UUID, UserRole, Permission } from './types/index.js';

/**
 * Express Request augmentation
 */
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            user?: {
                id: UUID;
                role: UserRole;
                permissions: Permission[];
            };
        }
    }
}

export { };
