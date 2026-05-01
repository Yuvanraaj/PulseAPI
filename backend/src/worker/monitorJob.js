const db = require('../../config/database');
const CheckExecutor = require('./CheckExecutor');
const AlertService = require('./AlertService');
const logger = require('../../utils/logger');
const config = require('../../config/env');

class MonitorJob {
  constructor() {
    this.executor = new CheckExecutor();
    this.alertService = new AlertService();
    // Cache of last known status per monitor: Map<monitorId, boolean>
    this.monitorStates = new Map();
    // Track consecutive failure counts for retry logic
    this.failureCounts = new Map();
    this.isRunning = false;
  }

  async runChecks() {
    if (this.isRunning) {
      logger.debug('Previous check cycle still running, skipping');
      return;
    }
    this.isRunning = true;

    try {
      // Fetch monitors that are due for a check
      const result = await db.query(`
        SELECT DISTINCT ON (m.id) m.*
        FROM monitors m
        LEFT JOIN uptime_checks uc ON m.id = uc.monitor_id
        WHERE m.is_active = true
        GROUP BY m.id
        HAVING
          MAX(uc.checked_at) IS NULL
          OR MAX(uc.checked_at) < NOW() - (m.interval_seconds || ' seconds')::INTERVAL
        ORDER BY m.id
      `);

      const monitors = result.rows;
      if (monitors.length === 0) {
        logger.debug('No monitors due for checking');
        return;
      }

      logger.info(`Checking ${monitors.length} monitor(s)...`);

      // Run with concurrency limit
      const concurrency = config.maxConcurrentChecks;
      for (let i = 0; i < monitors.length; i += concurrency) {
        const batch = monitors.slice(i, i + concurrency);
        await Promise.all(batch.map((monitor) => this.checkMonitor(monitor)));
      }
    } catch (err) {
      logger.error(`Error in monitor job: ${err.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  async checkMonitor(monitor) {
    try {
      const result = await this.executor.executeCheck(monitor);

      // Save result
      await db.query(
        `INSERT INTO uptime_checks
          (monitor_id, checked_at, status_code, response_time_ms, is_up, error_message, ssl_valid, ssl_expiry_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          result.monitor_id,
          result.checked_at,
          result.status_code,
          result.response_time_ms,
          result.is_up,
          result.error_message,
          result.ssl_valid,
          result.ssl_expiry_days,
        ]
      );

      // Update failure counter
      if (!result.is_up) {
        this.failureCounts.set(monitor.id, (this.failureCounts.get(monitor.id) || 0) + 1);
      } else {
        this.failureCounts.set(monitor.id, 0);
      }

      // Only mark as down after 3 consecutive failures (retry logic)
      const failures = this.failureCounts.get(monitor.id) || 0;
      const effectivelyDown = !result.is_up && failures >= 3;
      const effectivelyUp = result.is_up;

      const newStatus = effectivelyUp ? 'up' : effectivelyDown ? 'down' : monitor.current_status;

      await db.query('UPDATE monitors SET current_status = $1 WHERE id = $2', [newStatus, monitor.id]);

      // State change detection (use the resolved status, not current check result)
      await this.handleStateChange(monitor, result, effectivelyDown, effectivelyUp);

      // SSL expiry alert
      if (result.ssl_expiry_days !== null && result.ssl_expiry_days <= 30 && result.ssl_expiry_days > 0) {
        await this.alertService.sendAlert(monitor, 'ssl_expiry', result);
      }

      logger.debug(
        `${monitor.name}: ${result.is_up ? 'UP' : 'DOWN'} (${result.response_time_ms}ms, HTTP ${result.status_code ?? 'err'})`
      );
    } catch (err) {
      logger.error(`Error checking monitor "${monitor.name}": ${err.message}`);
    }
  }

  async handleStateChange(monitor, result, effectivelyDown, effectivelyUp) {
    const previousState = this.monitorStates.get(monitor.id);

    // Determine resolved current state
    const currentState = effectivelyDown ? false : effectivelyUp ? true : null;
    if (currentState === null) return; // Still in retry window

    this.monitorStates.set(monitor.id, currentState);

    // Skip if we don't have a previous state yet (first run)
    if (previousState === undefined) return;

    if (previousState === true && currentState === false) {
      // Went DOWN
      logger.warn(`Monitor DOWN: ${monitor.name}`);
      await this.createIncident(monitor, result);
      await this.alertService.sendAlert(monitor, 'down', result);
    } else if (previousState === false && currentState === true) {
      // Came back UP
      logger.info(`Monitor UP: ${monitor.name}`);
      await this.resolveIncident(monitor);
      await this.alertService.sendAlert(monitor, 'up', result);
    }
  }

  async createIncident(monitor, result) {
    // Avoid duplicate open incidents
    const existing = await db.query(
      `SELECT id FROM incidents WHERE monitor_id = $1 AND status != 'resolved' LIMIT 1`,
      [monitor.id]
    );
    if (existing.rows.length > 0) return;

    await db.query(
      `INSERT INTO incidents
        (monitor_id, title, description, status, severity, started_at, is_auto_detected)
       VALUES ($1, $2, $3, 'investigating', 'major', NOW(), true)`,
      [
        monitor.id,
        `${monitor.name} is Down`,
        `HTTP Status: ${result.status_code ?? 'N/A'}\nError: ${result.error_message ?? 'Timeout or connection error'}`,
      ]
    );
  }

  async resolveIncident(monitor) {
    await db.query(
      `UPDATE incidents
       SET status = 'resolved', resolved_at = NOW()
       WHERE monitor_id = $1 AND status != 'resolved'`,
      [monitor.id]
    );
  }
}

module.exports = MonitorJob;
