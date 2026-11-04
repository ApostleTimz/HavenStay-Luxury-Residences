import { useCallback, useEffect, useState } from 'react';
import { bookingAPI } from '../services/api';

export default function useBookings(shouldLoad) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bookingAPI.getUserBookings();
      setBookings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reservations.');
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (shouldLoad) loadBookings(); }, [shouldLoad, loadBookings]);
  return { bookings, loading, error, loadBookings };
}
