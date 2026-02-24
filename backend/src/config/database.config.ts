import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  // URL de conexión a PostgreSQL
  url: process.env.DATABASE_URL,
  
  // Configuración de conexión (para desarrollo)
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'datefem',
  password: process.env.DB_PASSWORD || 'datefem123',
  database: process.env.DB_NAME || 'datefem_db',
  
  // Opciones de Prisma
  logQueries: process.env.DB_LOG_QUERIES === 'true',
  
  // Pool de conexiones
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
}));
