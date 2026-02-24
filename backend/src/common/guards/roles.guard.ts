import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtiene los roles requeridos del decorador @Roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles requeridos, permite el acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtiene el usuario del request
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // Verifica si el usuario tiene alguno de los roles requeridos
    return requiredRoles.some((role) => user.role === role);
  }
}
