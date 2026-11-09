const express = require('express');
const db = require('../config/db');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { ensureSubscriber, normalizeEmail, isValidEmail } = require('../services/subscriptionService');
const router = express.Router();

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const calculateNights = (checkIn, checkOut) => {
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end - start) / MS_PER_DAY));
};

router.post('/', optionalProtect, async (req, res) => {
  const { apartment_id, check_in, check_out } = req.body;

  if (!apartment_id || !check_in || !check_out) {
    return res.status(400).json({ message: 'Apartment, check-in, and check-out dates are required' });
  }

  const total_nights = calculateNights(check_in, check_out);
  if (total_nights < 1) {
    return res.status(400).json({ message: 'Check-out date must be after the check-in date' });
  }

  let guest_id = null;
  let guest_name = String(req.body.guest_name || '').trim();
  let guest_email = normalizeEmail(req.body.guest_email);

  try {
    if (req.user) {
      const userRes = await db.query('SELECT full_name, email FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rows.length === 0) {
        return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });
      }
      guest_id = req.user.id;
      guest_name = guest_name || userRes.rows[0].full_name;
      guest_email = guest_email || normalizeEmail(userRes.rows[0].email);
    } else {
      if (!guest_name) {
        return res.status(400).json({ message: 'Please enter your full name so we can personalize your booking.' });
      }
      if (!USERNAME_PATTERN.test(guest_name)) {
        return res.status(400).json({
          message: 'Name must start with a letter and contain only letters and numbers, with no spaces or special characters.'
        });
      }
      if (!guest_email || !isValidEmail(guest_email)) {
        return res.status(400).json({ message: 'A valid email address is required so we can send your booking details.' });
      }
    }

    const aptRes = await db.query(
      'SELECT price_per_night, cleaning_fee, service_fee FROM apartments WHERE id = $1 AND is_available = TRUE',
      [apartment_id]
    );
    if (aptRes.rows.length === 0) {
      return res.status(404).json({ message: 'Apartment not found' });
    }

    const apt = aptRes.rows[0];
    const base_price = parseFloat(apt.price_per_night) * total_nights;
    const cleaning_fee = parseFloat(apt.cleaning_fee || 0);
    const service_fee = parseFloat(apt.service_fee || 0);
    const total_amount = base_price + cleaning_fee + service_fee;

    const newBooking = await db.query(
      `INSERT INTO bookings
       (apartment_id, guest_id, guest_name, guest_email, check_in, check_out, total_nights, base_price, cleaning_fee, service_fee, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
       RETURNING *`,
      [apartment_id, guest_id, guest_name, guest_email, check_in, check_out, total_nights, base_price, cleaning_fee, service_fee, total_amount]
    );

    await ensureSubscriber(guest_email, guest_name);

    res.status(201).json(newBooking.rows[0]);
  } catch (error) {
    console.error('[bookings] Failed to create booking:', error.message);
    res.status(500).json({ message: 'Error initializing booking. Please try again.' });
  }
});

router.get('/guest/:token', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.token)) {
    return res.status(404).json({ message: 'Booking not found or this link has expired' });
  }

  try {
    const result = await db.query(
      `SELECT b.*, a.title AS apartment_title, a.city, a.address, a.images
       FROM bookings b
       JOIN apartments a ON b.apartment_id = a.id
       WHERE b.access_token = $1`,
      [req.params.token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found or this link has expired' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[bookings] Failed to load guest booking:', error.message);
    res.status(500).json({ message: 'Unable to load this booking' });
  }
});

router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const cancelled = await db.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = $1 AND guest_id = $2 AND status = 'pending'
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (cancelled.rows.length === 0) {
      return res.status(404).json({ message: 'Pending booking not found or cannot be cancelled' });
    }

    res.json(cancelled.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
});

router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await db.query(
      `SELECT b.*, a.title as apartment_title, a.city, a.images
       FROM bookings b
       JOIN apartments a ON b.apartment_id = a.id
       WHERE b.guest_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(bookings.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error loading user bookings', error: error.message });
  }
});

module.exports = router;
