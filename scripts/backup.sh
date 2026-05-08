#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/atlasx-media"
BACKUP_DIR="/var/backups/atlasx-media"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_FILE" \
  --exclude="${APP_DIR}/.git" \
  --exclude="${APP_DIR}/node_modules" \
  "$APP_DIR"

echo "Backup created: $BACKUP_FILE"
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
ls -lh "$BACKUP_DIR"
