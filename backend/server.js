const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const apartmentRoutes = require('./routes/apartments');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscriptions');
const { startBookingReminderService } = require('./services/bookingReminderService');
const { initializeDatabase } = require('./services/databaseInitializer');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date() });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.use((error, req, res, next) => {
  console.error('[server] Unhandled error:', error);
  res.status(500).json({ message: 'Unexpected server error' });
});

const PORT = process.env.PORT || 5000;
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`HavenStay luxury backend running on port ${PORT}`);
      startBookingReminderService();
    });
  })
  .catch((error) => {
    console.error('[database] Initialization failed:', error);
    process.exit(1);
  });