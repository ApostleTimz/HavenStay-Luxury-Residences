import { useCallback, useEffect, useRef, useState } from 'react';
import { apartmentAPI } from '../services/api';

const FALLBACK_APARTMENTS_URL = import.meta.env.VITE_APARTMENTS_URL || '/apartments.json';

const matchesCity = (apartment, city) => {
  const term = city.trim().toLowerCase();
  if (!term) return true;
  return String(apartment?.city || '').toLowerCase().includes(term);
};

const loadFallbackApartments = async (city) => {
  const response = await fetch(FALLBACK_APARTMENTS_URL);
  if (!response.ok) throw new Error('Apartment data could not be loaded');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Apartment data is not a valid list');
  return data
    .filter((apartment) => apartment?.is_available !== false)
    .filter((apartment) => matchesCity(apartment, city));
};

export default function useApartments(selectedCity) {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const loadApartments = useCallback(async () => {
    const currentRequest = ++requestId.current;
    const city = selectedCity.trim();

    setLoading(true);
    setError('');

    let rows = [];
    let backendError = null;

    try {
      const response = await apartmentAPI.getAll(city ? { city } : {});
      rows = Array.isArray(response.data) ? response.data : [];
    } catch (err) {
      backendError = err;
    }

    if (rows.length === 0) {
      try {
        rows = await loadFallbackApartments(city);
      } catch (fallbackError) {
        if (currentRequest !== requestId.current) return;
        setApartments([]);
        setError(
          backendError?.response?.data?.message ||
            fallbackError.message ||
            'Unable to load apartments.'
        );
        setLoading(false);
        return;
      }
    }

    if (currentRequest !== requestId.current) return;

    if (backendError) {
      console.error('Failed to load apartments from the API, using demo data:', backendError);
    }

    setApartments(rows);
    setLoading(false);
  }, [selectedCity]);

  useEffect(() => { loadApartments(); }, [loadApartments]);
  return { apartments, loading, error, loadApartments };
}
