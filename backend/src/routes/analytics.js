const express = require('express');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const db = require('../config/database');

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const monitorsCount = await db.query('SELECT COUNT(*) FROM monitors WHERE is_active = true');
    const activeIncidents = await db.query("SELECT COUNT(*) FROM incidents WHERE status != 'resolved'");
    const overallUptime = await db.query(
      `SELECT ROUND(100.0 * SUM(CASE WHEN is_up THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS uptime
       FROM uptime_checks WHERE checked_at >= NOW() - INTERVAL '24 hours'`
    );
    const avgResponseTime = await db.query(
      `SELECT ROUND(AVG(response_time_ms)) AS avg_ms
       FROM uptime_checks WHERE checked_at >= NOW() - INTERVAL '24 hours' AND is_up = true`
    );

    res.json({
      total_monitors: parseInt(monitorsCount.rows[0].count),
      active_incidents: parseInt(activeIncidents.rows[0].count),
      uptime_24h: parseFloat(overallUptime.rows[0].uptime) || 0,
      avg_response_time_24h: parseInt(avgResponseTime.rows[0].avg_ms) || 0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
