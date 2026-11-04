const nodemailer = require('nodemailer');

const COMPANY_EMAIL = process.env.COMPANY_EMAIL || 'bulusakwashikitimothy@gmail.com';
const COMPANY_PHONE = process.env.COMPANY_PHONE || '0814 347 7093';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : SMTP_PORT === 465;
const SMTP_USER = process.env.SMTP_USER || COMPANY_EMAIL;
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;

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

const isConfigured = () => Boolean(SMTP_USER && SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      family: 4,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    });
  }
  return transporter;
};

const buildReceiptHtml = (receipt) => {
  const rows = [
    ['Apartment', receipt.apartmentTitle],
    ['Address', receipt.address],
    ['City', receipt.city],
    ['Check-in', formatDate(receipt.checkIn)],
    ['Check-out', formatDate(receipt.checkOut)],
    ['Nights', String(receipt.nights)]
  ];

  const detailRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding: 7px 0; color: #8C6D53; font-size: 13px;">${escapeHtml(label)}</td>
      <td style="padding: 7px 0; color: #1E1B18; font-size: 13px; font-weight: 600; text-align: right;">${escapeHtml(value)}</td>
    </tr>
  `).join('');

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

  return `<!DOCTYPE html>
<html lang="en">
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
                      <span style="display: inline-block; background: #2F7D5B; color: #FFFFFF; padding: 7px 14px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">PAID</span>
                    </td>
                  </tr>
                </table>
                <p style="margin: 8px 0 0; color: #E8DFD5; font-size: 13px;">Payment Receipt</p>
              </td>
            </tr>

            <tr>
              <td style="padding: 28px 32px;">
                <p style="margin: 0 0 4px; color: #8C6D53; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Receipt reference</p>
                <p style="margin: 0 0 20px; color: #1E1B18; font-size: 17px; font-weight: bold;">${escapeHtml(receipt.reference)}</p>

                <p style="margin: 0 0 6px; font-size: 14px;">Hi ${escapeHtml(receipt.guestName)},</p>
                <p style="margin: 0 0 22px; font-size: 14px; line-height: 1.6; color: #5A4535;">
                  Your payment was successful and your reservation is confirmed. Below are your complete booking details.
                </p>

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
                <p style="margin: 0; color: #8C6D53; font-size: 13px; line-height: 1.6;">
                  Contact HavenStay at ${escapeHtml(COMPANY_EMAIL)} or ${escapeHtml(COMPANY_PHONE)}.
                  Please keep this receipt for your records.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background: #F5F0EB; padding: 18px 32px; text-align: center; color: #8C6D53; font-size: 11px; line-height: 1.6;">
                © ${new Date().getFullYear()} HavenStay Luxury Residences. All rights reserved.<br />
                This is an automated receipt for your completed booking.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const buildReceiptText = (receipt) => `
HAVENSTAY — PAYMENT RECEIPT
Receipt reference: ${receipt.reference}

Hi ${receipt.guestName},

Your payment was successful and your reservation is confirmed.

BOOKING DETAILS
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
`.trim();

const sendBookingReceipt = async (receipt) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn('[email] SMTP is not configured. Set SMTP_USER and SMTP_PASS to send receipts.');
    return { sent: false, reason: 'Email service is not configured' };
  }

  try {
    const info = await mailer.sendMail({
      from: `"HavenStay" <${EMAIL_FROM}>`,
      to: receipt.guestEmail,
      replyTo: COMPANY_EMAIL,
      subject: `Your HavenStay booking is confirmed — ${receipt.reference}`,
      text: buildReceiptText(receipt),
      html: buildReceiptHtml(receipt)
    });

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email] Failed to send booking receipt:', error.message);
    return { sent: false, reason: 'Failed to send receipt email' };
  }
};

module.exports = { sendBookingReceipt, isConfigured, buildReceiptHtml, buildReceiptText };
