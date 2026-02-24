import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Middleware para auditoría de operaciones
 * Registra cambios importantes en la base de datos
 */
@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditMiddleware.name);

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Captura el estado inicial para comparar después
    const startTime = Date.now();
    const user = req.user as any;

    // Guarda la respuesta original
    const originalJson = res.json.bind(res);

    // Intercepta la respuesta
    res.json = (body: any) => {
      // Registra la operación de forma asíncrona (no bloquea)
      this.logOperation(req, res, body, user, startTime).catch((err) => {
        this.logger.error('Error al registrar auditoría:', err);
      });

      return originalJson(body);
    };

    next();
  }

  private async logOperation(
    req: Request,
    res: Response,
    body: any,
    user: any,
    startTime: number,
  ) {
    try {
      // Solo registra operaciones exitosas
      if (res.statusCode >= 400) {
        return;
      }

      const duration = Date.now() - startTime;
      const entity = this.extractEntityFromPath(req.path);
      const action = this.mapMethodToAction(req.method);

      // No registra operaciones de lectura
      if (action === 'READ') {
        return;
      }

      await this.prisma.auditLog.create({
        data: {
          userId: user?.id,
          userEmail: user?.email,
          userRole: user?.role,
          action,
          entity,
          entityId: body?.data?.id || req.params.id,
          newData: body?.data || req.body,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    } catch (error) {
      // No lanza error si falla la auditoría
      this.logger.warn('No se pudo registrar auditoría:', error.message);
    }
  }

  private extractEntityFromPath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    // Remueve 'api' y 'v1' si existen
    const entityIndex = parts[0] === 'api' ? 2 : 0;
    return parts[entityIndex] || 'unknown';
  }

  private mapMethodToAction(method: string): string {
    const mapping: Record<string, string> = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return mapping[method] || method;
  }
}
