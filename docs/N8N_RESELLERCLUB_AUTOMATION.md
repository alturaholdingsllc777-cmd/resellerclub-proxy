# n8n ResellerClub Automation Guide

This guide connects the ResellerClub proxy to n8n so Altura Holdings LLC can start capturing domain leads and checking domain availability without exposing ResellerClub credentials to public forms.

## What This Adds

- A protected proxy endpoint: `GET /api/domain/check`.
- A Docker Compose `n8n` service behind the `automation` profile.
- An importable n8n workflow at `workflows/n8n/resellerclub-domain-lead-check.json`.
- Environment variable names only. Do not commit real n8n tokens, ResellerClub credentials, VPS passwords, or API keys.

## Important Token Safety

If an n8n API token, JWT, or credential was pasted into a chat, GitHub issue, or any public place, rotate it in n8n before using production automations. Treat pasted tokens as compromised.

## 1. Configure `.env` on the VPS

Copy `.env.example` to `.env` and fill in real values only on the VPS:

```bash
cp .env.example .env
chmod 600 .env
```

Required ResellerClub values:

```text
PROXY_SECRET=strong-random-secret-for-n8n-to-send
RC_RESELLER_ID=your-reseller-id
RC_API_KEY=your-resellerclub-api-key
RESELLERCLUB_BASE_URL=https://httpapi.com/api
RESELLERCLUB_DOMAINCHECK_BASE_URL=https://domaincheck.httpapi.com/api
```

Required n8n values:

```text
N8N_HOST=automation.atlasx.media
N8N_PROTOCOL=https
N8N_WEBHOOK_URL=https://automation.atlasx.media/
N8N_ENCRYPTION_KEY=generate-a-long-random-value
N8N_TIMEZONE=America/New_York
PROXY_PUBLIC_BASE_URL=http://resellerclub-proxy:3000
```

Generate safe secrets on the VPS:

```bash
openssl rand -hex 32
```

## 2. Start n8n

Run the production go-live script, which starts the normal proxy plus the n8n automation profile:

```bash
sudo ./scripts/go-live.sh
```

If you only want the raw Docker Compose command for troubleshooting:

```bash
docker compose --profile automation up -d --build
```

Check status:

```bash
docker compose ps
curl http://localhost:3000/health
```

## 3. Import the Workflow

1. Open your n8n URL, for example `https://automation.atlasx.media`.
2. Create the first owner user in the n8n UI.
3. Import `workflows/n8n/resellerclub-domain-lead-check.json`.
4. Open the `Check ResellerClub Domain Availability` node.
5. Confirm the `x-proxy-secret` header uses your n8n environment variable or replace it with a secure n8n credential.
6. Activate the workflow.

## 4. Test the Domain Lead Webhook

From the VPS, replace the webhook path with the production webhook URL shown by n8n:

```bash
curl -X POST 'https://automation.atlasx.media/webhook/resellerclub-domain-lead' \
  -H 'content-type: application/json' \
  -d '{"name":"Test Lead","email":"lead@example.com","domain":"example","tlds":"com,net"}'
```

The workflow sends the domain and TLDs to the proxy, and the proxy adds the ResellerClub API credentials server-side.

## 5. Direct Proxy Test for n8n

Use this command on the VPS to confirm the proxy can check domains before troubleshooting n8n:

```bash
curl 'http://localhost:3000/api/domain/check?domain=example&tlds=com,net' \
  -H "x-proxy-secret: $PROXY_SECRET"
```

## Sales Automation Path

Start with domain availability checks only. After the proxy, DNS, and lead flow are stable, add manual review steps before any paid registration, renewal, or hosting order workflow.

Recommended next automations:

1. Domain lead intake form.
2. Availability check.
3. Email or CRM notification.
4. Manual quote approval.
5. Payment collection.
6. Only then add registration/order API calls.

Do not automate purchases until billing, customer identity, tax, refund, and support processes are confirmed.
