const https = require('https');
const axios = require('axios');
const { getAppUrl, buildSubscriptionLinksForEmail } = require('./subscriptionService');

const COMPANY_EMAIL = process.env.COMPANY_EMAIL || 'bulusakwashikitimothy@gmail.com';
const COMPANY_PHONE = process.env.COMPANY_PHONE || '0814 347 7093';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL
  || process.env.EMAIL_FROM
  || COMPANY_EMAIL;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'HavenStay';

const brevoAgent = new https.Agent({ family: 4 });

const currency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2
});

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatDate = (value) => {
  if (!value) return '—';
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? new Date(`${value.slice(0, 10)}T12:00:00Z`)
    : new Date(value);

  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const isConfigured = () => Boolean(BREVO_API_KEY && BREVO_SENDER_EMAIL);

const getSubscriptionLinks = (links) => {
  const base = getAppUrl();
  return {
    subscribeUrl: links?.subscribeUrl || `${base}/subscribe`,
    unsubscribeUrl: links?.unsubscribeUrl || `${base}/unsubscribe`
  };
};

const buildSubscriptionFooterHtml = (links) => {
  const { subscribeUrl, unsubscribeUrl } = getSubscriptionLinks(links);
  return `
    <tr>
      <td style="padding: 0 32px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #E8DFD5; padding-top: 20px;">
          <tr>
            <td style="padding: 18px 0 10px;">
              <p style="margin: 0 0 4px; color: #1E1B18; font-size: 13px; font-weight: bold;">Stay connected with HavenStay</p>
              <p style="margin: 0; color: #8C6D53; font-size: 12px; line-height: 1.6;">
                Receive new residences, seasonal offers, and platform updates. You are in control of your inbox.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 0 0;">
              <a href="${escapeHtml(subscribeUrl)}" style="display: inline-block; background: #5A4535; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; font-size: 12px; font-weight: bold; text-decoration: none;">Subscribe to updates</a>
              <a href="${escapeHtml(unsubscribeUrl)}" style="display: inline-block; margin-left: 8px; background: #FFFFFF; color: #5A4535; border: 1px solid #E8DFD5; padding: 9px 20px; border-radius: 8px; font-size: 12px; font-weight: bold; text-decoration: none;">Unsubscribe</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 0 0;">
              <a href="${escapeHtml(`${getAppUrl()}/refund-policy`)}" style="color: #8C6D53; font-size: 12px; text-decoration: underline;">Read our refund policy</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
};

const buildSubscriptionFooterText = (links) => {
  const { subscribeUrl, unsubscribeUrl } = getSubscriptionLinks(links);
  return [
    'Stay connected with HavenStay',
    `Subscribe to platform updates: ${subscribeUrl}`,
    `Unsubscribe from platform updates: ${unsubscribeUrl}`,
    `Refund policy: ${getAppUrl()}/refund-policy`
  ].join('\n');
};

const buildEmailShell = ({ badge, badgeColor, eyebrow, introHtml, bodyHtml, links, footerNote }) => `
  <body style="margin: 0; padding: 0; background: #F5F0EB; font-family: Arial, Helvetica, sans-serif; color: #1E1B18;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F5F0EB; padding: 24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background: #FDFBF7; border: 1px solid #E8DFD5; border-radius: 16px; overflow: hidden;">
            <tr>
              <td style="background: #1E1B18; padding: 28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: #FFFFFF; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">HavenStay</td>
                    <td align="right">
                      <span style="display: inline-block; background: ${badgeColor}; color: #FFFFFF; padding: 7px 14px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">${escapeHtml(badge)}</span>
                    </td>
                  </tr>
                </table>
                <p style="margin: 8px 0 0; color: #E8DFD5; font-size: 13px;">${escapeHtml(eyebrow)}</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 28px 32px 8px;">
                ${introHtml}
                ${bodyHtml}
              </td>
            </tr>

            ${buildSubscriptionFooterHtml(links)}

            <tr>
              <td style="background: #F5F0EB; padding: 18px 32px; text-align: center; color: #8C6D53; font-size: 11px; line-height: 1.6;">
                © ${new Date().getFullYear()} HavenStay Luxury Residences. All rights reserved.<br />
                ${escapeHtml(footerNote)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>`;

const buildDetailRows = (rows) => rows.map(([label, value]) => `
  <tr>
    <td style="padding: 7px 0; color: #8C6D53; font-size: 13px;">${escapeHtml(label)}</td>
    <td style="padding: 7px 0; color: #1E1B18; font-size: 13px; font-weight: 600; text-align: right;">${escapeHtml(value)}</td>
  </tr>
`).join('');

const buildReceiptHtml = (receipt) => {
  const detailRows = buildDetailRows([
    ['Booking code', receipt.bookingReference || '—'],
    ['Apartment', receipt.apartmentTitle],
    ['Address', receipt.address],
    ['City', receipt.city],
    ['Check-in', formatDate(receipt.checkIn)],
    ['Check-out', formatDate(receipt.checkOut)],
    ['Nights', String(receipt.nights)]
  ]);

  const priceRows = [
    ['Base price', receipt.basePrice],
    ['Cleaning fee', receipt.cleaningFee],
    ['Service fee', receipt.serviceFee]
  ].map(([label, value]) => `
    <tr>
      <td style="padding: 6px 0; color: #8C6D53; font-size: 13px;">${escapeHtml(label)}</td>
      <td style="padding: 6px 0; color: #1E1B18; font-size: 13px; text-align: right;">${currency.format(Number(value || 0))}</td>
    </tr>
  `).join('');

  const introHtml = `
    <p style="margin: 0 0 4px; color: #8C6D53; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Receipt reference</p>
    <p style="margin: 0 0 20px; color: #1E1B18; font-size: 17px; font-weight: bold;">${escapeHtml(receipt.reference)}</p>

    <p style="margin: 0 0 6px; font-size: 14px;">Hi ${escapeHtml(receipt.guestName)},</p>
    <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.6; color: #5A4535;">
      Your payment was successful and your reservation is confirmed. Below is your transaction slip with your complete booking details.
    </p>`;

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #E8DFD5; border-bottom: 1px solid #E8DFD5; margin-bottom: 22px;">
      ${detailRows}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F5F0EB; border: 1px solid #E8DFD5; border-radius: 12px; padding: 6px 16px; margin-bottom: 22px;">
      ${priceRows}
      <tr>
        <td style="padding: 12px 0 6px; border-top: 1px solid #E8DFD5; color: #1E1B18; font-size: 15px; font-weight: bold;">Total paid</td>
        <td style="padding: 12px 0 6px; border-top: 1px solid #E8DFD5; color: #5A4535; font-size: 16px; font-weight: bold; text-align: right;">${currency.format(Number(receipt.totalAmount || 0))}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 22px;">
      <tr>
        <td style="padding: 5px 0; color: #8C6D53; font-size: 13px;">Payment method</td>
        <td style="padding: 5px 0; color: #1E1B18; font-size: 13px; font-weight: 600; text-align: right;">Paystack</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #8C6D53; font-size: 13px;">Transaction reference</td>
        <td style="padding: 5px 0; color: #1E1B18; font-size: 13px; font-weight: 600; text-align: right;">${escapeHtml(receipt.reference)}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #8C6D53; font-size: 13px;">Paid on</td>
        <td style="padding: 5px 0; color: #1E1B18; font-size: 13px; font-weight: 600; text-align: right;">${escapeHtml(formatDateTime(receipt.paidAt))}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #8C6D53; font-size: 13px;">Guest email</td>
        <td style="padding: 5px 0; color: #1E1B18; font-size: 13px; font-weight: 600; text-align: right;">${escapeHtml(receipt.guestEmail)}</td>
      </tr>
    </table>

    <p style="margin: 0 0 4px; color: #1E1B18; font-size: 14px; font-weight: bold;">Need help?</p>
    <p style="margin: 0 0 8px; color: #8C6D53; font-size: 13px; line-height: 1.6;">
      Contact HavenStay at ${escapeHtml(COMPANY_EMAIL)} or ${escapeHtml(COMPANY_PHONE)}.
      Please keep this receipt for your records.
    </p>`;

  return `<!DOCTYPE html>
<html lang="en">
  ${buildEmailShell({
    badge: 'PAID',
    badgeColor: '#2F7D5B',
    eyebrow: 'Payment receipt',
    introHtml,
    bodyHtml,
    links: receipt.subscriptionLinks,
    footerNote: 'This is an automated receipt for your completed booking.'
  })}
</html>`;
};

const buildReceiptText = (receipt) => `
HAVENSTAY — PAYMENT RECEIPT
Receipt reference: ${receipt.reference}

Hi ${receipt.guestName},

Your payment was successful and your reservation is confirmed.

BOOKING DETAILS
Booking code: ${receipt.bookingReference || '—'}
Apartment: ${receipt.apartmentTitle}
Address: ${receipt.address}
City: ${receipt.city}
Check-in: ${formatDate(receipt.checkIn)}
Check-out: ${formatDate(receipt.checkOut)}
Nights: ${receipt.nights}

PRICE BREAKDOWN
Base price: ${currency.format(Number(receipt.basePrice || 0))}
Cleaning fee: ${currency.format(Number(receipt.cleaningFee || 0))}
Service fee: ${currency.format(Number(receipt.serviceFee || 0))}
Total paid: ${currency.format(Number(receipt.totalAmount || 0))}

Payment method: Paystack
Transaction reference: ${receipt.reference}
Paid on: ${formatDateTime(receipt.paidAt)}
Guest email: ${receipt.guestEmail}

Need help? Contact HavenStay at ${COMPANY_EMAIL} or ${COMPANY_PHONE}.

${buildSubscriptionFooterText(receipt.subscriptionLinks)}
`.trim();

const buildReminderHtml = (booking) => {
  const payUrl = `${getAppUrl()}/guest-booking/${encodeURIComponent(booking.access_token)}`;
  const detailRows = buildDetailRows([
    ['Booking reference', String(booking.id).slice(0, 8).toUpperCase()],
    ['Apartment', booking.apartment_title],
    ['City', booking.city],
    ['Check-in', formatDate(booking.check_in)],
    ['Check-out', formatDate(booking.check_out)],
    ['Nights', String(booking.total_nights)],
    ['Amount due', currency.format(Number(booking.total_amount || 0))]
  ]);

  const introHtml = `
    <p style="margin: 0 0 6px; font-size: 14px;">Hi ${escapeHtml(booking.guest_name)},</p>
    <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.6; color: #5A4535;">
      Your HavenStay reservation is still pending payment. Complete your payment to lock in your stay and receive your full booking details and transaction slip.
    </p>`;

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #E8DFD5; border-bottom: 1px solid #E8DFD5; margin-bottom: 22px;">
      ${detailRows}
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 22px;">
      <tr>
        <td>
          <a href="${escapeHtml(payUrl)}" style="display: inline-block; background: #5A4535; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: bold; text-decoration: none;">Complete payment</a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 4px; color: #1E1B18; font-size: 14px; font-weight: bold;">Need help?</p>
    <p style="margin: 0; color: #8C6D53; font-size: 13px; line-height: 1.6;">
      Contact HavenStay at ${escapeHtml(COMPANY_EMAIL)} or ${escapeHtml(COMPANY_PHONE)} and quote your booking reference.
    </p>`;

  return `<!DOCTYPE html>
<html lang="en">
  ${buildEmailShell({
    badge: 'PAYMENT PENDING',
    badgeColor: '#B7791F',
    eyebrow: 'Reservation reminder',
    introHtml,
    bodyHtml,
    links: booking.subscriptionLinks,
    footerNote: 'This is an automated reminder for a booking that has not been paid yet.'
  })}
</html>`;
};

const buildReminderText = (booking) => {
  const payUrl = `${getAppUrl()}/guest-booking/${encodeURIComponent(booking.access_token)}`;
  return `
HAVENSTAY — PAYMENT REMINDER

Hi ${booking.guest_name},

Your reservation is still pending payment.

BOOKING DETAILS
Booking reference: ${String(booking.id).slice(0, 8).toUpperCase()}
Apartment: ${booking.apartment_title}
City: ${booking.city}
Check-in: ${formatDate(booking.check_in)}
Check-out: ${formatDate(booking.check_out)}
Nights: ${booking.total_nights}
Amount due: ${currency.format(Number(booking.total_amount || 0))}

Complete payment: ${payUrl}

Need help? Contact HavenStay at ${COMPANY_EMAIL} or ${COMPANY_PHONE}.

${buildSubscriptionFooterText(booking.subscriptionLinks)}
`.trim();
};

const buildVerificationCodeHtml = ({ fullName, code, expiresInMinutes = 15 }) => {
  const introHtml = `
    <p style="margin: 0 0 6px; font-size: 14px;">Hi ${escapeHtml(fullName || 'there')},</p>
    <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.6; color: #5A4535;">
      Thanks for creating your HavenStay account. Enter the verification code below to confirm your email address and finish signing up.
    </p>`;

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F5F0EB; border: 1px solid #E8DFD5; border-radius: 12px; padding: 22px; margin-bottom: 22px;">
      <tr>
        <td align="center" style="padding: 12px;">
          <p style="margin: 0; color: #8C6D53; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
          <p style="margin: 10px 0 0; color: #1E1B18; font-size: 36px; font-weight: bold; letter-spacing: 10px;">${escapeHtml(code)}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 8px; color: #8C6D53; font-size: 13px; line-height: 1.6;">
      This code expires in ${escapeHtml(String(expiresInMinutes))} minutes. If it expires, you can request a new one from the signup screen.
    </p>
    <p style="margin: 0; color: #8C6D53; font-size: 13px; line-height: 1.6;">
      If you did not create a HavenStay account, you can safely ignore this email.
    </p>`;

  return `<!DOCTYPE html>
<html lang="en">
  ${buildEmailShell({
    badge: 'VERIFY EMAIL',
    badgeColor: '#5A4535',
    eyebrow: 'Account verification',
    introHtml,
    bodyHtml,
    footerNote: 'This is an automated message to verify your HavenStay account.'
  })}
</html>`;
};

const buildVerificationCodeText = ({ fullName, code, expiresInMinutes = 15 }) => `
HAVENSTAY — EMAIL VERIFICATION

Hi ${fullName || 'there'},

Thanks for creating your HavenStay account. Use the verification code below to confirm your email address and finish signing up.

Verification code: ${code}

This code expires in ${expiresInMinutes} minutes. If it expires, request a new one from the signup screen.

If you did not create a HavenStay account, you can safely ignore this email.
`.trim();

const sendMail = async ({ to, toName, subject, text, html, unsubscribeUrl }) => {
  if (!isConfigured()) {
    console.warn('[email] Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL to send emails.');
    return { sent: false, reason: 'Email service is not configured' };
  }

  try {
    const payload = {
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL
      },
      to: [{ email: to, ...(toName ? { name: toName } : {}) }],
      replyTo: { email: COMPANY_EMAIL, name: BREVO_SENDER_NAME },
      subject,
      htmlContent: html,
      textContent: text
    };

    if (unsubscribeUrl) {
      payload.headers = {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:${COMPANY_EMAIL}?subject=unsubscribe>`
      };
    }

    const response = await axios.post(
      BREVO_API_URL,
      payload,
      {
        headers: {
          accept: 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        httpsAgent: brevoAgent,
        timeout: 20000
      }
    );

    return { sent: true, messageId: response.data?.messageId };
  } catch (error) {
    const reason = error.response?.data?.message
      || error.response?.data?.code
      || error.message;
    console.error('[email] Brevo send failed:', reason);
    return { sent: false, reason };
  }
};

const sendBookingReceipt = async (receipt) => {
  const subscriptionLinks = await buildSubscriptionLinksForEmail(receipt.guestEmail, receipt.guestName);
  const enriched = { ...receipt, subscriptionLinks };

  return sendMail({
    to: enriched.guestEmail,
    toName: enriched.guestName,
    subject: `Your HavenStay booking is confirmed — ${enriched.reference}`,
    text: buildReceiptText(enriched),
    html: buildReceiptHtml(enriched),
    unsubscribeUrl: subscriptionLinks?.unsubscribeUrl
  });
};

const sendBookingReminder = async (booking) => {
  const subscriptionLinks = await buildSubscriptionLinksForEmail(booking.guest_email, booking.guest_name);
  const enriched = { ...booking, subscriptionLinks };

  return sendMail({
    to: enriched.guest_email,
    toName: enriched.guest_name,
    subject: `Complete your HavenStay payment — ${String(enriched.id).slice(0, 8).toUpperCase()}`,
    text: buildReminderText(enriched),
    html: buildReminderHtml(enriched),
    unsubscribeUrl: subscriptionLinks?.unsubscribeUrl
  });
};

const sendVerificationCode = async ({ email, fullName, code, expiresInMinutes = 15 }) => {
  return sendMail({
    to: email,
    toName: fullName,
    subject: 'Your HavenStay verification code',
    text: buildVerificationCodeText({ fullName, code, expiresInMinutes }),
    html: buildVerificationCodeHtml({ fullName, code, expiresInMinutes })
  });
};

module.exports = {
  sendBookingReceipt,
  sendBookingReminder,
  sendVerificationCode,
  sendEmail: sendMail,
  isConfigured,
  buildReceiptHtml,
  buildReceiptText,
  buildReminderHtml,
  buildReminderText,
  buildVerificationCodeHtml,
  buildVerificationCodeText
};
