const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('./logger');

let transporter = null;

function getTransporter() {
  if (!transporter && config.smtp.host && config.smtp.user) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }
  return transporter;
}

/**
 * Send an email.
 * @param {object} options - { to, subject, html }
 */
async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    logger.warn('SMTP not configured, skipping email send');
    return;
  }

  await t.sendMail({
    from: config.smtp.from,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail };
