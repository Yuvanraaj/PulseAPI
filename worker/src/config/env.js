require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  maxConcurrentChecks: parseInt(process.env.MAX_CONCURRENT_CHECKS || '10', 10),
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || 'monitoring@yourcompany.com',
  },
};
