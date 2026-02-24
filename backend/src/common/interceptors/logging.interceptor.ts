import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interceptor que loguea todas las peticiones HTTP
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const ip = request.ip;
    const userId = request.user?.id || 'anonymous';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          this.logger.log(
            `[${method}] ${url} - ${statusCode} - ${duration}ms - User: ${userId} - IP: ${ip}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            `[${method}] ${url} - ${statusCode} - ${duration}ms - User: ${userId} - IP: ${ip} - Error: ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }
}
