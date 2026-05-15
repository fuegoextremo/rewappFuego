#!/usr/bin/env bash
# ============================================================
# deploy.sh — Deploy multi-cuenta Supabase + Vercel
# ============================================================
# Uso:
#   ./deploy.sh                        # despliega los 6 proyectos
#   ./deploy.sh 1a                     # despliega solo proyecto 1a
#   ./deploy.sh 2b                     # despliega solo proyecto 2b
#
# Requisitos:
#   - supabase CLI instalado (brew install supabase/tap/supabase)
#   - vercel CLI instalado  (npm i -g vercel)
#   - .env.deploy con los tokens y configuración
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.deploy"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: no se encontró .env.deploy en $SCRIPT_DIR"
  exit 1
fi

# Cargar variables
set -a
source "$ENV_FILE"
set +a

# ============================================================
# Función principal de deploy para un proyecto
# ============================================================
deploy_project() {
  local CUENTA="$1"      # 1, 2, 3
  local SLOT="$2"        # A, B

  local SUPABASE_TOKEN_VAR="SUPABASE_TOKEN_${CUENTA}"
  local SUPABASE_ORG_VAR="SUPABASE_ORG_${CUENTA}"
  local SUPABASE_REGION_VAR="SUPABASE_REGION_${CUENTA}"
  local SB_PROJECT_NAME_VAR="SUPABASE_PROJECT_NAME_${CUENTA}${SLOT}"
  local SB_DB_PASSWORD_VAR="SUPABASE_DB_PASSWORD_${CUENTA}${SLOT}"
  local VERCEL_TOKEN_VAR="VERCEL_TOKEN_${CUENTA}"
  local VERCEL_SCOPE_VAR="VERCEL_SCOPE_${CUENTA}"
  local VERCEL_PROJECT_VAR="VERCEL_PROJECT_NAME_${CUENTA}${SLOT}"

  local SB_TOKEN="${!SUPABASE_TOKEN_VAR}"
  local SB_ORG="${!SUPABASE_ORG_VAR}"
  local SB_REGION="${!SUPABASE_REGION_VAR}"
  local SB_NAME="${!SB_PROJECT_NAME_VAR}"
  local SB_PASS="${!SB_DB_PASSWORD_VAR}"
  local VCL_TOKEN="${!VERCEL_TOKEN_VAR}"
  local VCL_SCOPE="${!VERCEL_SCOPE_VAR}"
  local VCL_NAME="${!VERCEL_PROJECT_VAR}"

  echo ""
  echo "============================================================"
  echo "Desplegando cuenta $CUENTA — proyecto $SLOT: $SB_NAME"
  echo "============================================================"

  # ----------------------------------------------------------
  # 1. Crear proyecto en Supabase
  # ----------------------------------------------------------
  echo "[1/5] Creando proyecto Supabase: $SB_NAME..."
  SB_OUTPUT=$(SUPABASE_ACCESS_TOKEN="$SB_TOKEN" \
    supabase projects create "$SB_NAME" \
      --org-id "$SB_ORG" \
      --db-password "$SB_PASS" \
      --region "$SB_REGION" \
      --output json 2>&1) || true

  # Extraer project ref del output (asume jq disponible)
  SB_REF=$(echo "$SB_OUTPUT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

  if [[ -z "$SB_REF" ]]; then
    echo "  Proyecto posiblemente ya existe o error en creación. Buscando ref existente..."
    SB_REF=$(SUPABASE_ACCESS_TOKEN="$SB_TOKEN" \
      supabase projects list --output json 2>/dev/null \
      | grep -o '"id":"[^"]*","name":"'"$SB_NAME"'"' \
      | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")
  fi

  if [[ -z "$SB_REF" ]]; then
    echo "  ERROR: No se pudo obtener el project ref para $SB_NAME. Saltando..."
    return 1
  fi

  echo "  Project ref: $SB_REF"
  local DB_URL="postgresql://postgres:${SB_PASS}@db.${SB_REF}.supabase.co:5432/postgres"

  # ----------------------------------------------------------
  # 2. Esperar a que el proyecto esté listo (máx 3 min)
  # ----------------------------------------------------------
  echo "[2/5] Esperando que el proyecto esté activo..."
  local ATTEMPTS=0
  local MAX=18
  while [[ $ATTEMPTS -lt $MAX ]]; do
    STATUS=$(SUPABASE_ACCESS_TOKEN="$SB_TOKEN" \
      supabase projects list --output json 2>/dev/null \
      | grep -o '"id":"'"$SB_REF"'"[^}]*"status":"[^"]*"' \
      | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    if [[ "$STATUS" == "ACTIVE_HEALTHY" ]]; then
      echo "  Proyecto activo."
      break
    fi
    echo "  Estado: $STATUS — reintentando en 10s... ($((ATTEMPTS+1))/$MAX)"
    sleep 10
    ATTEMPTS=$((ATTEMPTS+1))
  done

  # ----------------------------------------------------------
  # 3. Aplicar migraciones
  # ----------------------------------------------------------
  echo "[3/5] Aplicando migraciones..."
  SUPABASE_ACCESS_TOKEN="$SB_TOKEN" \
    supabase db push --db-url "$DB_URL"
  echo "  Migraciones aplicadas."

  # ----------------------------------------------------------
  # 4. Desplegar en Vercel
  # ----------------------------------------------------------
  echo "[4/5] Desplegando en Vercel: $VCL_NAME..."

  # Construir URL pública de Supabase para las env vars
  local SB_URL="https://${SB_REF}.supabase.co"
  local SB_ANON_KEY=$(SUPABASE_ACCESS_TOKEN="$SB_TOKEN" \
    supabase projects api-keys --project-ref "$SB_REF" --output json 2>/dev/null \
    | grep -o '"anon","key":"[^"]*"' | cut -d'"' -f4 || echo "")

  # Limpiar directorio .vercel para no reutilizar project.json de otro deploy
  rm -rf "$SCRIPT_DIR/.vercel"

  vercel --prod \
    --token "$VCL_TOKEN" \
    --scope "$VCL_SCOPE" \
    --name "$VCL_NAME" \
    --yes \
    -e NEXT_PUBLIC_SUPABASE_URL="$SB_URL" \
    -e NEXT_PUBLIC_SUPABASE_ANON_KEY="$SB_ANON_KEY"

  echo "  Vercel deploy completado."

  # ----------------------------------------------------------
  # 5. Resumen
  # ----------------------------------------------------------
  echo "[5/5] Listo."
  echo "  Supabase URL:   $SB_URL"
  echo "  Vercel project: $VCL_NAME (scope: $VCL_SCOPE)"
  echo ""
}

# ============================================================
# Selección de proyectos a desplegar
# ============================================================
TARGET="${1:-all}"

case "$TARGET" in
  all)
    deploy_project 1 A
    deploy_project 1 B
    deploy_project 2 A
    deploy_project 2 B
    deploy_project 3 A
    deploy_project 3 B
    ;;
  1a) deploy_project 1 A ;;
  1b) deploy_project 1 B ;;
  2a) deploy_project 2 A ;;
  2b) deploy_project 2 B ;;
  3a) deploy_project 3 A ;;
  3b) deploy_project 3 B ;;
  *)
    echo "Uso: ./deploy.sh [all|1a|1b|2a|2b|3a|3b]"
    exit 1
    ;;
esac

echo "Deploy completado."
