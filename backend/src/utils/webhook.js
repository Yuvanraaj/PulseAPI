const axios = require('axios');
const logger = require('./logger');

/**
 * POST JSON payload to a webhook URL.
 * @param {string} url - Webhook URL
 * @param {object} payload - JSON payload
 * @param {object} [headers] - Optional extra headers
 */
async function sendWebhook(url, payload, headers = {}) {
  await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    timeout: 10000,
  });
  logger.debug(`Webhook sent to ${url}`);
}

module.exports = { sendWebhook };
