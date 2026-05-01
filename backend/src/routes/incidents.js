const express = require('express');
const { body } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

const incidentValidation = [
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('status').optional().isIn(['investigating', 'identified', 'monitoring', 'resolved']),
  body('severity').optional().isIn(['minor', 'major', 'critical']),
  body('description').optional().isString(),
  body('monitor_id').optional().isUUID(),
];

// GET /api/incidents
router.get('/', async (req, res, next) => {
  try {
    const { status, severity, monitor_id, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params = [];

    if (status) { params.push(status); conditions.push(`i.status = $${params.length}`); }
    if (severity) { params.push(severity); conditions.push(`i.severity = $${params.length}`); }
    if (monitor_id) { params.push(monitor_id); conditions.push(`i.monitor_id = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT i.*, m.name AS monitor_name,
        CASE WHEN i.resolved_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (i.resolved_at - i.started_at)) / 60
          ELSE NULL
        END AS duration_minutes
       FROM incidents i
       LEFT JOIN monitors m ON i.monitor_id = m.id
       ${where}
       ORDER BY i.started_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM incidents i ${where}`,
      params
    );

    res.json({ incidents: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents
router.post('/', incidentValidation, validate, async (req, res, next) => {
  try {
    const { monitor_id, title, description, status = 'investigating', severity = 'minor' } = req.body;

    const result = await db.query(
      `INSERT INTO incidents (monitor_id, title, description, status, severity, is_auto_detected, created_by)
       VALUES ($1, $2, $3, $4, $5, false, $6)
       RETURNING *`,
      [monitor_id || null, title, description || null, status, severity, req.user.id]
    );

    res.status(201).json({ incident: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT i.*, m.name AS monitor_name FROM incidents i
       LEFT JOIN monitors m ON i.monitor_id = m.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Incident not found' });

    const updates = await db.query(
      `SELECT iu.*, u.name AS author_name FROM incident_updates iu
       LEFT JOIN users u ON iu.created_by = u.id
       WHERE iu.incident_id = $1
       ORDER BY iu.created_at ASC`,
      [req.params.id]
    );

    res.json({ incident: result.rows[0], updates: updates.rows });
  } catch (err) {
    next(err);
  }
});

// PUT /api/incidents/:id
router.put('/:id', [
  body('status').optional().isIn(['investigating', 'identified', 'monitoring', 'resolved']),
  body('severity').optional().isIn(['minor', 'major', 'critical']),
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
], validate, async (req, res, next) => {
  try {
    const { title, description, status, severity } = req.body;

    const resolvedAt = status === 'resolved' ? 'NOW()' : 'resolved_at';

    const result = await db.query(
      `UPDATE incidents SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        severity = COALESCE($4, severity),
        resolved_at = CASE WHEN $3 = 'resolved' THEN NOW() ELSE resolved_at END
       WHERE id = $5
       RETURNING *`,
      [title || null, description || null, status || null, severity || null, req.params.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Incident not found' });
    res.json({ incident: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents/:id/updates
router.post('/:id/updates', [
  body('status').optional().isIn(['investigating', 'identified', 'monitoring', 'resolved']),
  body('message').trim().isLength({ min: 1 }),
], validate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const incident = await db.query('SELECT id FROM incidents WHERE id = $1', [id]);
    if (!incident.rows[0]) return res.status(404).json({ error: 'Incident not found' });

    // Insert the update
    const updateResult = await db.query(
      `INSERT INTO incident_updates (incident_id, status, message, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, status || null, message, req.user.id]
    );

    // Also update incident status if provided
    if (status) {
      await db.query(
        `UPDATE incidents SET
          status = $1,
          resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END
         WHERE id = $2`,
        [status, id]
      );
    }

    res.status(201).json({ update: updateResult.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/incidents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM incidents WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Incident not found' });
    res.json({ message: 'Incident deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
