# ResellerClub VPS Quickstart

This guide avoids manual coding inside the VPS. Use copy/paste commands only.

## 1. Connect to the VPS

Use the SSH details from ResellerClub.

```bash
ssh root@YOUR_VPS_IP
```

## 2. Install base tools and clone repo

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates
mkdir -p /opt/atlasx-media
cd /opt/atlasx-media
git clone https://github.com/alturaholdingsllc777-cmd/resellerclub-proxy.git .
chmod +x scripts/*.sh
```

## 3. Bootstrap the VPS

```bash
sudo ./scripts/bootstrap-vps.sh
```

## 4. Create production .env without nano/vim

Replace the placeholder values before pasting.

```bash
cat > .env <<'EOF'
PORT=3000
NODE_ENV=production
PROXY_SECRET=CHANGE_ME_STRONG_RANDOM_SECRET
CORS_ORIGIN=false
RATE_LIMIT_PER_MINUTE=60
UPSTREAM_TIMEOUT_MS=20000
RESELLERCLUB_BASE_URL=https://httpapi.com/api
RC_RESELLER_ID=YOUR_RESELLER_ID
RC_API_KEY=YOUR_API_KEY
EOF
chmod 600 .env
```

## 5. Deploy

```bash
sudo ./scripts/deploy.sh
```

## 6. Test

```bash
curl http://localhost:3000/health
curl http://YOUR_VPS_IP:3000/health
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `.env` not found | Run `cp .env.example .env` or use the heredoc command above |
| Placeholder values | Replace all `CHANGE_ME` and `YOUR_*` values |
| Health check fails | Run `docker compose logs --tail=100` |
| Port 3000 refused | Run `sudo ufw allow 3000/tcp` and confirm container is running |
| 401 Unauthorized | Send the correct `x-proxy-secret` header |
| ResellerClub 400/403 | Check `RC_RESELLER_ID` and `RC_API_KEY` |
| Keyboard too sensitive | Do not use nano/vim. Use copy/paste heredoc commands from this guide |

## Security Notes

- `.env` is ignored by Git.
- Never commit ResellerClub credentials.
- Keep SSH open before enabling firewall changes.
- Use a strong `PROXY_SECRET`.
