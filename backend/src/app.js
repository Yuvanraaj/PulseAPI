require('./config/env'); // Validate env vars first
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const monitorsRoutes = require('./routes/monitors');
const incidentsRoutes = require('./routes/incidents');
const alertsRoutes = require('./routes/alerts');
const publicRoutes = require('./routes/public');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Trust nginx reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    const allowed = config.cors.origins;
    // Exact match OR any vercel.app preview URL
    if (
      allowed.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Health check (no auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/monitors', monitorsRoutes);
app.use('/api/incidents', incidentsRoutes);
app.use('/api/alert-channels', alertsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT} [${config.nodeEnv}]`);
});

module.exports = app;
