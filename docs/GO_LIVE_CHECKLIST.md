# Go-Live Checklist

Use this checklist on the ResellerClub VPS when you are ready to publish the proxy and n8n automation.

## Safety First

1. Rotate any n8n API token, JWT, ResellerClub key, or password that was pasted into chat, GitHub, email, or a ticket.
2. Keep real values only in `.env` on the VPS.
3. Do not automate paid domain registrations until lead intake, billing, taxes, refunds, and customer support are confirmed.

## 1. DNS

Point these records to the VPS public IP:

```text
atlasx.media                 A  YOUR_VPS_IP
automation.atlasx.media      A  YOUR_VPS_IP
```

Add any business or customer domains only after the core site is stable.

## 2. First Server Setup

```bash
ssh root@YOUR_VPS_IP
sudo apt update && sudo apt install -y git curl ca-certificates
mkdir -p /opt/atlasx-media
cd /opt/atlasx-media
git clone https://github.com/alturaholdingsllc777-cmd/resellerclub-proxy.git .
chmod +x scripts/*.sh
sudo ./scripts/bootstrap-vps.sh
```

## 3. Production `.env`

Create `.env` on the VPS only:

```bash
cp .env.example .env
chmod 600 .env
```

Edit the values by pasting a complete heredoc or using your preferred secure editor. Required production values:

```text
PROXY_SECRET=strong-random-secret
RC_RESELLER_ID=real-reseller-id
RC_API_KEY=real-resellerclub-api-key
N8N_HOST=automation.atlasx.media
N8N_PROTOCOL=https
N8N_WEBHOOK_URL=https://automation.atlasx.media/
N8N_ENCRYPTION_KEY=long-random-secret
PROXY_PUBLIC_BASE_URL=http://resellerclub-proxy:3000
```

Generate random values on the VPS:

```bash
openssl rand -hex 32
```

## 4. Enable Nginx Sites

```bash
sudo ln -sf /opt/atlasx-media/nginx/sites-available/atlasx-media.conf /etc/nginx/sites-enabled/atlasx-media.conf
sudo ln -sf /opt/atlasx-media/nginx/sites-available/automation-atlasx-media.conf /etc/nginx/sites-enabled/automation-atlasx-media.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Go Live

Run the production go-live script. It validates `.env`, builds containers, starts the proxy and n8n automation profile, and checks local health.

```bash
cd /opt/atlasx-media
sudo ./scripts/go-live.sh
```

For proxy-only deployment without n8n:

```bash
sudo ./scripts/go-live.sh --proxy-only
```

## 6. HTTPS

Run Certbot only after DNS points to the VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d atlasx.media -d www.atlasx.media -d automation.atlasx.media
```

## 7. Production Smoke Tests

```bash
curl -fsS https://atlasx.media/rc-api/health
curl -fsS https://automation.atlasx.media/
curl -fsS 'http://localhost:3000/api/domain/check?domain=example&tlds=com,net' \
  -H "x-proxy-secret: $PROXY_SECRET"
```

## 8. Import n8n Workflow

1. Open `https://automation.atlasx.media`.
2. Create the first n8n owner account.
3. Import `workflows/n8n/resellerclub-domain-lead-check.json`.
4. Confirm the HTTP Request node sends `x-proxy-secret` from the environment.
5. Activate the workflow.
6. Test the production webhook URL shown inside n8n.

## Rollback

```bash
cd /opt/atlasx-media
git log --oneline -5
git checkout COMMIT_SHA
sudo ./scripts/go-live.sh
```
