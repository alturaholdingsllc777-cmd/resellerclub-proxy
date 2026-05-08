# Deployment SOP - AtlasX Media VPS

## First Deploy

Use copy/paste commands. Do not edit files with nano or vim unless absolutely necessary.

```bash
ssh root@YOUR_VPS_IP
sudo apt update && sudo apt install -y git curl ca-certificates
mkdir -p /opt/atlasx-media
cd /opt/atlasx-media
git clone https://github.com/alturaholdingsllc777-cmd/resellerclub-proxy.git .
chmod +x scripts/*.sh
sudo ./scripts/bootstrap-vps.sh
```

## Create `.env` Safely

Replace placeholder values before pasting.

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

## Deploy

```bash
sudo ./scripts/deploy.sh
```

## Updates

```bash
cd /opt/atlasx-media
git pull origin main
sudo ./scripts/deploy.sh
```

## SSL After DNS Propagates

Install and run Certbot only after A records point to the VPS.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d atlasx.media -d www.atlasx.media
```

Repeat for each live domain when ready.
