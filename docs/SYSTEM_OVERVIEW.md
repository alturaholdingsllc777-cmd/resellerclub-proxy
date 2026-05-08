# System Overview - AtlasX Media VPS

## Purpose

AtlasX Media is the internal digital infrastructure layer for Altura Holdings LLC. This repo proves that one ResellerClub VPS can host the parent company, AtlasX Media, and 9 business unit placeholders while also running the ResellerClub proxy service.

## Architecture

```text
Internet
  -> ResellerClub VPS Ubuntu
       -> Nginx 80/443
            -> altura-holdings.com -> apps/altura-holdings
            -> atlasx.media -> apps/atlasx-media
            -> business01-09.atlasx.media -> apps/business-01-09
       -> Docker Compose
            -> resellerclub-proxy on port 3000
```

## Core Components

- `apps/` contains static landing pages.
- `nginx/sites-available/` contains routing examples.
- `src/index.js` runs the secure Node proxy.
- `docker-compose.yml` runs the proxy container.
- `scripts/` contains VPS bootstrap, deploy, backup, and health checks.
- `docs/` contains operating documentation.

## Security Rules

- Production secrets stay in `.env` on the VPS.
- `.env` is ignored by Git.
- The proxy requires `x-proxy-secret`.
- ResellerClub API credentials must not be committed.
