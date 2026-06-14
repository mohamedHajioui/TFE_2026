# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Dossier pour les uploads d'images
RUN mkdir -p uploads

RUN apk add --no-cache tzdata

ENV NODE_ENV=production
ENV TZ=Europe/Brussels

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
