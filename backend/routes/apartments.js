const express = require('express');
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { city, minPrice, maxPrice, bedrooms } = req.query;
    let query = 'SELECT * FROM apartments WHERE is_available = TRUE';
    let params = [];
    let conditions = [];

    if (city) {
      params.push(`%${city}%`);
      conditions.push(`city ILIKE $${params.length}`);
    }
    if (minPrice) {
      params.push(minPrice);
      conditions.push(`price_per_night >= $${params.length}`);
    }
    if (maxPrice) {
      params.push(maxPrice);
      conditions.push(`price_per_night <= $${params.length}`);
    }
    if (bedrooms) {
      params.push(bedrooms);
      conditions.push(`bedrooms >= $${params.length}`);
    }
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching apartments', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, u.full_name as host_name, u.email as host_email 
       FROM apartments a 
       LEFT JOIN users u ON a.host_id = u.id 
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving apartment', error: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  const {
    title, description, city, address, price_per_night,
    cleaning_fee, service_fee, bedrooms, bathrooms, max_guests, images, amenities
  } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO apartments 
       (host_id, title, description, city, address, price_per_night, cleaning_fee, service_fee, bedrooms, bathrooms, max_guests, images, amenities) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
       RETURNING *`,
      [
        req.user.id, title, description, city, address, price_per_night,
        cleaning_fee || 0, service_fee || 0, bedrooms || 1, bathrooms || 1,
        max_guests || 2, images || [], amenities || []
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create apartment listing', error: error.message });
  }
});

module.exports = router;