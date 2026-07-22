import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restringe un endpoint a los roles indicados. Debe usarse junto con
 * `RolesGuard` (y `JwtAuthGuard`, que puebla `request.user`).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
