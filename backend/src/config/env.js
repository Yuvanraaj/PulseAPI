require('dotenv').config();

const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || 'monitoring@yourcompany.com',
  },
  cors: {
    origins: (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .concat([
        process.env.FRONTEND_URL || 'http://localhost:3001',
        process.env.STATUS_URL   || 'http://localhost:3000',
      ]),
  },
};
