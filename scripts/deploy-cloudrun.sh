#!/usr/bin/env bash
# =============================================================================
# Deploy ModelPricer Backend to Google Cloud Run
# =============================================================================
#
# Prerequisites:
#   - gcloud CLI installed and authenticated (gcloud auth login)
#   - Docker running locally
#   - GCP_PROJECT_ID env var set
#
# Usage:
#   export GCP_PROJECT_ID="my-gcp-project"
#   ./scripts/deploy-cloudrun.sh
#
# Optional env vars:
#   GCP_REGION       — Cloud Run region       (default: europe-west1)
#   SERVICE_NAME     — Cloud Run service name  (default: modelpricer-api)
#   MEMORY           — Memory allocation       (default: 2Gi)
#   CPU              — CPU allocation           (default: 4)
#   MAX_INSTANCES    — Max container instances  (default: 10)
#
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PROJECT_ID="${GCP_PROJECT_ID:?ERROR: Set GCP_PROJECT_ID environment variable}"
REGION="${GCP_REGION:-europe-west1}"
SERVICE_NAME="${SERVICE_NAME:-modelpricer-api}"
MEMORY="${MEMORY:-2Gi}"
CPU="${CPU:-4}"
MAX_INSTANCES="${MAX_INSTANCES:-10}"

# Artifact Registry is the recommended registry (GCR is legacy)
IMAGE_NAME="${REGION}-docker.pkg.dev/${PROJECT_ID}/modelpricer/${SERVICE_NAME}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

# Resolve paths relative to repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/Model_Pricer-V2-main/backend-local"

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
echo "=== ModelPricer Cloud Run Deploy ==="
echo "Project:   ${PROJECT_ID}"
echo "Region:    ${REGION}"
echo "Service:   ${SERVICE_NAME}"
echo "Image:     ${FULL_IMAGE}"
echo "Memory:    ${MEMORY}"
echo "CPU:       ${CPU}"
echo "Max inst:  ${MAX_INSTANCES}"
echo ""

if ! command -v gcloud &>/dev/null; then
  echo "ERROR: gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker not found. Install: https://docs.docker.com/get-docker/"
  exit 1
fi

if [ ! -f "${BACKEND_DIR}/Dockerfile" ]; then
  echo "ERROR: Dockerfile not found at ${BACKEND_DIR}/Dockerfile"
  exit 1
fi

# ---------------------------------------------------------------------------
# Step 1: Ensure Artifact Registry repository exists
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 1: Ensuring Artifact Registry repository exists ---"
gcloud artifacts repositories describe modelpricer \
  --project="${PROJECT_ID}" \
  --location="${REGION}" &>/dev/null || \
gcloud artifacts repositories create modelpricer \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --repository-format=docker \
  --description="ModelPricer container images"

# ---------------------------------------------------------------------------
# Step 2: Configure Docker to push to Artifact Registry
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 2: Configuring Docker authentication ---"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# ---------------------------------------------------------------------------
# Step 3: Build Docker image
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 3: Building Docker image ---"
docker build \
  -t "${FULL_IMAGE}" \
  -f "${BACKEND_DIR}/Dockerfile" \
  "${BACKEND_DIR}"

# ---------------------------------------------------------------------------
# Step 4: Push to Artifact Registry
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 4: Pushing image to Artifact Registry ---"
docker push "${FULL_IMAGE}"

# ---------------------------------------------------------------------------
# Step 5: Deploy to Cloud Run
# ---------------------------------------------------------------------------
echo ""
echo "--- Step 5: Deploying to Cloud Run ---"
gcloud run deploy "${SERVICE_NAME}" \
  --image "${FULL_IMAGE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --port 8080 \
  --memory "${MEMORY}" \
  --cpu "${CPU}" \
  --min-instances 0 \
  --max-instances "${MAX_INSTANCES}" \
  --timeout 300 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --labels "app=modelpricer,component=api"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
echo ""
echo "=== Deploy complete ==="
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --format 'value(status.url)')

echo "Service URL: ${SERVICE_URL}"
echo "Health check: ${SERVICE_URL}/api/health"
echo ""
echo "Next steps:"
echo "  1. Set env vars: gcloud run services update ${SERVICE_NAME} --region ${REGION} --set-env-vars 'FIREBASE_PROJECT_ID=...,SUPABASE_URL=...'"
echo "  2. Update firebase.json rewrites to point /api/** to this service"
echo "  3. Test: curl ${SERVICE_URL}/api/health"
