# VPS Runbook - AtlasX Media

## Daily Health Check

```bash
cd /opt/atlasx-media
./scripts/health-check.sh
```

## View Logs

```bash
cd /opt/atlasx-media
docker compose logs --tail=100
```

## Restart Service

```bash
cd /opt/atlasx-media
docker compose restart
```

## Deploy Latest Version

```bash
cd /opt/atlasx-media
git pull origin main
sudo ./scripts/deploy.sh
```

## Backup

```bash
cd /opt/atlasx-media
sudo ./scripts/backup.sh
ls -lh /var/backups/atlasx-media
```

## Nginx Checks

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Common Problems

| Problem | Fix |
|---|---|
| Container down | `docker compose logs --tail=100` |
| Health check fails | Confirm `.env` exists and container is running |
| Port blocked | `sudo ufw allow 3000/tcp` for test, 80/443 for production |
| DNS not working | Confirm A records point to VPS IP |
| SSH input difficult | Use copy/paste commands only; avoid nano/vim |
| Secret wrong | Update `.env`, then run `docker compose restart` |

## Emergency Rollback

```bash
cd /opt/atlasx-media
git log --oneline -5
git checkout COMMIT_SHA
sudo ./scripts/deploy.sh
```
