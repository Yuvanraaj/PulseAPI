const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/public/status
router.get('/status', async (req, res, next) => {
  try {
    const monitorsResult = await db.query(
      `SELECT 
        m.id, m.name, m.current_status, m.description, m.tags,
        COALESCE(
          ROUND(100.0 * SUM(CASE WHEN uc.is_up THEN 1 ELSE 0 END) / NULLIF(COUNT(uc.id), 0), 2),
          0
        ) AS uptime_percentage
       FROM monitors m
       LEFT JOIN uptime_checks uc ON m.id = uc.monitor_id
         AND uc.checked_at >= NOW() - INTERVAL '24 hours'
       WHERE m.is_active = true
       GROUP BY m.id
       ORDER BY m.name ASC`
    );

    const incidentsResult = await db.query(
      `SELECT i.id, i.title, i.status, i.severity, i.started_at, i.resolved_at, m.name AS monitor_name
       FROM incidents i
       LEFT JOIN monitors m ON i.monitor_id = m.id
       WHERE i.status != 'resolved'
       ORDER BY i.started_at DESC`
    );

    const configResult = await db.query(
      'SELECT company_name, logo_url, primary_color, theme, header_text, footer_text, show_uptime_graph, show_response_times, show_past_incidents, days_to_show FROM status_page_config LIMIT 1'
    );

    // Determine overall status
    const monitors = monitorsResult.rows;
    let overallStatus = 'operational';
    if (monitors.some((m) => m.current_status === 'down')) overallStatus = 'down';
    else if (monitors.some((m) => m.current_status === 'degraded')) overallStatus = 'degraded';
    else if (incidentsResult.rows.length > 0) overallStatus = 'degraded';

    res.json({
      overall_status: overallStatus,
      monitors: monitors.map((m) => ({
        id: m.id,
        name: m.name,
        status: m.current_status === 'up' ? 'operational' : m.current_status === 'down' ? 'down' : m.current_status,
        uptime_percentage: parseFloat(m.uptime_percentage),
        description: m.description,
        tags: m.tags,
      })),
      active_incidents: incidentsResult.rows,
      config: configResult.rows[0] || {},
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/uptime-history
router.get('/uptime-history', async (req, res, next) => {
  try {
    const { days = 90 } = req.query;
    const numDays = Math.min(parseInt(days), 365);

    const result = await db.query(
      `SELECT
        DATE(uc.checked_at) AS date,
        uc.monitor_id,
        m.name AS monitor_name,
        ROUND(100.0 * SUM(CASE WHEN uc.is_up THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS uptime_percentage,
        ROUND(AVG(uc.response_time_ms)) AS avg_response_time
       FROM uptime_checks uc
       JOIN monitors m ON uc.monitor_id = m.id
       WHERE m.is_active = true AND uc.checked_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY DATE(uc.checked_at), uc.monitor_id, m.name
       ORDER BY date ASC`,
      [numDays]
    );

    // Group by date
    const byDate = {};
    for (const row of result.rows) {
      if (!byDate[row.date]) byDate[row.date] = [];
      byDate[row.date].push({
        monitor_id: row.monitor_id,
        monitor_name: row.monitor_name,
        uptime_percentage: parseFloat(row.uptime_percentage),
        avg_response_time: parseInt(row.avg_response_time),
      });
    }

    const history = Object.entries(byDate).map(([date, monitors]) => ({ date, monitors }));

    res.json({ history });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/incidents (past incidents for status page)
router.get('/incidents', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const result = await db.query(
      `SELECT i.id, i.title, i.description, i.status, i.severity, i.started_at, i.resolved_at,
              m.name AS monitor_name
       FROM incidents i
       LEFT JOIN monitors m ON i.monitor_id = m.id
       ORDER BY i.started_at DESC
       LIMIT $1`,
      [Math.min(parseInt(limit), 100)]
    );

    const incidentIds = result.rows.map((r) => r.id);
    let updates = [];
    if (incidentIds.length > 0) {
      const updatesResult = await db.query(
        `SELECT * FROM incident_updates WHERE incident_id = ANY($1) ORDER BY created_at ASC`,
        [incidentIds]
      );
      updates = updatesResult.rows;
    }

    const incidents = result.rows.map((incident) => ({
      ...incident,
      updates: updates.filter((u) => u.incident_id === incident.id),
    }));

    res.json({ incidents });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
