const express = require('express');
const { body } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate);

const channelValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('type').isIn(['email', 'slack', 'discord', 'webhook']),
  body('config').isObject(),
];

// GET /api/alert-channels
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, type, is_active, created_at FROM alert_channels ORDER BY created_at DESC'
    );
    res.json({ channels: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/alert-channels
router.post('/', channelValidation, validate, async (req, res, next) => {
  try {
    const { name, type, config } = req.body;

    const result = await db.query(
      `INSERT INTO alert_channels (name, type, config) VALUES ($1, $2, $3) RETURNING id, name, type, is_active, created_at`,
      [name, type, JSON.stringify(config)]
    );

    res.status(201).json({ channel: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET /api/alert-channels/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM alert_channels WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Alert channel not found' });
    res.json({ channel: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/alert-channels/:id
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('type').optional().isIn(['email', 'slack', 'discord', 'webhook']),
  body('config').optional().isObject(),
  body('is_active').optional().isBoolean(),
], validate, async (req, res, next) => {
  try {
    const { name, type, config, is_active } = req.body;

    const result = await db.query(
      `UPDATE alert_channels SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        config = COALESCE($3, config),
        is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING id, name, type, is_active, created_at`,
      [name || null, type || null, config ? JSON.stringify(config) : null, is_active !== undefined ? is_active : null, req.params.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Alert channel not found' });
    res.json({ channel: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alert-channels/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM alert_channels WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Alert channel not found' });
    res.json({ message: 'Alert channel deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/alert-channels/:channelId/monitors/:monitorId  (link)
router.post('/:channelId/monitors/:monitorId', async (req, res, next) => {
  try {
    await db.query(
      `INSERT INTO monitor_alert_channels (monitor_id, alert_channel_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.params.monitorId, req.params.channelId]
    );
    res.json({ message: 'Monitor linked to alert channel' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/alert-channels/:channelId/monitors/:monitorId  (unlink)
router.delete('/:channelId/monitors/:monitorId', async (req, res, next) => {
  try {
    await db.query(
      `DELETE FROM monitor_alert_channels WHERE monitor_id = $1 AND alert_channel_id = $2`,
      [req.params.monitorId, req.params.channelId]
    );
    res.json({ message: 'Monitor unlinked from alert channel' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
