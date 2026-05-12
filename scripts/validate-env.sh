#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

WITH_N8N=0
if [ "${1:-}" = "--with-n8n" ] || [ "${1:-}" = "--automation" ]; then
  WITH_N8N=1
fi

if [ ! -f .env ]; then
  echo "ERROR: Missing .env. Copy .env.example to .env on the VPS and fill production values."
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

FAIL=0
check_secret() {
  local name="$1"
  local value="${!name:-}"

  if [ -z "$value" ]; then
    echo "ERROR: $name is empty."
    FAIL=1
    return
  fi

  case "$value" in
    CHANGE_ME*|YOUR_*|generate-a-long-random-value)
      echo "ERROR: $name still uses placeholder value: $value"
      FAIL=1
      ;;
  esac
}

check_secret PROXY_SECRET
check_secret RC_RESELLER_ID
check_secret RC_API_KEY

if [ "$WITH_N8N" -eq 1 ]; then
  check_secret N8N_ENCRYPTION_KEY
  check_secret N8N_HOST
  check_secret N8N_WEBHOOK_URL
  check_secret PROXY_PUBLIC_BASE_URL
fi

if [ "$FAIL" -ne 0 ]; then
  echo "Environment validation failed. Fix .env before going live."
  exit 1
fi

echo "Environment validation passed."
