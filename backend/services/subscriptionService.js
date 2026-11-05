const db = require('../config/db');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isValidEmail = (email) => EMAIL_PATTERN.test(normalizeEmail(email));
const isValidToken = (token) => UUID_PATTERN.test(String(token || ''));

const getAppUrl = () => {
  const configured = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  return configured.replace(/\/+$/, '');
};

const buildSubscriptionLinks = (token) => {
  const base = getAppUrl();
  return {
    subscribeUrl: `${base}/subscribe?token=${encodeURIComponent(token)}`,
    unsubscribeUrl: `${base}/unsubscribe?token=${encodeURIComponent(token)}`
  };
};

const ensureSubscriber = async (email, fullName = null) => {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) return null;

  const inserted = await db.query(
    `INSERT INTO email_subscribers (email, full_name, is_subscribed)
     VALUES ($1, $2, FALSE)
     ON CONFLICT (email) DO UPDATE
       SET full_name = COALESCE(EXCLUDED.full_name, email_subscribers.full_name)
     RETURNING *`,
    [normalized, fullName ? String(fullName).trim() : null]
  );
  return inserted.rows[0];
};

const getSubscriberByToken = async (token) => {
  if (!isValidToken(token)) return null;
  const result = await db.query('SELECT * FROM email_subscribers WHERE token = $1', [token]);
  return result.rows[0] || null;
};

const setSubscriptionByToken = async (token, isSubscribed) => {
  if (!isValidToken(token)) return null;
  const result = await db.query(
    `UPDATE email_subscribers
     SET is_subscribed = $2,
         subscribed_at = CASE WHEN $2 THEN NOW() ELSE subscribed_at END,
         unsubscribed_at = CASE WHEN $2 THEN NULL ELSE NOW() END
     WHERE token = $1
     RETURNING *`,
    [token, Boolean(isSubscribed)]
  );
  return result.rows[0] || null;
};

const setSubscriptionByEmail = async (email, isSubscribed, fullName = null) => {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) return null;

  const result = await db.query(
    `INSERT INTO email_subscribers (email, full_name, is_subscribed, subscribed_at, unsubscribed_at)
     VALUES ($1, $2, $3,
       CASE WHEN $3 THEN NOW() ELSE NULL END,
       CASE WHEN $3 THEN NULL ELSE NOW() END)
     ON CONFLICT (email) DO UPDATE
       SET is_subscribed = EXCLUDED.is_subscribed,
           full_name = COALESCE(EXCLUDED.full_name, email_subscribers.full_name),
           subscribed_at = CASE WHEN EXCLUDED.is_subscribed THEN NOW() ELSE email_subscribers.subscribed_at END,
           unsubscribed_at = CASE WHEN EXCLUDED.is_subscribed THEN NULL ELSE NOW() END
     RETURNING *`,
    [normalized, fullName ? String(fullName).trim() : null, Boolean(isSubscribed)]
  );
  return result.rows[0] || null;
};

const buildSubscriptionLinksForEmail = async (email, fullName = null) => {
  const subscriber = await ensureSubscriber(email, fullName).catch((error) => {
    console.error('[subscriptions] Unable to prepare subscriber:', error.message);
    return null;
  });
  if (!subscriber) return null;
  return {
    ...buildSubscriptionLinks(subscriber.token),
    isSubscribed: subscriber.is_subscribed
  };
};

module.exports = {
  normalizeEmail,
  isValidEmail,
  isValidToken,
  getAppUrl,
  buildSubscriptionLinks,
  ensureSubscriber,
  getSubscriberByToken,
  setSubscriptionByToken,
  setSubscriptionByEmail,
  buildSubscriptionLinksForEmail
};
