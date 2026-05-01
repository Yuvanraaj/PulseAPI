# API Documentation

Base URL: `http://localhost:4000/api`

## Authentication

All admin endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### POST /auth/register

Register a new admin user.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "mypassword",
  "name": "Admin User"
}
```

**Response:**
```json
{
  "token": "eyJ...",
  "user": { "id": "...", "email": "...", "name": "...", "role": "admin" }
}
```

### POST /auth/login

Login with existing credentials.

**Request:**
```json
{ "email": "admin@example.com", "password": "mypassword" }
```

**Response:** Same as register.

### GET /auth/me

Get current authenticated user. Requires auth header.

---

## Monitors

### GET /monitors

List all monitors (paginated).

**Query params:** `?status=down&page=1&limit=50`

### POST /monitors

Create a monitor.

**Request:**
```json
{
  "name": "Payment API",
  "url": "https://api.example.com/health",
  "method": "GET",
  "interval_seconds": 60,
  "timeout_seconds": 10,
  "expected_status_code": 200,
  "tags": ["production", "critical"],
  "validate_ssl": true
}
```

### GET /monitors/:id

Get a single monitor with uptime stats.

### PUT /monitors/:id

Update a monitor. Accepts same fields as POST (all optional).

To pause/resume a monitor: `{ "is_active": false }` / `{ "is_active": true }`

### DELETE /monitors/:id

Delete a monitor and all its check history.

### GET /monitors/:id/checks

Get check history.

**Query params:** `?from=2024-01-01&to=2024-01-15&limit=500`

### GET /monitors/:id/uptime-history

Get daily uptime aggregates.

**Query params:** `?days=30`

---

## Incidents

### GET /incidents

List incidents. **Query:** `?status=investigating&severity=critical&page=1&limit=50`

### POST /incidents

Create a manual incident.

**Request:**
```json
{
  "title": "Database Maintenance",
  "description": "Scheduled downtime for DB upgrade",
  "status": "monitoring",
  "severity": "minor",
  "monitor_id": "optional-uuid"
}
```

### PUT /incidents/:id

Update incident status/severity/title.

### POST /incidents/:id/updates

Post a timeline update.

**Request:**
```json
{
  "status": "identified",
  "message": "Root cause identified: disk full on db-01"
}
```

### DELETE /incidents/:id

Delete an incident.

---

## Alert Channels

### GET /alert-channels

List all channels.

### POST /alert-channels

Create a channel.

**Email:**
```json
{
  "name": "Dev Team",
  "type": "email",
  "config": { "to": "dev@example.com" }
}
```

**Slack:**
```json
{
  "name": "Slack #incidents",
  "type": "slack",
  "config": { "webhook_url": "https://hooks.slack.com/services/..." }
}
```

**Discord:**
```json
{
  "name": "Discord alerts",
  "type": "discord",
  "config": { "webhook_url": "https://discord.com/api/webhooks/..." }
}
```

**Generic webhook:**
```json
{
  "name": "PagerDuty",
  "type": "webhook",
  "config": {
    "url": "https://events.pagerduty.com/...",
    "headers": { "X-Token": "secret" }
  }
}
```

### DELETE /alert-channels/:id

Delete a channel.

### POST /alert-channels/:channelId/monitors/:monitorId

Link a channel to a monitor.

### DELETE /alert-channels/:channelId/monitors/:monitorId

Unlink.

---

## Public API (no auth required)

### GET /public/status

Current status of all monitors + active incidents + config.

### GET /public/uptime-history

Daily uptime history per monitor. **Query:** `?days=90`

### GET /public/incidents

Recent incidents for status page. **Query:** `?limit=10`

---

## Analytics

### GET /analytics/overview

Overview stats (requires auth): total monitors, active incidents, 24h uptime %, avg response time.
