import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  // Clave secreta para firmar tokens
  secret: process.env.JWT_SECRET || 'datefem-super-secret-key-change-in-production',
  
  // Tiempo de expiración del access token
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  
  // Tiempo de expiración del refresh token
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  
  // Emisor del token
  issuer: process.env.JWT_ISSUER || 'datefem-api',
  
  // Audiencia del token
  audience: process.env.JWT_AUDIENCE || 'datefem-app',
}));
