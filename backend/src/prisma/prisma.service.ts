import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('database.url'),
        },
      },
      log: configService.get('database.logQueries')
        ? ['query', 'info', 'warn', 'error']
        : ['error', 'warn'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Conexión a la base de datos establecida');
    } catch (error) {
      this.logger.error('❌ Error al conectar con la base de datos:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Conexión a la base de datos cerrada');
  }

  /**
   * Limpia todas las tablas de la base de datos (útil para tests)
   */
  async cleanDatabase() {
    if (this.configService.get('app.nodeEnv') === 'production') {
      throw new Error('No se puede limpiar la base de datos en producción');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && !key.startsWith('_') && !key.startsWith('$'),
    );

    for (const model of models) {
      await this[model].deleteMany().catch(() => {
        // Ignora errores si la tabla no existe
      });
    }
  }

  /**
   * Ejecuta una transacción con reintentos
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Intento ${attempt} fallido, reintentando...`);
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }

    throw lastError;
  }
}
