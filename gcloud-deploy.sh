#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Spot Gourmand — Déploiement Google Cloud Run
# Lance ce script à chaque mise à jour de l'app
# Usage: ./gcloud-deploy.sh
# ═══════════════════════════════════════════════════════════════

set -e

# ── Charger les variables d'env ──
if [ ! -f .env ]; then
  echo "Fichier .env introuvable ! Copie .env.example → .env et remplis les valeurs."
  exit 1
fi
source .env

# ── Configuration ──
PROJECT_ID="${GCLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCLOUD_REGION:-europe-west1}"
REPO_NAME="spotgourmand"
BACKEND_SERVICE="spotgourmand-api"
FRONTEND_SERVICE="spotgourmand-web"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"

# Tag basé sur le timestamp
TAG=$(date +%Y%m%d-%H%M%S)

echo "═══════════════════════════════════════"
echo "  Spot Gourmand — Déploiement GCloud"
echo "  Projet: $PROJECT_ID"
echo "  Tag:    $TAG"
echo "═══════════════════════════════════════"

# 1. Build et push du Backend
echo ""
echo "1/4 — Build du backend..."
docker build -t $REGISTRY/backend:$TAG -t $REGISTRY/backend:latest ./backend
docker push $REGISTRY/backend:$TAG
docker push $REGISTRY/backend:latest
echo "Backend poussé"

# 2. Déployer le Backend sur Cloud Run
echo ""
echo "2/4 — Déploiement du backend..."

# Construire la liste des env vars
CLOUD_SQL_FLAG=""
if [ -n "$DB_CONNECTION_NAME" ]; then
  CLOUD_SQL_FLAG="--add-cloudsql-instances=${DB_CONNECTION_NAME}"
fi

gcloud run deploy $BACKEND_SERVICE \
  --image=$REGISTRY/backend:$TAG \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  $CLOUD_SQL_FLAG \
  --set-env-vars="^@@^DB_HOST=${DB_HOST}@@DB_PORT=${DB_PORT:-5432}@@DB_USERNAME=${DB_USERNAME}@@DB_PASSWORD=${DB_PASSWORD}@@DB_DATABASE=${DB_DATABASE}@@DB_SSL=${DB_SSL:-true}@@JWT_SECRET=${JWT_SECRET}@@JWT_EXPIRATION=${JWT_EXPIRATION:-15m}@@JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}@@JWT_REFRESH_EXPIRATION=${JWT_REFRESH_EXPIRATION:-7d}@@STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}@@STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}@@GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}@@GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}@@GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL:-}@@DB_SYNC=${DB_SYNC:-true}@@NODE_ENV=production" \
  --quiet

BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
echo "Backend déployé: $BACKEND_URL"

# 3. Build et push du Frontend
echo ""
echo "3/4 — Build du frontend..."
# VITE_API_URL=/api : en production le proxy nginx route /api/ vers le backend (même domaine)
# MSYS_NO_PATHCONV=1 empêche Git Bash (Windows) de convertir /api en C:/Program Files/Git/api
MSYS_NO_PATHCONV=1 docker build \
  --build-arg VITE_API_URL="/api" \
  -t $REGISTRY/frontend:$TAG \
  -t $REGISTRY/frontend:latest \
  ./frontend
docker push $REGISTRY/frontend:$TAG
docker push $REGISTRY/frontend:latest
echo "Frontend poussé"

# 4. Déployer le Frontend sur Cloud Run (avec BACKEND_URL pour le proxy nginx)
echo ""
echo "4/4 — Déploiement du frontend..."
gcloud run deploy $FRONTEND_SERVICE \
  --image=$REGISTRY/frontend:$TAG \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=80 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  --set-env-vars="BACKEND_URL=${BACKEND_URL}" \
  --quiet

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")

# Mettre à jour FRONTEND_URL + GOOGLE_CALLBACK_URL dans le backend
# Le callback Google passe par le proxy nginx du frontend (même domaine = cookies same-origin)
echo ""
echo "   → Mise à jour CORS + OAuth du backend..."
gcloud run services update $BACKEND_SERVICE \
  --region=$REGION \
  --update-env-vars="FRONTEND_URL=${FRONTEND_URL},GOOGLE_CALLBACK_URL=${FRONTEND_URL}/api/auth/google/callback" \
  --quiet

echo ""
echo "═══════════════════════════════════════"
echo "  DÉPLOIEMENT TERMINÉ !"
echo "═══════════════════════════════════════"
echo ""
echo "  Backend:   $BACKEND_URL"
echo "  Frontend:  $FRONTEND_URL"
echo "  Tag:       $TAG"
echo ""
