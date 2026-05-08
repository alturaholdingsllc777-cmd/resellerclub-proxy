#!/usr/bin/env bash
set -euo pipefail

PASS=0
FAIL=0

pass() { echo "OK  $1"; PASS=$((PASS+1)); }
fail() { echo "XX  $1"; FAIL=$((FAIL+1)); }

echo "=== AtlasX Media Health Check === $(date)"
cd /opt/atlasx-media 2>/dev/null || cd "$(dirname "$0")/.."

if docker compose ps 2>/dev/null | grep -q "Up"; then
  pass "docker compose service running"
else
  fail "docker compose service not running"
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/health || echo 000)
if [ "$STATUS" = "200" ]; then
  pass "proxy health HTTP 200"
else
  fail "proxy health HTTP $STATUS"
fi

DISK=$(df / | awk 'NR==2{print $5}' | tr -d '%')
if [ "$DISK" -lt 85 ]; then
  pass "disk usage ${DISK}%"
else
  fail "disk usage ${DISK}% high"
fi

echo "=== Results: $PASS passed / $FAIL failed ==="
exit "$FAIL"
