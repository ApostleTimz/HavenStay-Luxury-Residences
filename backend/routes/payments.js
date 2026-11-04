const express = require('express');
const https = require('https');
const axios = require('axios');
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const { sendBookingReceipt } = require('../services/emailService');
const router = express.Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const paystackHeaders = {
  Authorization: `Bearer ${PAYSTACK_SECRET}`,
  'Content-Type': 'application/json'
};

const paystackAgent = new https.Agent({ family: 4 });

router.post('/initialize', protect, async (req, res) => {
  const { booking_id } = req.body;
  if (!booking_id) {
    return res.status(400).json({ message: 'booking_id is required' });
  }

  try {
    const bookingRes = await db.query(
      `SELECT b.id, b.total_amount, b.status, a.title AS apartment_title, u.email
       FROM bookings b
       JOIN apartments a ON b.apartment_id = a.id
       JOIN users u ON b.guest_id = u.id
       WHERE b.id = $1 AND b.guest_id = $2`,
      [booking_id, req.user.id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];
    if (booking.status === 'confirmed') {
      return res.status(400).json({ message: 'This booking has already been paid for' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking has been cancelled' });
    }

    const reference = `HS_${booking.id.slice(0, 8)}_${Date.now()}`;
    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: booking.email,
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
    res.status(500).json({
      message: 'Failed to initialize payment with Paystack',
      error: error.response?.data || error.message
    });
  }
});

router.post('/verify', protect, async (req, res) => {
  const { reference, booking_id } = req.body;
  if (!reference || !booking_id) {
    return res.status(400).json({ message: 'Reference and booking_id are required' });
  }
  try {
    const bookingRes = await db.query(
      'SELECT id, total_amount FROM bookings WHERE id = $1 AND guest_id = $2',
      [booking_id, req.user.id]
    );
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const paystackRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, httpsAgent: paystackAgent }
    );
    const data = paystackRes.data.data;
    if (data.status === 'success') {
      const amountPaid = data.amount / 100;
      const expectedAmount = parseFloat(bookingRes.rows[0].total_amount);

      if (Math.abs(amountPaid - expectedAmount) > 0.01) {
        return res.status(400).json({ message: 'Payment amount does not match this booking' });
      }

      await db.query(
        `INSERT INTO payments (booking_id, user_id, reference, amount, currency, payment_status, paystack_response, paid_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
         ON CONFLICT (reference) DO UPDATE 
         SET payment_status = EXCLUDED.payment_status, paid_at = NOW()`,
        [booking_id, req.user.id, reference, amountPaid, data.currency, 'success', JSON.stringify(data)]
      );
      await db.query(
        `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
        [booking_id]
      );

      const detailsRes = await db.query(
        `SELECT b.*, a.title AS apartment_title, a.address, a.city, u.full_name, u.email
         FROM bookings b
         JOIN apartments a ON b.apartment_id = a.id
         JOIN users u ON b.guest_id = u.id
         WHERE b.id = $1`,
        [booking_id]
      );
      const booking = detailsRes.rows[0];

      const receipt = {
        reference,
        guestName: booking.full_name,
        guestEmail: booking.email,
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
        status: booking.status
      };

      const emailResult = await sendBookingReceipt(receipt);

      return res.json({
        message: 'Payment verified and booking confirmed!',
        booking,
        receipt,
        email: emailResult
      });
    } else {
      return res.status(400).json({ message: 'Payment verification failed', status: data.status });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify payment with Paystack', error: error.response?.data || error.message });
  }
});

module.exports = router;
