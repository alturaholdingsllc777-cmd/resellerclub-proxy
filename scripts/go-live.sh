#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

WITH_N8N=1
if [ "${1:-}" = "--proxy-only" ]; then
  WITH_N8N=0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed. Run: sudo ./scripts/bootstrap-vps.sh"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: Docker Compose plugin is not available. Run: sudo ./scripts/bootstrap-vps.sh"
  exit 1
fi

if [ "$WITH_N8N" -eq 1 ]; then
  ./scripts/validate-env.sh --with-n8n
  COMPOSE=(docker compose --profile automation)
else
  ./scripts/validate-env.sh
  COMPOSE=(docker compose)
fi

"${COMPOSE[@]}" config >/dev/null
"${COMPOSE[@]}" build
"${COMPOSE[@]}" up -d

printf 'Waiting for resellerclub-proxy health'
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/health >/dev/null 2>&1; then
    echo
    echo "Proxy is live: http://127.0.0.1:3000/health"
    break
  fi
  printf '.'
  sleep 2
done

curl -fsS http://127.0.0.1:3000/health >/dev/null

if [ "$WITH_N8N" -eq 1 ]; then
  printf 'Waiting for n8n web UI'
  N8N_STATUS=000
  for _ in $(seq 1 45); do
    N8N_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5678/ || echo 000)
    if [ "$N8N_STATUS" = "200" ] || [ "$N8N_STATUS" = "302" ]; then
      echo
      echo "n8n is live locally: http://127.0.0.1:5678/"
      break
    fi
    printf '.'
    sleep 2
  done

  if [ "$N8N_STATUS" != "200" ] && [ "$N8N_STATUS" != "302" ]; then
    echo
    echo "ERROR: n8n did not become ready. Last HTTP status: $N8N_STATUS"
    "${COMPOSE[@]}" logs --tail=80 n8n
    exit 1
  fi
fi

"${COMPOSE[@]}" ps

echo "Go-live complete."
echo "Next: point DNS at this VPS, enable the Nginx site files, then run Certbot for HTTPS."
