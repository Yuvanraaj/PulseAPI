# Deployment Guide

## Prerequisites

- Docker & Docker Compose v2
- A server with at least 1 GB RAM

## Quick Deploy (Docker)

### 1. Clone the repository

```bash
git clone <your-repo>
cd api-monitoring-platform
```

### 2. Configure environment

```bash
cp docker/.env.example docker/.env
nano docker/.env   # or use your editor
```

Set at minimum:
- `DB_PASSWORD` — strong random password
- `JWT_SECRET` — long random secret (32+ chars)

Optional: SMTP settings for email alerts.

### 3. Build and start

```bash
cd docker
docker compose up -d --build
```

First startup will:
1. Start PostgreSQL and run all migrations automatically
2. Start the backend API
3. Start the monitor worker
4. Build and serve the React frontends via nginx

### 4. Create your admin account

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourcompany.com","password":"yourpassword","name":"Admin"}'
```

### 5. Access the apps

| Service | URL |
|---|---|
| Status Page (public) | http://localhost:3000 |
| Admin Dashboard | http://localhost:3001 |
| API | http://localhost:4000 |

## Production Configuration

### Reverse proxy with nginx/Caddy

For production, put a reverse proxy in front. Example Caddyfile:

```
status.yourcompany.com {
    reverse_proxy localhost:3000
}

admin.yourcompany.com {
    reverse_proxy localhost:3001
}

api.yourcompany.com {
    reverse_proxy localhost:4000
}
```

### SSL/TLS

Caddy handles SSL automatically. For nginx, use Certbot or Cloudflare proxy.

### Backups

Back up the `postgres_data` Docker volume regularly:

```bash
docker exec <postgres-container> pg_dump -U monitoring api_monitoring > backup.sql
```

## Updating

```bash
cd docker
docker compose down
git pull
docker compose up -d --build
```

## Checking logs

```bash
docker compose logs -f backend
docker compose logs -f worker
```

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `JWT_SECRET` | Yes | JWT signing secret |
| `SMTP_HOST` | No | SMTP server for email alerts |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASSWORD` | No | SMTP password |
| `SMTP_FROM` | No | Sender email address |
| `FRONTEND_URL` | No | Admin dashboard URL (for CORS) |
| `STATUS_URL` | No | Status page URL (for CORS) |
| `MAX_CONCURRENT_CHECKS` | No | Worker concurrency (default: 10) |
