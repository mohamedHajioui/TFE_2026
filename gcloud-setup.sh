#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Spot Gourmand — Setup initial Google Cloud (UNE SEULE FOIS)
# ═══════════════════════════════════════════════════════════════
# Prérequis : Google Cloud SDK installé + connecté (gcloud auth login)
# Installation SDK : https://cloud.google.com/sdk/docs/install
# ═══════════════════════════════════════════════════════════════

set -e

# ── Configuration ──
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="europe-west1"
REPO_NAME="spotgourmand"
BACKEND_SERVICE="spotgourmand-api"
FRONTEND_SERVICE="spotgourmand-web"
DB_INSTANCE="spotgourmand-db"
DB_NAME="spotgourmand"
DB_USER="sgadmin"
DB_PASS="SpotG0urmand2026!"  # ⚠️ Change ce mot de passe !

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
  echo "   Aucun projet Google Cloud sélectionné !"
  echo "   Lance : gcloud config set project TON_PROJECT_ID"
  echo "   Tu peux voir tes projets avec : gcloud projects list"
  exit 1
fi

echo "═══════════════════════════════════════"
echo "  Spot Gourmand — Setup Google Cloud"
echo "  Projet: $PROJECT_ID"
echo "  Région: $REGION"
echo "═══════════════════════════════════════"

# 1. Activer les APIs nécessaires
echo ""
echo "1/6 — Activation des APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  --quiet
echo "   APIs activées"

# 2. Créer le dépôt Artifact Registry (stockage des images Docker)
echo ""
echo "2/6 — Création du dépôt Artifact Registry..."
if gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
  echo "   Dépôt '$REPO_NAME' existe déjà"
else
  gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Images Docker Spot Gourmand" \
    --quiet
  echo "   Dépôt '$REPO_NAME' créé"
fi

# 3. Configurer Docker pour utiliser Artifact Registry
echo ""
echo "3/6 — Configuration Docker..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
echo "   Docker configuré pour Artifact Registry"

# 4. Créer l'instance Cloud SQL PostgreSQL
echo ""
echo "4/6 — Création de la base de données PostgreSQL..."
if gcloud sql instances describe $DB_INSTANCE &>/dev/null 2>&1; then
  echo "   Instance '$DB_INSTANCE' existe déjà"
else
  gcloud sql instances create $DB_INSTANCE \
    --database-version=POSTGRES_16 \
    --edition=ENTERPRISE \
    --tier=db-custom-1-3840 \
    --region=$REGION \
    --storage-size=10GB \
    --storage-type=HDD \
    --assign-ip \
    --authorized-networks=0.0.0.0/0 \
    --quiet

  # Créer l'utilisateur
  gcloud sql users create $DB_USER \
    --instance=$DB_INSTANCE \
    --password="$DB_PASS" \
    --quiet

  # Créer la base de données
  gcloud sql databases create $DB_NAME \
    --instance=$DB_INSTANCE \
    --quiet

  echo "  PostgreSQL créé (tier db-f1-micro, le moins cher)"
fi

# Récupérer la connection name pour Cloud Run
DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format="value(connectionName)")
echo "   connection: $DB_CONNECTION_NAME"

# 5. Créer les services Cloud Run
echo ""
echo "5/6 — Création des services Cloud Run..."

# Backend
echo "   → Backend..."
gcloud run deploy $BACKEND_SERVICE \
  --image=gcr.io/cloudrun/hello \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  --add-cloudsql-instances=$DB_CONNECTION_NAME \
  --quiet
echo "  Backend créé"

# Frontend
echo "   → Frontend..."
gcloud run deploy $FRONTEND_SERVICE \
  --image=gcr.io/cloudrun/hello \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --port=80 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=1 \
  --quiet
echo "  Frontend créé"

# 6. Afficher les infos
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"

DB_IP=$(gcloud sql instances describe $DB_INSTANCE --format="value(ipAddresses[0].ipAddress)")

echo ""
echo "═══════════════════════════════════════"
echo "  SETUP TERMINÉ !"
echo "═══════════════════════════════════════"
echo ""
echo "  Registry:     $REGISTRY"
echo "  Backend:      $BACKEND_URL"
echo "  Frontend:     $FRONTEND_URL"
echo "  PostgreSQL:   $DB_IP"
echo "  DB Connection: $DB_CONNECTION_NAME"
echo ""
echo "  PROCHAINE ÉTAPE :"
echo ""
echo "  1. Copie .env.example → .env et remplis :"
echo "     DB_HOST=$DB_IP"
echo "     DB_USERNAME=$DB_USER"
echo "     DB_PASSWORD=$DB_PASS"
echo "     DB_DATABASE=$DB_NAME"
echo "     DB_SSL=true"
echo "     GCLOUD_PROJECT=$PROJECT_ID"
echo "     GCLOUD_REGION=$REGION"
echo "     DB_CONNECTION_NAME=$DB_CONNECTION_NAME"
echo ""
echo "  2. Lance : ./gcloud-deploy.sh"
echo ""
