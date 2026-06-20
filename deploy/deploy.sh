#!/usr/bin/env bash
#
# Deploy the latest code for the Aberjona Tri-M Hours app.
#
# Run as the service user (musicserver) from anywhere:
#   ./deploy/deploy.sh
#
# The systemd unit rebuilds on every (re)start (ExecStartPre runs prisma migrate
# deploy, prisma generate, and npm run build), so a deploy is just: get the new
# code (and deps) onto disk, then restart. This script does exactly that.
#
# Code-only change? You can skip this script and just run:
#   git pull && sudo systemctl restart aberjona-trim-hours

set -euo pipefail

SERVICE="aberjona-trim-hours"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

log "Pulling latest from origin/main"
git pull --ff-only

log "Installing dependencies (npm ci)"
# Run here (outside the systemd sandbox) so the npm cache in \$HOME is writable.
if [ -f package-lock.json ]; then npm ci; else npm install; fi

log "Restarting the service ($SERVICE) — it will migrate, generate, and build"
if command -v sudo >/dev/null 2>&1; then
  sudo systemctl restart "$SERVICE"
else
  systemctl restart "$SERVICE"
fi

log "Done. Recent status:"
systemctl --no-pager --lines=0 status "$SERVICE" || true
