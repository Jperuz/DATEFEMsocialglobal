import { registerAs } from '@nestjs/config';

export const mercadopagoConfig = registerAs('mercadopago', () => ({
  // Credenciales de MercadoPago
  accessToken: process.env.MP_ACCESS_TOKEN,
  publicKey: process.env.MP_PUBLIC_KEY,
  clientId: process.env.MP_CLIENT_ID,
  clientSecret: process.env.MP_CLIENT_SECRET,
  
  // Webhook
  webhookSecret: process.env.MP_WEBHOOK_SECRET,
  webhookUrl: process.env.MP_WEBHOOK_URL,
  
  // Configuración
  sandbox: process.env.MP_SANDBOX === 'true',
  
  // URLs de retorno
  successUrl: process.env.MP_SUCCESS_URL,
  failureUrl: process.env.MP_FAILURE_URL,
  pendingUrl: process.env.MP_PENDING_URL,
  
  // Configuración de pagos
  currency: process.env.MP_CURRENCY || 'ARS',
  
  // Pagos en cuotas
  maxInstallments: parseInt(process.env.MP_MAX_INSTALLMENTS, 10) || 12,
  defaultInstallments: parseInt(process.env.MP_DEFAULT_INSTALLMENTS, 10) || 1,
}));
