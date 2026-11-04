const express = require('express');
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, async (req, res) => {
  const { apartment_id, check_in, check_out, total_nights } = req.body;
  try {
    const aptRes = await db.query('SELECT price_per_night, cleaning_fee, service_fee FROM apartments WHERE id = $1', [apartment_id]);
    if (aptRes.rows.length === 0) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    const apt = aptRes.rows[0];
    const base_price = parseFloat(apt.price_per_night) * parseInt(total_nights);
    const cleaning_fee = parseFloat(apt.cleaning_fee || 0);
    const service_fee = parseFloat(apt.service_fee || 0);
    const total_amount = base_price + cleaning_fee + service_fee;

    const newBooking = await db.query(
      `INSERT INTO bookings 
       (apartment_id, guest_id, check_in, check_out, total_nights, base_price, cleaning_fee, service_fee, total_amount, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending') 
       RETURNING *`,
      [apartment_id, req.user.id, check_in, check_out, total_nights, base_price, cleaning_fee, service_fee, total_amount]
    );
    res.status(201).json(newBooking.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error initializing booking', error: error.message });
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
