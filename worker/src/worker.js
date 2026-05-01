require('dotenv').config();
const cron = require('node-cron');
const MonitorJob = require('./jobs/monitorJob');
const logger = require('./utils/logger');
const db = require('./config/database');

async function waitForDatabase(retries = 10, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await db.query('SELECT 1');
      logger.info('Database connection established');
      return;
    } catch (err) {
      logger.warn(`Database not ready (attempt ${i + 1}/${retries}): ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  logger.error('Could not connect to database after multiple retries');
  process.exit(1);
}

async function main() {
  logger.info('Starting API Monitoring Worker...');

  await waitForDatabase();

  const monitorJob = new MonitorJob();

  // Run checks every minute
  cron.schedule('* * * * *', async () => {
    await monitorJob.runChecks();
  });

  // Run initial check immediately on startup
  logger.info('Running initial check...');
  await monitorJob.runChecks();

  logger.info('Worker started. Scheduled checks every minute.');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Worker shutting down (SIGTERM)');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Worker shutting down (SIGINT)');
  process.exit(0);
});

main().catch((err) => {
  logger.error(`Fatal worker error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
