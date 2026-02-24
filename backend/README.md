# DATEFEM Backend

Backend API REST para DATEFEM - Plataforma de reservas multi-vertical construida con NestJS, PostgreSQL y Prisma.

## 🚀 Características

- ✅ **API REST** con documentación Swagger
- ✅ **Autenticación JWT** con refresh tokens
- ✅ **Base de datos PostgreSQL** con Prisma ORM
- ✅ **Sistema multi-tenant** por comuna
- ✅ **5 Verticales dinámicas**: Salud, Belleza, DateFit, Servicios, Bienestar
- ✅ **Integración MercadoPago** (webhooks + pagos)
- ✅ **Sistema de roles y permisos**
- ✅ **Generación de QR** para validación de reservas
- ✅ **Auditoría** de operaciones

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/           # Configuraciones (app, db, jwt, mp)
│   ├── common/           # Guards, interceptors, decorators, middleware
│   ├── modules/          # Módulos de la aplicación
│   │   ├── auth/         # Autenticación JWT
│   │   ├── users/        # Gestión de usuarios
│   │   ├── comunas/      # Multi-tenant
│   │   ├── businesses/   # Comercios
│   │   ├── services/     # Servicios
│   │   ├── promotions/   # Promociones
│   │   ├── bookings/     # Reservas + QR
│   │   ├── payments/     # Pagos + MercadoPago
│   │   ├── reviews/      # Reseñas
│   │   ├── notifications/# Notificaciones
│   │   └── verticals/    # Verticales dinámicas
│   ├── prisma/           # Servicio de Prisma
│   └── main.ts           # Punto de entrada
├── prisma/
│   ├── schema.prisma     # Schema de la base de datos
│   └── seed.ts           # Datos de prueba
└── package.json
```

## 🛠️ Instalación Local

### 1. Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 2. Configuración

```bash
# Clonar el repositorio
cd DATEFEM/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Seed de datos de prueba
npx prisma db seed
```

### 3. Ejecutar

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 🐳 Docker

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Detener
docker-compose down
```

## 📚 Documentación API

Una vez ejecutando, accede a:

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

## 🔐 Autenticación

El sistema usa JWT con los siguientes endpoints:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Registro de usuario |
| `/api/v1/auth/login` | POST | Inicio de sesión |
| `/api/v1/auth/refresh` | POST | Refrescar token |
| `/api/v1/auth/me` | GET | Perfil del usuario |

## 🏢 Verticales

Las 5 verticales disponibles:

| Vertical | Descripción |
|----------|-------------|
| `SALUD` | Centros médicos, consultorios, odontología |
| `BELLEZA` | Peluquerías, spas, uñas, maquillaje |
| `DATEFIT` | Gimnasios, entrenadores, clases fitness |
| `SERVICIOS` | Servicios profesionales |
| `BIENESTAR` | Yoga, meditación, terapias alternativas |

## 💳 MercadoPago

### Configuración Webhook

1. En el dashboard de MercadoPago, configura la URL:
   ```
   https://tu-api.com/api/v1/payments/webhook/mercadopago
   ```

2. Configura las variables en `.env`:
   ```
   MP_ACCESS_TOKEN=tu-access-token
   MP_WEBHOOK_URL=https://tu-api.com/api/v1/payments/webhook/mercadopago
   MP_SANDBOX=true
   ```

### Flujo de Pago

1. Cliente crea una reserva
2. Sistema crea preferencia de MP
3. Cliente paga en MP
4. MP envía webhook
5. Sistema confirma reserva

## 📱 QR para Reservas

Cada reserva genera un código QR único que puede ser validado por el comercio:

```
POST /api/v1/bookings/validate-qr
{
  "code": "1709834567890-abc123"
}
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## 🚀 Deploy en Render

1. Crea un nuevo Web Service en Render
2. Conecta tu repositorio
3. Configura:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`
4. Agrega las variables de entorno
5. ¡Deploy!

## 📄 Licencia

MIT License - DATEFEM Team
