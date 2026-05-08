#!/usr/bin/env bash
set -euo pipefail

URL="${1:-http://localhost:3000/health}"
echo "Checking $URL"
curl -fsS "$URL"
echo
