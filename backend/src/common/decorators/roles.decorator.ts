import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorador para especificar roles permitidos en un endpoint
 * Uso: @Roles(Role.ADMIN, Role.BUSINESS_OWNER)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
