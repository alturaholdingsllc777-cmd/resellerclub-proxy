# AtlasX Media ResellerClub Proxy

Secure Node.js proxy and VPS deployment starter for Altura Holdings LLC.

## Purpose

This repository lets AtlasX Media run a lightweight service on a ResellerClub VPS without manually coding inside the server.

## Quick Deploy

Read:

```text
docs/RESELLERCLUB_VPS_QUICKSTART.md
```

## Local Run

```bash
cp .env.example .env
npm install
npm start
```

Health check:

```bash
curl http://localhost:3000/health
```

## Docker Run

```bash
cp .env.example .env
docker compose build
docker compose up -d
```

## Security

- Never commit `.env`.
- Use a strong `PROXY_SECRET`.
- Keep ResellerClub credentials only on the VPS or in secure deployment secrets.
- Do not paste production secrets into GitHub issues or public files.

## Operating Model

Altura Holdings LLC is the command layer. AtlasX Media is the infrastructure layer. The ResellerClub VPS is the deployment target.
