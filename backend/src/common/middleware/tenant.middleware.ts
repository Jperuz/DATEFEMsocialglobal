import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para manejar el multi-tenancy por comuna
 * Extrae el ID de la comuna del header o subdominio
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Intenta obtener la comuna de diferentes fuentes
    let comunaId: string | undefined;

    // 1. Header X-Comuna-Id
    comunaId = req.headers['x-comuna-id'] as string;

    // 2. Query parameter
    if (!comunaId) {
      comunaId = req.query.comunaId as string;
    }

    // 3. Subdominio (ej: palermo.datefem.com)
    if (!comunaId) {
      const host = req.headers.host;
      if (host) {
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
          // Aquí se podría buscar la comuna por slug
          comunaId = subdomain;
        }
      }
    }

    // 4. Path parameter (para rutas específicas de comuna)
    if (!comunaId && req.params.comunaId) {
      comunaId = req.params.comunaId;
    }

    // Asigna la comuna al request
    if (comunaId) {
      req['comunaId'] = comunaId;
      this.logger.debug(`Tenant identificado: ${comunaId}`);
    }

    next();
  }
}
