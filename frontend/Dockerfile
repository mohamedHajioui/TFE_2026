# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# En production derrière le proxy nginx, l'API est à /api (même domaine)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Nginx pour servir les fichiers statiques + proxy API ──
FROM nginx:alpine

# Copier le template nginx (envsubst remplacera BACKEND_URL au démarrage)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copier le build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# nginx:alpine utilise automatiquement envsubst sur /etc/nginx/templates/*.template
# La variable BACKEND_URL sera injectée à l'exécution via Cloud Run
CMD ["nginx", "-g", "daemon off;"]
