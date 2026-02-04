const { Resend } = require('resend');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
// Note: For production, you'll need to verify your domain with Resend
// For testing, Resend allows sending to your own email from onboarding@resend.dev
const FROM_EMAIL = 'AI Credit News <onboarding@resend.dev>';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

/**
 * Send a generic email
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text
    });

    console.log(`Email sent to ${to}: ${result.id}`);
    return { success: true, id: result.id };
  } catch (err) {
    console.error('Error sending email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send admin notification when editorial is ready for review
 */
async function sendAdminNotification(editorial) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured, skipping notification');
    return { success: false, error: 'No admin email configured' };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a365d 0%, #2c7a7b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .title { font-size: 24px; margin-bottom: 10px; }
        .subtitle { opacity: 0.9; font-size: 14px; }
        .editorial-preview { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c7a7b; }
        .btn { display: inline-block; background: #2c7a7b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #718096; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">New Editorial Ready for Review</div>
          <div class="subtitle">AI Credit News Weekly Editorial</div>
        </div>
        <div class="content">
          <p>A new weekly editorial has been generated and is ready for your review.</p>

          <div class="editorial-preview">
            <strong>${editorial.title}</strong>
            <p style="margin-top: 10px; color: #4a5568;">
              ${editorial.content.substring(0, 300)}...
            </p>
          </div>

          <p>Please review the editorial and make any necessary edits before publishing.</p>

          <a href="${SITE_URL}/admin/editorial/${editorial.id}" class="btn">
            Review Editorial
          </a>

          <div class="footer">
            <p>AI Credit News - Your source for AI in credit and banking</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Editorial Ready for Review
==============================

Title: ${editorial.title}

Preview: ${editorial.content.substring(0, 300)}...

Review at: ${SITE_URL}/admin/editorial/${editorial.id}

---
AI Credit News
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[AI Credit News] New Editorial Ready: ${editorial.title}`,
    html,
    text
  });
}

/**
 * Generate newsletter HTML
 */
function generateNewsletterHtml(editorial, articles, subscriber) {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe/${subscriber.unsubscribe_token}`;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const articlesHtml = articles.map(article => `
    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
      <a href="${article.url}" style="color: #1a365d; text-decoration: none; font-size: 16px; font-weight: 600;">
        ${article.title}
      </a>
      <p style="margin: 8px 0 0 0; color: #4a5568; font-size: 14px;">
        ${article.summary || ''}
      </p>
      <span style="color: #718096; font-size: 12px;">${article.source}</span>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f7fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a365d 0%, #2c7a7b 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">AI Credit News</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Weekly Digest - ${today}</p>
        </div>

        <!-- Editorial Section -->
        ${editorial ? `
        <div style="background: white; padding: 30px; border-bottom: 1px solid #e2e8f0;">
          <h2 style="color: #1a365d; margin: 0 0 15px 0; font-size: 20px;">
            Weekly Editorial
          </h2>
          <h3 style="color: #2c7a7b; margin: 0 0 15px 0; font-size: 18px;">
            ${editorial.title}
          </h3>
          <div style="color: #4a5568; font-size: 15px; white-space: pre-line;">
            ${editorial.content}
          </div>
        </div>
        ` : ''}

        <!-- Top Articles -->
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a365d; margin: 0 0 20px 0; font-size: 20px;">
            Top Stories This Week
          </h2>
          ${articlesHtml}

          <a href="${SITE_URL}" style="display: inline-block; background: #2c7a7b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Read More on AI Credit News
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 30px; color: #718096; font-size: 12px;">
          <p style="margin: 0;">
            You're receiving this because you subscribed to AI Credit News.
          </p>
          <p style="margin: 10px 0 0 0;">
            <a href="${unsubscribeUrl}" style="color: #718096;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate newsletter plain text
 */
function generateNewsletterText(editorial, articles, subscriber) {
  const unsubscribeUrl = `${SITE_URL}/unsubscribe/${subscriber.unsubscribe_token}`;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const articlesText = articles.map(article =>
    `• ${article.title}\n  ${article.summary || ''}\n  ${article.url}\n`
  ).join('\n');

  return `
AI CREDIT NEWS - Weekly Digest
${today}
================================

${editorial ? `
WEEKLY EDITORIAL
----------------
${editorial.title}

${editorial.content}

` : ''}

TOP STORIES THIS WEEK
---------------------
${articlesText}

---
Read more at: ${SITE_URL}
Unsubscribe: ${unsubscribeUrl}
  `.trim();
}

/**
 * Send newsletter to a single subscriber
 */
async function sendNewsletterToSubscriber(subscriber, editorial, articles) {
  const html = generateNewsletterHtml(editorial, articles, subscriber);
  const text = generateNewsletterText(editorial, articles, subscriber);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return sendEmail({
    to: subscriber.email,
    subject: `AI Credit News Weekly - ${today}`,
    html,
    text
  });
}

module.exports = {
  sendEmail,
  sendAdminNotification,
  sendNewsletterToSubscriber,
  generateNewsletterHtml,
  generateNewsletterText
};
