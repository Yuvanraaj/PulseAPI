const express = require('express');
const { body, query, param } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All monitor routes require authentication
router.use(authenticate);

const monitorValidation = [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('url').isURL({ require_protocol: true }),
  body('method').optional().isIn(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH']),
  body('interval_seconds').optional().isInt({ min: 60, max: 86400 }),
  body('timeout_seconds').optional().isInt({ min: 1, max: 60 }),
  body('expected_status_code').optional().isInt({ min: 100, max: 599 }),
  body('headers').optional().isObject(),
  body('body').optional().isString(),
  body('validate_ssl').optional().isBoolean(),
  body('response_body_match').optional({ nullable: true }).isString(),
  body('description').optional({ nullable: true }).isString(),
  body('tags').optional().isArray(),
];

const monitorUpdateValidation = [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('url').optional().isURL({ require_protocol: true }),
  body('method').optional().isIn(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH']),
  body('interval_seconds').optional().isInt({ min: 60, max: 86400 }),
  body('timeout_seconds').optional().isInt({ min: 1, max: 60 }),
  body('expected_status_code').optional().isInt({ min: 100, max: 599 }),
  body('headers').optional().isObject(),
  body('body').optional({ nullable: true }).isString(),
  body('validate_ssl').optional().isBoolean(),
  body('response_body_match').optional({ nullable: true }).isString(),
  body('description').optional({ nullable: true }).isString(),
  body('tags').optional().isArray(),
];

// GET /api/monitors
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryText = `
      SELECT 
        m.*,
        COALESCE(
          ROUND(
            100.0 * SUM(CASE WHEN uc.is_up THEN 1 ELSE 0 END) / NULLIF(COUNT(uc.id), 0),
            2
          ),
          0
        ) AS uptime_percentage,
        COALESCE(ROUND(AVG(uc.response_time_ms)), 0) AS avg_response_time,
        MAX(uc.checked_at) AS last_check
      FROM monitors m
      LEFT JOIN uptime_checks uc ON m.id = uc.monitor_id
        AND uc.checked_at >= NOW() - INTERVAL '24 hours'
    `;

    const params = [];
    if (status) {
      params.push(status);
      queryText += ` WHERE m.current_status = $${params.length}`;
    }

    queryText += ` GROUP BY m.id ORDER BY m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(queryText, params);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM monitors${status ? ' WHERE current_status = $1' : ''}`,
      status ? [status] : []
    );

    res.json({ monitors: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    next(err);
  }
});

// POST /api/monitors
router.post('/', monitorValidation, validate, async (req, res, next) => {
  try {
    const {
      name, url, method = 'GET', interval_seconds = 60, timeout_seconds = 10,
      expected_status_code = 200, headers, body: reqBody, validate_ssl = true,
      response_body_match, description, tags = [],
    } = req.body;

    const result = await db.query(
      `INSERT INTO monitors
        (name, url, method, interval_seconds, timeout_seconds, expected_status_code,
         headers, body, validate_ssl, response_body_match, description, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        name, url, method, interval_seconds, timeout_seconds, expected_status_code,
        headers ? JSON.stringify(headers) : null,
        reqBody || null,
        validate_ssl,
        response_body_match || null,
        description || null,
        JSON.stringify(tags),
      ]
    );

    res.status(201).json({ monitor: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/monitors/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const monitorResult = await db.query('SELECT * FROM monitors WHERE id = $1', [id]);
    if (!monitorResult.rows[0]) return res.status(404).json({ error: 'Monitor not found' });

    const monitor = monitorResult.rows[0];

    // Uptime percentages over different windows
    const uptimeQuery = `
      SELECT 
        window_label,
        COALESCE(ROUND(100.0 * SUM(CASE WHEN is_up THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 2), 0) AS uptime_percentage,
        COALESCE(ROUND(AVG(response_time_ms)), 0) AS avg_response_time
      FROM (
        SELECT is_up, response_time_ms, '24h' AS window_label
        FROM uptime_checks
        WHERE monitor_id = $1 AND checked_at >= NOW() - INTERVAL '24 hours'
        UNION ALL
        SELECT is_up, response_time_ms, '7d'
        FROM uptime_checks
        WHERE monitor_id = $1 AND checked_at >= NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT is_up, response_time_ms, '30d'
        FROM uptime_checks
        WHERE monitor_id = $1 AND checked_at >= NOW() - INTERVAL '30 days'
      ) sub
      GROUP BY window_label
    `;

    const uptimeResult = await db.query(uptimeQuery, [id]);
    const stats = {};
    for (const row of uptimeResult.rows) {
      stats[row.window_label] = {
        uptime_percentage: parseFloat(row.uptime_percentage),
        avg_response_time: parseInt(row.avg_response_time),
      };
    }

    const lastCheckResult = await db.query(
      'SELECT checked_at FROM uptime_checks WHERE monitor_id = $1 ORDER BY checked_at DESC LIMIT 1',
      [id]
    );

    res.json({
      monitor: {
        ...monitor,
        uptime_percentage_24h: stats['24h']?.uptime_percentage || 0,
        uptime_percentage_7d: stats['7d']?.uptime_percentage || 0,
        uptime_percentage_30d: stats['30d']?.uptime_percentage || 0,
        avg_response_time_24h: stats['24h']?.avg_response_time || 0,
        last_check: lastCheckResult.rows[0]?.checked_at || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/monitors/:id
router.put('/:id', monitorUpdateValidation, validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, url, method, interval_seconds, timeout_seconds, expected_status_code,
      headers, body: reqBody, validate_ssl, response_body_match, description, tags,
      is_active,
    } = req.body;

    const result = await db.query(
      `UPDATE monitors SET
        name = COALESCE($1, name),
        url = COALESCE($2, url),
        method = COALESCE($3, method),
        interval_seconds = COALESCE($4, interval_seconds),
        timeout_seconds = COALESCE($5, timeout_seconds),
        expected_status_code = COALESCE($6, expected_status_code),
        headers = COALESCE($7, headers),
        body = $8,
        validate_ssl = COALESCE($9, validate_ssl),
        response_body_match = $10,
        description = $11,
        tags = COALESCE($12, tags),
        is_active = COALESCE($13, is_active)
       WHERE id = $14
       RETURNING *`,
      [
        name || null, url || null, method || null, interval_seconds || null,
        timeout_seconds || null, expected_status_code || null,
        headers ? JSON.stringify(headers) : null,
        reqBody || null,
        validate_ssl !== undefined ? validate_ssl : null,
        response_body_match || null, description || null,
        tags ? JSON.stringify(tags) : null,
        is_active !== undefined ? is_active : null,
        id,
      ]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Monitor not found' });
    res.json({ monitor: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/monitors/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM monitors WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Monitor not found' });
    res.json({ message: 'Monitor deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/monitors/:id/checks
router.get('/:id/checks', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to, limit = 500 } = req.query;

    let queryText = `SELECT id, checked_at, status_code, response_time_ms, is_up, error_message
                     FROM uptime_checks WHERE monitor_id = $1`;
    const params = [id];

    if (from) {
      params.push(from);
      queryText += ` AND checked_at >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      queryText += ` AND checked_at <= $${params.length}`;
    }

    queryText += ` ORDER BY checked_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await db.query(queryText, params);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM uptime_checks WHERE monitor_id = $1',
      [id]
    );

    res.json({ checks: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    next(err);
  }
});

// GET /api/monitors/:id/uptime-history (daily buckets)
router.get('/:id/uptime-history', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 90 } = req.query;

    const result = await db.query(
      `SELECT
        DATE(checked_at) AS date,
        ROUND(100.0 * SUM(CASE WHEN is_up THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS uptime_percentage,
        ROUND(AVG(response_time_ms)) AS avg_response_time,
        COUNT(*) AS total_checks
       FROM uptime_checks
       WHERE monitor_id = $1 AND checked_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY DATE(checked_at)
       ORDER BY date ASC`,
      [id, parseInt(days)]
    );

    res.json({ history: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
