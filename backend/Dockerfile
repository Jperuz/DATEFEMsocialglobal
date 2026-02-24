# ============================================
# DATEFEM Backend Dockerfile
# ============================================

FROM node:20-alpine

# Instala dependencias necesarias
RUN apk add --no-cache openssl

# Directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependencias
RUN npm ci

# Genera el cliente de Prisma
RUN npx prisma generate

# Copia el resto del código
COPY . .

# Compila la aplicación
RUN npm run build

# Expone el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "start:prod"]
