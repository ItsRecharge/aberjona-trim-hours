#!/usr/bin/env bash
#
# Deploy the latest code for the Aberjona Tri-M Hours app.
#
# Run as the service user (musicserver) from anywhere:
#   ./deploy/deploy.sh
#
# Steps: pull → install deps → apply DB migrations → regenerate Prisma client →
# build → restart the systemd service. `next start` only ever serves the prebuilt
# .next directory, so the build step is what actually ships your changes.

set -euo pipefail

SERVICE="aberjona-trim-hours"
# Resolve the project root from this script's location (deploy/ -> repo root).
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

log "Pulling latest from origin/main"
git pull --ff-only

log "Installing dependencies (npm ci)"
# ci is reproducible and prunes removed deps; falls back to install if no lockfile.
if [ -f package-lock.json ]; then npm ci; else npm install; fi

log "Applying database migrations"
npx prisma migrate deploy

log "Regenerating Prisma client"
npx prisma generate

log "Building the app"
npm run build

log "Restarting the service ($SERVICE)"
# sudo so an unprivileged service user can restart the unit; harmless if already root.
if command -v sudo >/dev/null 2>&1; then
  sudo systemctl restart "$SERVICE"
else
  systemctl restart "$SERVICE"
fi

log "Done. Recent status:"
systemctl --no-pager --lines=0 status "$SERVICE" || true
