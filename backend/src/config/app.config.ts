import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  // Información de la aplicación
  name: process.env.APP_NAME || 'DATEFEM API',
  version: process.env.APP_VERSION || '1.0.0',
  description: process.env.APP_DESCRIPTION || 'Plataforma de reservas multi-vertical',
  
  // Entorno
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  
  // URLs
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  
  // Seguridad
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Configuración de archivos
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // Paginación por defecto
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  
  // Configuración de QR
  qrCodeExpiry: parseInt(process.env.QR_CODE_EXPIRY, 10) || 30, // minutos
  
  // Configuración de reservas
  bookingAdvanceMinutes: parseInt(process.env.BOOKING_ADVANCE_MINUTES, 10) || 60,
  bookingCancelDeadline: parseInt(process.env.BOOKING_CANCEL_DEADLINE, 10) || 24, // horas
  
  // Recordatorios
  reminderHoursBefore: parseInt(process.env.REMINDER_HOURS_BEFORE, 10) || 24,
}));
