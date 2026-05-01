const axios = require('axios');
const https = require('https');
const logger = require('../../utils/logger');

class CheckExecutor {
  /**
   * Execute an HTTP check for a monitor and return the result object.
   * @param {object} monitor
   */
  async executeCheck(monitor) {
    const startTime = Date.now();
    const result = {
      monitor_id: monitor.id,
      checked_at: new Date(),
      is_up: false,
      status_code: null,
      response_time_ms: null,
      error_message: null,
      ssl_valid: null,
      ssl_expiry_days: null,
    };

    try {
      const requestConfig = {
        method: monitor.method.toLowerCase(),
        url: monitor.url,
        timeout: monitor.timeout_seconds * 1000,
        headers: monitor.headers || {},
        // Accept any status code — we'll evaluate ourselves
        validateStatus: () => true,
        // Limit response size
        maxContentLength: 1024 * 1024, // 1 MB
      };

      if (monitor.body && ['post', 'put', 'patch'].includes(requestConfig.method)) {
        requestConfig.data = monitor.body;
      }

      const response = await axios(requestConfig);
      result.response_time_ms = Date.now() - startTime;
      result.status_code = response.status;
      result.is_up = response.status === monitor.expected_status_code;

      // Optional response body regex validation
      if (result.is_up && monitor.response_body_match) {
        try {
          const regex = new RegExp(monitor.response_body_match);
          const bodyStr =
            typeof response.data === 'string'
              ? response.data
              : JSON.stringify(response.data);
          if (!regex.test(bodyStr)) {
            result.is_up = false;
            result.error_message = 'Response body validation failed';
          }
        } catch {
          logger.warn(`Invalid regex for monitor ${monitor.name}: ${monitor.response_body_match}`);
        }
      }

      // SSL certificate check for HTTPS — records info and alerts but does NOT mark monitor as down
      if (monitor.url.startsWith('https://') && monitor.validate_ssl !== false) {
        const sslInfo = await this.checkSSL(monitor.url);
        result.ssl_valid = sslInfo.valid;
        result.ssl_expiry_days = sslInfo.daysUntilExpiry;
        // SSL issues are reported via ssl_valid/ssl_expiry_days fields only
        // They do not affect the is_up status so the monitor stays up
      }
    } catch (error) {
      result.is_up = false;
      result.response_time_ms = Date.now() - startTime;
      result.error_message = error.message;
    }

    return result;
  }

  /**
   * Check SSL certificate validity and days until expiry.
   * @param {string} url
   * @returns {{ valid: boolean, daysUntilExpiry: number|null }}
   */
  checkSSL(url) {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const options = {
        host: urlObj.hostname,
        port: 443,
        method: 'HEAD',
        rejectUnauthorized: true,
      };

      const req = https.request(options, (res) => {
        try {
          const cert = res.socket.getPeerCertificate();
          if (cert && cert.valid_to) {
            const expiryDate = new Date(cert.valid_to);
            const now = new Date();
            const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
            resolve({ valid: daysUntilExpiry > 0, daysUntilExpiry });
          } else {
            resolve({ valid: false, daysUntilExpiry: null });
          }
        } catch {
          resolve({ valid: false, daysUntilExpiry: null });
        }
      });

      req.on('error', () => resolve({ valid: false, daysUntilExpiry: null }));
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ valid: false, daysUntilExpiry: null });
      });
      req.end();
    });
  }
}

module.exports = CheckExecutor;
