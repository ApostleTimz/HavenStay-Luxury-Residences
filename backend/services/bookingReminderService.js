const db = require('../config/db');
const { sendBookingReminder } = require('./emailService');

const REMINDER_DELAY_MINUTES = Math.max(1, Number(process.env.BOOKING_REMINDER_DELAY_MINUTES || 60));
const REMINDER_INTERVAL_MINUTES = Math.max(1, Number(process.env.REMINDER_INTERVAL_MINUTES || 15));

let running = false;
let timer = null;

const loadPendingBookings = async () => {
  const result = await db.query(
    `SELECT b.*, a.title AS apartment_title, a.city, a.address,
            COALESCE(b.guest_name, u.full_name, 'Guest') AS guest_name,
            COALESCE(b.guest_email, u.email) AS guest_email
     FROM bookings b
     JOIN apartments a ON b.apartment_id = a.id
     LEFT JOIN users u ON b.guest_id = u.id
     WHERE b.status = 'pending'
       AND b.reminder_sent_at IS NULL
       AND COALESCE(b.guest_email, u.email) IS NOT NULL
       AND b.created_at < NOW() - ($1 * INTERVAL '1 minute')
       AND b.created_at > NOW() - INTERVAL '7 days'
     ORDER BY b.created_at ASC
     LIMIT 50`,
    [REMINDER_DELAY_MINUTES]
  );
  return result.rows;
};

const sendPendingBookingReminders = async () => {
  if (running) return;
  running = true;

  try {
    const bookings = await loadPendingBookings();
    for (const booking of bookings) {
      try {
        const result = await sendBookingReminder(booking);
        if (result.sent) {
          await db.query('UPDATE bookings SET reminder_sent_at = NOW() WHERE id = $1', [booking.id]);
          console.log(`[reminders] Sent unpaid booking reminder for ${booking.id}`);
        } else {
          console.warn(`[reminders] Reminder not sent for ${booking.id}: ${result.reason}`);
        }
      } catch (error) {
        console.error(`[reminders] Failed to process booking ${booking.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[reminders] Unable to load pending bookings:', error.message);
  } finally {
    running = false;
  }
};

const startBookingReminderService = () => {
  if (timer) return;

  const initialDelay = 20 * 1000;
  setTimeout(sendPendingBookingReminders, initialDelay).unref?.();

  timer = setInterval(sendPendingBookingReminders, REMINDER_INTERVAL_MINUTES * 60 * 1000);
  timer.unref?.();

  console.log(
    `[reminders] Unpaid booking reminders run every ${REMINDER_INTERVAL_MINUTES} minute(s) for bookings older than ${REMINDER_DELAY_MINUTES} minute(s).`
  );
};

module.exports = { sendPendingBookingReminders, startBookingReminderService };
