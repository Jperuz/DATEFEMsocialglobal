import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Configuración
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { mercadopagoConfig } from './config/mercadopago.config';

// Módulos
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ComunasModule } from './modules/comunas/comunas.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ServicesModule } from './modules/services/services.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { VerticalsModule } from './modules/verticals/verticals.module';

// Guards e Interceptors
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Middleware
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AuditMiddleware } from './common/middleware/audit.middleware';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, mercadopagoConfig],
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),

    // Base de datos
    PrismaModule,

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    ComunasModule,
    BusinessesModule,
    CategoriesModule,
    ServicesModule,
    PromotionsModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    NotificationsModule,
    VerticalsModule,
  ],
  providers: [
    // Guards globales
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Interceptors globales
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Middleware de tenant (multi-tenant)
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Middleware de auditoría
    consumer
      .apply(AuditMiddleware)
      .forRoutes(
        { path: 'api/v1/*', method: RequestMethod.POST },
        { path: 'api/v1/*', method: RequestMethod.PUT },
        { path: 'api/v1/*', method: RequestMethod.PATCH },
        { path: 'api/v1/*', method: RequestMethod.DELETE },
      );
  }
}
