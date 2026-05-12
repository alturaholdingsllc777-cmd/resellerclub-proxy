#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

WITH_N8N=0
if [ "${1:-}" = "--with-n8n" ] || [ "${1:-}" = "--automation" ]; then
  WITH_N8N=1
fi

if [ "$WITH_N8N" -eq 1 ]; then
  ./scripts/validate-env.sh --with-n8n
  COMPOSE=(docker compose --profile automation)
else
  ./scripts/validate-env.sh
  COMPOSE=(docker compose)
fi

"${COMPOSE[@]}" build
"${COMPOSE[@]}" up -d
sleep 3
"${COMPOSE[@]}" ps
curl -fsS http://localhost:3000/health || {
  echo "Health check failed. Logs:"
  "${COMPOSE[@]}" logs --tail=80
  exit 1
}

echo "Deploy complete. Service is running on port 3000."
if [ "$WITH_N8N" -eq 1 ]; then
  echo "n8n is running on localhost port 5678 for Nginx to publish securely."
fi
