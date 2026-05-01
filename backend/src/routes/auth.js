const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const express = require('express');
const db = require('../config/database');
const config = require('../config/env');
const { validate } = require('../middleware/validation');

const router = express.Router();

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().trim().isLength({ max: 100 }),
];

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// POST /api/auth/register
router.post('/register', registerValidation, validate, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role`,
      [email, passwordHash, name || null]
    );
    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', loginValidation, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
