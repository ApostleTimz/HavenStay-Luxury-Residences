const express = require('express');
const https = require('https');
const axios = require('axios');
const db = require('../config/db');
const { optionalProtect } = require('../middleware/authMiddleware');
const { sendBookingReceipt } = require('../services/emailService');
const router = express.Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const paystackHeaders = {
  Authorization: `Bearer ${PAYSTACK_SECRET}`,
  'Content-Type': 'application/json'
};

const paystackAgent = new https.Agent({ family: 4 });

const bookingLookupQuery = `
  SELECT b.id, b.total_amount, b.status, b.guest_id, b.guest_name, b.guest_email,
         b.access_token, b.check_in, b.check_out, b.total_nights, b.base_price,
         b.cleaning_fee, b.service_fee,
         a.title AS apartment_title, a.address, a.city,
         u.full_name AS user_full_name, u.email AS user_email
  FROM bookings b
  JOIN apartments a ON b.apartment_id = a.id
  LEFT JOIN users u ON b.guest_id = u.id
`;

const contactEmail = (booking) => booking.guest_email || booking.user_email;
const contactName = (booking) => booking.guest_name || booking.user_full_name || 'Guest';

const canAccessBooking = (req, booking, accessToken) => {
  if (accessToken && booking.access_token === accessToken) return true;
  return Boolean(req.user && booking.guest_id && booking.guest_id === req.user.id);
};

router.post('/initialize', optionalProtect, async (req, res) => {
  const { booking_id, access_token } = req.body;
  if (!booking_id && !access_token) {
    return res.status(400).json({ message: 'booking_id or access_token is required' });
  }

  try {
    let booking;

    if (access_token) {
      const result = await db.query(`${bookingLookupQuery} WHERE b.access_token = $1`, [access_token]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found or this link has expired' });
      }
      booking = result.rows[0];
      if (booking_id && booking.id !== booking_id) {
        return res.status(400).json({ message: 'This payment link does not match the booking' });
      }
    } else {
      if (!req.user) {
        return res.status(401).json({ message: 'Please sign in or use the booking email link to continue' });
      }
      const result = await db.query(
        `${bookingLookupQuery} WHERE b.id = $1 AND b.guest_id = $2`,
        [booking_id, req.user.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      booking = result.rows[0];
    }

    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'This booking has already been paid for' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking has been cancelled' });
    }

    const email = contactEmail(booking);
    if (!email) {
      return res.status(400).json({ message: 'This booking does not have an email address for payment' });
    }

    const reference = `HS_${booking.id.slice(0, 8)}_${Date.now()}`;
    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: Math.round(parseFloat(booking.total_amount) * 100),
        currency: 'NGN',
        reference,
        metadata: {
          booking_id: booking.id,
          apartment_title: booking.apartment_title
        }
      },
      { headers: paystackHeaders, httpsAgent: paystackAgent }
    );

    if (!paystackRes.data.status) {
      return res.status(502).json({ message: 'Paystack could not initialize this transaction' });
    }

    const { access_code, reference: paystackReference } = paystackRes.data.data;
    res.json({ access_code, reference: paystackReference });
  } catch (error) {
    console.error('[payments] Initialization failed:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to initialize payment with Paystack',
      error: error.response?.data || error.message
    });
  }
});

router.post('/verify', optionalProtect, async (req, res) => {
  const { reference, booking_id, access_token } = req.body;
  if (!reference || (!booking_id && !access_token)) {
    return res.status(400).json({ message: 'Reference and booking identifier are required' });
  }

  try {
    let booking;

    if (access_token) {
      const result = await db.query(`${bookingLookupQuery} WHERE b.access_token = $1`, [access_token]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found or this link has expired' });
      }
      booking = result.rows[0];
    } else {
      if (!req.user) {
        return res.status(401).json({ message: 'Please sign in or use the booking email link to continue' });
      }
      const result = await db.query(
        `${bookingLookupQuery} WHERE b.id = $1 AND b.guest_id = $2`,
        [booking_id, req.user.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      booking = result.rows[0];
    }

    if (!canAccessBooking(req, booking, access_token)) {
      return res.status(403).json({ message: 'You are not allowed to verify this booking' });
    }
    if (booking_id && booking.id !== booking_id) {
      return res.status(400).json({ message: 'This payment does not match the booking' });
    }

    const paystackRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, httpsAgent: paystackAgent }
    );
    const data = paystackRes.data.data;
    if (data.status !== 'success') {
      return res.status(400).json({ message: 'Payment verification failed', status: data.status });
    }

    const amountPaid = data.amount / 100;
    const expectedAmount = parseFloat(booking.total_amount);

    if (Math.abs(amountPaid - expectedAmount) > 0.01) {
      return res.status(400).json({ message: 'Payment amount does not match this booking' });
    }

    await db.query(
      `INSERT INTO payments (booking_id, user_id, reference, amount, currency, payment_status, paystack_response, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (reference) DO UPDATE
       SET payment_status = EXCLUDED.payment_status, paid_at = NOW()`,
      [booking.id, booking.guest_id || null, reference, amountPaid, data.currency, 'success', JSON.stringify(data)]
    );
    await db.query(
      `UPDATE bookings SET status = 'confirmed', reminder_sent_at = COALESCE(reminder_sent_at, NOW()) WHERE id = $1`,
      [booking.id]
    );

    const receipt = {
      reference,
      bookingReference: String(booking.id).slice(0, 8).toUpperCase(),
      guestName: contactName(booking),
      guestEmail: contactEmail(booking),
      apartmentTitle: booking.apartment_title,
      address: booking.address,
      city: booking.city,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      nights: booking.total_nights,
      basePrice: parseFloat(booking.base_price || 0),
      cleaningFee: parseFloat(booking.cleaning_fee || 0),
      serviceFee: parseFloat(booking.service_fee || 0),
      totalAmount: parseFloat(booking.total_amount || 0),
      paidAt: new Date().toISOString(),
      status: 'confirmed'
    };

    const emailResult = await sendBookingReceipt(receipt);

    return res.json({
      message: 'Payment verified and booking confirmed!',
      receipt,
      email: emailResult
    });
  } catch (error) {
    console.error('[payments] Verification failed:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to verify payment with Paystack',
      error: error.response?.data || error.message
    });
  }
});

module.exports = router;
