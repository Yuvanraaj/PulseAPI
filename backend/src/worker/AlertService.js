const axios = require('axios');
const nodemailer = require('nodemailer');
const db = require('../config/database');
const config = require('../config/env');
const logger = require('../utils/logger');

class AlertService {
  constructor() {
    this._transporter = null;
  }

  getTransporter() {
    if (!this._transporter && config.smtp.host && config.smtp.user) {
      this._transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: { user: config.smtp.user, pass: config.smtp.password },
      });
    }
    return this._transporter;
  }

  async getChannelsForMonitor(monitorId) {
    const result = await db.query(
      `SELECT ac.*
       FROM alert_channels ac
       JOIN monitor_alert_channels mac ON ac.id = mac.alert_channel_id
       WHERE mac.monitor_id = $1 AND ac.is_active = true`,
      [monitorId]
    );
    return result.rows;
  }

  /**
   * Send alerts to all channels configured for the monitor.
   * @param {object} monitor
   * @param {'down'|'up'|'ssl_expiry'} eventType
   * @param {object} checkResult
   */
  async sendAlert(monitor, eventType, checkResult) {
    let channels;
    try {
      channels = await this.getChannelsForMonitor(monitor.id);
    } catch (err) {
      logger.error(`Failed to fetch alert channels for monitor ${monitor.id}: ${err.message}`);
      return;
    }

    for (const channel of channels) {
      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailAlert(channel, monitor, eventType, checkResult);
            break;
          case 'slack':
            await this.sendSlackAlert(channel, monitor, eventType, checkResult);
            break;
          case 'discord':
            await this.sendDiscordAlert(channel, monitor, eventType, checkResult);
            break;
          case 'webhook':
            await this.sendWebhookAlert(channel, monitor, eventType, checkResult);
            break;
          default:
            logger.warn(`Unknown alert channel type: ${channel.type}`);
        }
        logger.info(`Alert sent via ${channel.type} for monitor ${monitor.name} [${eventType}]`);
      } catch (err) {
        logger.error(`Failed to send ${channel.type} alert for monitor ${monitor.name}: ${err.message}`);
      }
    }
  }

  async sendEmailAlert(channel, monitor, eventType, checkResult) {
    const transporter = this.getTransporter();
    if (!transporter) {
      logger.warn('SMTP not configured; skipping email alert');
      return;
    }

    const isDown = eventType === 'down';
    const subject = isDown
      ? `🔴 ALERT: ${monitor.name} is DOWN`
      : `🟢 RESOLVED: ${monitor.name} is back UP`;

    const html = `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:${isDown ? '#EF4444' : '#10B981'}">${subject}</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:4px 8px;font-weight:bold">Monitor</td><td>${monitor.name}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:bold">URL</td><td>${monitor.url}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:bold">Status Code</td><td>${checkResult.status_code ?? 'N/A'}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:bold">Response Time</td><td>${checkResult.response_time_ms ?? 'N/A'} ms</td></tr>
          ${checkResult.error_message ? `<tr><td style="padding:4px 8px;font-weight:bold">Error</td><td style="color:#EF4444">${checkResult.error_message}</td></tr>` : ''}
          <tr><td style="padding:4px 8px;font-weight:bold">Time</td><td>${new Date().toUTCString()}</td></tr>
        </table>
      </div>
    `;

    await transporter.sendMail({
      from: config.smtp.from,
      to: channel.config.to,
      subject,
      html,
    });
  }

  async sendSlackAlert(channel, monitor, eventType, checkResult) {
    const isDown = eventType === 'down';
    const color = isDown ? '#EF4444' : '#10B981';
    const emoji = isDown ? '🔴' : '🟢';

    const payload = {
      text: `${emoji} Monitor alert for *${monitor.name}*`,
      attachments: [
        {
          color,
          fields: [
            { title: 'Monitor', value: monitor.name, short: true },
            { title: 'Status', value: eventType.toUpperCase(), short: true },
            { title: 'URL', value: monitor.url, short: false },
            { title: 'HTTP Status', value: String(checkResult.status_code ?? 'N/A'), short: true },
            { title: 'Response Time', value: `${checkResult.response_time_ms ?? 'N/A'} ms`, short: true },
          ],
          footer: 'API Monitoring',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    if (checkResult.error_message) {
      payload.attachments[0].fields.push({
        title: 'Error',
        value: checkResult.error_message,
        short: false,
      });
    }

    await axios.post(channel.config.webhook_url, payload, { timeout: 10000 });
  }

  async sendDiscordAlert(channel, monitor, eventType, checkResult) {
    const isDown = eventType === 'down';
    const color = isDown ? 0xef4444 : 0x10b981;
    const emoji = isDown ? '🔴' : '🟢';

    const payload = {
      content: `${emoji} Monitor **${monitor.name}** is **${eventType.toUpperCase()}**`,
      embeds: [
        {
          color,
          fields: [
            { name: 'URL', value: monitor.url, inline: false },
            { name: 'HTTP Status', value: String(checkResult.status_code ?? 'N/A'), inline: true },
            { name: 'Response Time', value: `${checkResult.response_time_ms ?? 'N/A'} ms`, inline: true },
            ...(checkResult.error_message
              ? [{ name: 'Error', value: checkResult.error_message, inline: false }]
              : []),
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await axios.post(channel.config.webhook_url, payload, { timeout: 10000 });
  }

  async sendWebhookAlert(channel, monitor, eventType, checkResult) {
    const payload = {
      event: eventType,
      monitor: { id: monitor.id, name: monitor.name, url: monitor.url },
      check: checkResult,
      timestamp: new Date().toISOString(),
    };

    await axios.post(channel.config.url, payload, {
      headers: { 'Content-Type': 'application/json', ...(channel.config.headers || {}) },
      timeout: 10000,
    });
  }
}

module.exports = AlertService;
