import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener la comuna (tenant) actual desde el request
 * Uso: @CurrentTenant() comunaId: string
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.comunaId;
  },
);
