# =============================================================================
# ModelPricer Backend — Production Dockerfile for Google Cloud Run
# =============================================================================
# Multi-stage build: node:20-slim for small footprint (~180MB vs ~900MB full)
# Cloud Run sets $PORT (typically 8080), the app reads it at startup.
# Health check: GET /api/health -> { ok: true }
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1 — Install production dependencies only
# ---------------------------------------------------------------------------
FROM node:20-slim AS deps

WORKDIR /app

# Copy lockfile first for better layer caching
COPY package.json package-lock.json ./

# --production omits devDependencies, --ignore-scripts skips postinstall for security
RUN npm ci --production --ignore-scripts

# ---------------------------------------------------------------------------
# Stage 2 — Production runtime image
# ---------------------------------------------------------------------------
FROM node:20-slim

# Install dumb-init for proper signal handling (PID 1 problem in containers)
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
    && rm -rf /var/lib/apt/lists/*

# TODO: PrusaSlicer installation
# PrusaSlicer is required for slicing functionality. For now, the backend
# gracefully degrades when PrusaSlicer is not found (health endpoint reports
# slicer_available: false). To add PrusaSlicer later:
#
#   1. Download AppImage from https://github.com/prusa3d/PrusaSlicer/releases
#   2. Install runtime deps: libgtk-3-0, libgl1, libglu1-mesa, etc.
#   3. Extract and place binary at /usr/local/bin/prusa-slicer
#   4. Set ENV PRUSA_SLICER_PATH=/usr/local/bin/prusa-slicer
#
# Consider a dedicated slicer sidecar container for better resource isolation.

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY package.json ./
COPY src/ ./src/

# Copy PrusaSlicer profile configs (INI files used by the slicer)
COPY profiles/ ./profiles/

# Create writable directories for runtime data
RUN mkdir -p /app/storage /tmp/modelpricer

# Create non-root user for security (Cloud Run best practice)
RUN groupadd --gid 1001 appgroup \
    && useradd --uid 1001 --gid appgroup --shell /bin/false --create-home appuser \
    && chown -R appuser:appgroup /app /tmp/modelpricer

USER appuser

# Cloud Run injects PORT env var (default 8080)
ENV NODE_ENV=production
ENV PORT=8080
ENV SLICER_WORKSPACE_ROOT=/tmp/modelpricer

EXPOSE 8080

# Use dumb-init to handle signals properly (graceful shutdown)
CMD ["dumb-init", "node", "src/index.js"]
