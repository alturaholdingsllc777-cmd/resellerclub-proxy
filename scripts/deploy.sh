#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env. Run: cp .env.example .env and fill values on the VPS."
  exit 1
fi

docker compose build
docker compose up -d
sleep 3
docker compose ps
curl -fsS http://localhost:3000/health || {
  echo "Health check failed. Logs:"
  docker compose logs --tail=80
  exit 1
}

echo "Deploy complete. Service is running on port 3000."
