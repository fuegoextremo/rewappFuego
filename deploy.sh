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

  # Extraer project ref del output con jq
  SB_REF=$(echo "$SB_OUTPUT" | jq -r '.id // empty' 2>/dev/null || echo "")

  if [[ -z "$SB_REF" ]]; then
    echo "  Proyecto posiblemente ya existe o error en creación. Buscando ref existente..."
    SB_REF=$(SUPABASE_ACCESS_TOKEN="$SB_TOKEN" \
      supabase projects list --output json 2>/dev/null \
      | jq -r --arg name "$SB_NAME" '.[] | select(.name == $name) | .id // empty' 2>/dev/null || echo "")
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
  local STATUS
  while [[ $ATTEMPTS -lt $MAX ]]; do
    STATUS=$(SUPABASE_ACCESS_TOKEN="$SB_TOKEN" \
      supabase projects list --output json 2>/dev/null \
      | jq -r --arg ref "$SB_REF" '.[] | select(.id == $ref) | .status // "unknown"' 2>/dev/null || echo "unknown")
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
    supabase db push --db-url "$DB_URL" --yes
  echo "  Migraciones aplicadas."

  # ----------------------------------------------------------
  # 4. Desplegar en Vercel
  # ----------------------------------------------------------
  echo "[4/5] Desplegando en Vercel: $VCL_NAME..."

  # Construir URL pública de Supabase para las env vars
  local SB_URL="https://${SB_REF}.supabase.co"
  local SB_ANON_KEY
  SB_ANON_KEY=$(SUPABASE_ACCESS_TOKEN="$SB_TOKEN" \
    supabase projects api-keys --project-ref "$SB_REF" --output json 2>/dev/null \
    | jq -r '.[] | select(.name == "anon") | .api_key // .key // empty' 2>/dev/null || echo "")

  if [[ -z "$SB_ANON_KEY" ]]; then
    echo "  WARN: No se pudo obtener el anon key. Verifica manualmente en el dashboard."
  fi

  # Obtener service role key de Supabase
  local SB_SERVICE_KEY
  SB_SERVICE_KEY=$(curl -s "https://api.supabase.com/v1/projects/${SB_REF}/api-keys" \
    -H "Authorization: Bearer $SB_TOKEN" \
    | jq -r '.[] | select(.name == "service_role" and .type == "legacy") | .api_key // empty' 2>/dev/null || echo "")

  if [[ -z "$SB_SERVICE_KEY" ]]; then
    echo "  WARN: No se pudo obtener el service_role key."
  fi

  # Crear el proyecto en Vercel via API REST (sin conexión a GitHub)
  echo "  Creando proyecto en Vercel via API..."
  local VCL_USER_ID
  VCL_USER_ID=$(curl -s "https://api.vercel.com/v2/user" \
    -H "Authorization: Bearer $VCL_TOKEN" | jq -r '.user.id')

  local VCL_API_RESPONSE
  VCL_API_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v9/projects" \
    -H "Authorization: Bearer $VCL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$VCL_NAME\",\"framework\":\"nextjs\"}")

  local VCL_PROJECT_ID
  VCL_PROJECT_ID=$(echo "$VCL_API_RESPONSE" | jq -r '.id // empty')

  # Si ya existe, obtener el ID del proyecto existente
  if [[ -z "$VCL_PROJECT_ID" ]]; then
    VCL_PROJECT_ID=$(curl -s "https://api.vercel.com/v9/projects/$VCL_NAME" \
      -H "Authorization: Bearer $VCL_TOKEN" | jq -r '.id // empty')
  fi

  if [[ -z "$VCL_PROJECT_ID" ]]; then
    echo "  ERROR: No se pudo crear o encontrar el proyecto Vercel '$VCL_NAME'."
    return 1
  fi

  echo "  Vercel project ID: $VCL_PROJECT_ID"

  # Inyectar .vercel/project.json para que el CLI no intente ligar GitHub
  rm -rf "$SCRIPT_DIR/.vercel"
  mkdir -p "$SCRIPT_DIR/.vercel"
  printf '{"orgId":"%s","projectId":"%s"}' "$VCL_USER_ID" "$VCL_PROJECT_ID" \
    > "$SCRIPT_DIR/.vercel/project.json"

  # Desactivar git integration en el proyecto (evita bloqueo por email de commit)
  curl -s -X PATCH "https://api.vercel.com/v9/projects/$VCL_PROJECT_ID" \
    -H "Authorization: Bearer $VCL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"link":null}' > /dev/null

  # Compilar con vercel build --prod (genera .vercel/output para producción)
  # Ocultamos .git durante build Y deploy para que Vercel no vincule a GitHub
  echo "  Compilando con vercel build --prod..."
  if [[ -d "$SCRIPT_DIR/.git" ]]; then
    mv "$SCRIPT_DIR/.git" "$SCRIPT_DIR/.git_deploy_backup"
  fi

  NEXT_PUBLIC_SUPABASE_URL="$SB_URL" \
  NEXT_PUBLIC_SUPABASE_ANON_KEY="$SB_ANON_KEY" \
    vercel build --prod --token "$VCL_TOKEN" --yes

  # Establecer variables de entorno en el proyecto Vercel
  echo "  Configurando variables de entorno..."
  # Upsert: primero borrar existentes para evitar duplicados, luego crear
  local EXISTING_ENVS
  EXISTING_ENVS=$(curl -s "https://api.vercel.com/v10/projects/$VCL_PROJECT_ID/env" \
    -H "Authorization: Bearer $VCL_TOKEN" | jq -r '.envs[]? | .id' 2>/dev/null || echo "")
  for ENV_ID in $EXISTING_ENVS; do
    curl -s -X DELETE "https://api.vercel.com/v10/projects/$VCL_PROJECT_ID/env/$ENV_ID" \
      -H "Authorization: Bearer $VCL_TOKEN" > /dev/null
  done

  local ALL_TARGETS='["production","preview","development"]'
  curl -s -X POST "https://api.vercel.com/v10/projects/$VCL_PROJECT_ID/env" \
    -H "Authorization: Bearer $VCL_TOKEN" -H "Content-Type: application/json" \
    -d "{\"key\":\"NEXT_PUBLIC_SUPABASE_URL\",\"value\":\"$SB_URL\",\"type\":\"plain\",\"target\":$ALL_TARGETS}" > /dev/null
  curl -s -X POST "https://api.vercel.com/v10/projects/$VCL_PROJECT_ID/env" \
    -H "Authorization: Bearer $VCL_TOKEN" -H "Content-Type: application/json" \
    -d "{\"key\":\"NEXT_PUBLIC_SUPABASE_ANON_KEY\",\"value\":\"$SB_ANON_KEY\",\"type\":\"plain\",\"target\":$ALL_TARGETS}" > /dev/null
  curl -s -X POST "https://api.vercel.com/v10/projects/$VCL_PROJECT_ID/env" \
    -H "Authorization: Bearer $VCL_TOKEN" -H "Content-Type: application/json" \
    -d "{\"key\":\"SUPABASE_SERVICE_ROLE_KEY\",\"value\":\"$SB_SERVICE_KEY\",\"type\":\"encrypted\",\"target\":$ALL_TARGETS}" > /dev/null

  # Deploy del build precompilado a producción — sin GitHub, sin prompts
  echo "  Subiendo build a Vercel (producción)..."
  vercel deploy --prebuilt --prod \
    --token "$VCL_TOKEN" \
    --yes

  # Restaurar .git al terminar ambos pasos
  if [[ -d "$SCRIPT_DIR/.git_deploy_backup" ]]; then
    mv "$SCRIPT_DIR/.git_deploy_backup" "$SCRIPT_DIR/.git"
  fi

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
