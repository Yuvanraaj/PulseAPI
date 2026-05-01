# API Monitoring & Status Page

A self-hosted, open-source alternative to StatusPage.io and Pingdom. Monitor your HTTP/HTTPS endpoints, display a public status page, and receive alerts when services go down.

## Features

- **HTTP/HTTPS Monitoring** — Configurable intervals, methods, timeouts, and expected status codes
- **Public Status Page** — Real-time service status with 90-day uptime history
- **Admin Dashboard** — Full management UI with analytics
- **Alerting** — Email, Slack, Discord, and generic webhooks
- **Incident Management** — Auto-detection and manual incident tracking
- **SSL Monitoring** — Track certificate expiry
- **Docker Ready** — One-command deployment

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone & Configure

```bash
git clone <your-repo>
cd api-monitoring-platform
cp docker/.env.example docker/.env
# Edit docker/.env with your settings
```

### 2. Start Everything

```bash
cd docker
docker compose up -d
```

### 3. Access the Apps

| Service | URL |
|---|---|
| Admin Dashboard | http://localhost:3001 |
| Status Page | http://localhost:3000 |
| API | http://localhost:4000 |

### 4. Create First Admin User

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"changeme","name":"Admin"}'
```

## Development Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure .env
npm run dev
```

### Worker

```bash
cd worker
npm install
cp .env.example .env
npm run dev
```

### Admin Dashboard

```bash
cd frontend/admin
npm install
npm run dev
# Runs on http://localhost:5173
```

### Status Page

```bash
cd frontend/status
npm install
npm run dev
# Runs on http://localhost:5174
```

## Environment Variables

See `docker/.env.example` for all available configuration options.

| Variable | Description | Default |
|---|---|---|
| `DB_PASSWORD` | PostgreSQL password | — |
| `JWT_SECRET` | Secret key for JWT tokens | — |
| `SMTP_HOST` | SMTP server host | — |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASSWORD` | SMTP password | — |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    nginx (reverse proxy)             │
└─────────────────────────────────────────────────────┘
         │                   │                │
    Status Page         Admin Dashboard    API Server
   (React, :3000)      (React, :3001)   (Express, :4000)
                                              │
                         ┌────────────────────┤
                         │                    │
                      PostgreSQL            Redis
                      (:5432)              (:6379)
                         │
                      Monitor Worker
                   (Background checks)
```

## API Documentation

See [docs/API.md](docs/API.md) for full API reference.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment guide.

## License

MIT
