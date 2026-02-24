import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Prefijo global para API
  app.setGlobalPrefix('api/v1');

  // Middleware de seguridad
  app.use(helmet.default());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || '*',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en DTOs
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no definidas
      transform: true, // Transforma tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de Swagger (Documentación API)
  const config = new DocumentBuilder()
    .setTitle('DATEFEM API')
    .setDescription('API REST para la plataforma de reservas DATEFEM')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Endpoints de autenticación')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Comunas', 'Gestión de comunas (multi-tenant)')
    .addTag('Businesses', 'Gestión de comercios')
    .addTag('Categories', 'Categorías de servicios')
    .addTag('Services', 'Servicios ofrecidos')
    .addTag('Promotions', 'Promociones y descuentos')
    .addTag('Bookings', 'Reservas y citas')
    .addTag('Payments', 'Pagos y transacciones')
    .addTag('Reviews', 'Reseñas y calificaciones')
    .addTag('Notifications', 'Notificaciones')
    .addTag('Verticals', 'Verticales de negocio')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'DATEFEM API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // Puerto
  const port = configService.get('PORT') || 3000;
  
  await app.listen(port);
  
  logger.log(`========================================`);
  logger.log(`🚀 DATEFEM API ejecutándose en puerto ${port}`);
  logger.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
  logger.log(`🔧 Entorno: ${configService.get('NODE_ENV') || 'development'}`);
  logger.log(`========================================`);
}

bootstrap();
