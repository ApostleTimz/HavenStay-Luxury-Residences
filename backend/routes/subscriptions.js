const express = require('express');
const {
  normalizeEmail,
  isValidEmail,
  getSubscriberByToken,
  setSubscriptionByToken,
  setSubscriptionByEmail
} = require('../services/subscriptionService');
const router = express.Router();

const toPublicSubscriber = (subscriber) => ({
  email: subscriber.email,
  full_name: subscriber.full_name,
  is_subscribed: subscriber.is_subscribed
});

router.post('/subscribe', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const fullName = req.body.full_name || null;

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  try {
    const subscriber = await setSubscriptionByEmail(email, true, fullName);
    res.json({
      message: 'You are subscribed to HavenStay updates.',
      subscriber: toPublicSubscriber(subscriber)
    });
  } catch (error) {
    console.error('[subscriptions] Subscribe failed:', error.message);
    res.status(500).json({ message: 'Unable to update your subscription right now' });
  }
});

router.post('/unsubscribe', async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  try {
    const subscriber = await setSubscriptionByEmail(email, false);
    res.json({
      message: 'You have been unsubscribed from HavenStay updates.',
      subscriber: toPublicSubscriber(subscriber)
    });
  } catch (error) {
    console.error('[subscriptions] Unsubscribe failed:', error.message);
    res.status(500).json({ message: 'Unable to update your subscription right now' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const subscriber = await getSubscriberByToken(req.query.token);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscription link is invalid or has expired' });
    }
    res.json({ subscriber: toPublicSubscriber(subscriber) });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load your subscription' });
  }
});

router.get('/subscribe', async (req, res) => {
  try {
    const subscriber = await setSubscriptionByToken(req.query.token, true);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscription link is invalid or has expired' });
    }
    res.json({
      message: 'You are subscribed to HavenStay updates.',
      subscriber: toPublicSubscriber(subscriber)
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update your subscription right now' });
  }
});

router.get('/unsubscribe', async (req, res) => {
  try {
    const subscriber = await setSubscriptionByToken(req.query.token, false);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscription link is invalid or has expired' });
    }
    res.json({
      message: 'You have been unsubscribed from HavenStay updates.',
      subscriber: toPublicSubscriber(subscriber)
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update your subscription right now' });
  }
});

module.exports = router;
