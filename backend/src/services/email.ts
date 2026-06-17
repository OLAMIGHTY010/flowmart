import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Log file in the backend root directory for local testing
const logFilePath = path.join(__dirname, '../../../emails.log');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const sendEmail = async (to: string, subject: string, body: string, html?: string) => {
  const logMessage = `
========================================
[EMAIL SENT]
Timestamp: ${new Date().toISOString()}
To: ${to}
Subject: ${subject}
Body:
${body}
========================================
`;

  // 1. Always append/log to emails.log file for local testing
  try {
    const dir = path.dirname(logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(logFilePath, logMessage, 'utf8');
    console.log(`[Email Service] Email to ${to} logged to emails.log`);
  } catch (err) {
    console.error('Failed to write email log:', err);
  }

  // 2. If SMTP credentials are set, attempt to send via Nodemailer
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"FlowMart Support" <support@flowmart.com>',
        to,
        subject,
        text: body,
        html: html || body.replace(/\n/g, '<br>'),
      });
      console.log(`[Email Service] Nodemailer sent email to ${to} successfully`);
    } catch (error) {
      console.error('[Email Service] Nodemailer failed to send email:', error);
    }
  } else {
    console.log('[Email Service] SMTP credentials not fully configured; skipped sending real email.');
  }
};
