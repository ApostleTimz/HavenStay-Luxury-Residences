import React, { useMemo, useState } from 'react';
import { apartmentAPI, bookingAPI, paymentAPI, getApiErrorMessage } from '../../../services/api';
import RefundPolicyModal from './RefundPolicyModal';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;
const USERNAME_RULE_MESSAGE = 'Name must start with a letter and contain only letters and numbers, with no spaces or special characters.';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const resolveApartmentId = async (apartment) => {
  if (UUID_PATTERN.test(apartment.id || '')) return apartment.id;

  const response = await apartmentAPI.getAll();
  const listings = Array.isArray(response.data) ? response.data : [];
  const match = listings.find(
    (listing) => listing.title === apartment.title && listing.city === apartment.city
  );

  if (!match) throw new Error('DEMO_LISTING_UNAVAILABLE');
  return match.id;
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (value, days) => {
  const start = toDate(value);
  if (!start || !days) return '';
  const next = new Date(start.getTime() + days * MS_PER_DAY);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
};

const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
};

const today = new Date();
const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

export default function BookingModal({ apartment, user, onClose, onSuccess }) {
  const [checkIn, setCheckIn] = useState('');
  const [nightsInput, setNightsInput] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [pendingBooking, setPendingBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refundOpen, setRefundOpen] = useState(false);

  const pricePerNight = parseFloat(apartment.price_per_night || 0);
  const cleaningFee = parseFloat(apartment.cleaning_fee || 0);
  const serviceFee = parseFloat(apartment.service_fee || 0);
  const nights = useMemo(() => {
    const parsed = parseInt(nightsInput, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [nightsInput]);
  const checkOut = useMemo(() => addDays(checkIn, nights), [checkIn, nights]);
  const basePrice = pricePerNight * Math.max(nights, 0);
  const totalAmount = basePrice + cleaningFee + serviceFee;

  const handlePayment = async () => {
    setError('');

    if (!checkIn) {
      setError('Please select your check-in date.');
      return;
    }
    if (nights < 1) {
      setError('Please enter the number of nights you intend to stay.');
      return;
    }
    if (!user) {
      const trimmedGuestName = guestName.trim();
      if (!trimmedGuestName) {
        setError('Please enter your full name so we can personalize your booking.');
        return;
      }
      if (!USERNAME_PATTERN.test(trimmedGuestName)) {
        setError(USERNAME_RULE_MESSAGE);
        return;
      }
      if (!EMAIL_PATTERN.test(guestEmail.trim())) {
        setError('Please enter a valid email address so we can send your booking details.');
        return;
      }
    }
    if (!window.PaystackPop) {
      setError('Payment service is unavailable. Please refresh and try again.');
      return;
    }

    setLoading(true);

    try {
      let booking = pendingBooking;

      if (!booking) {
        const apartmentId = await resolveApartmentId(apartment);
        const bookingRes = await bookingAPI.create({
          apartment_id: apartmentId,
          check_in: checkIn,
          check_out: checkOut,
          guest_name: user ? user.full_name : guestName.trim(),
          guest_email: user ? user.email : guestEmail.trim()
        });
        booking = bookingRes.data;
        setPendingBooking(booking);
      }

      const initRes = await paymentAPI.initialize({
        booking_id: booking.id,
        access_token: booking.access_token
      });

      const popup = new window.PaystackPop();
      popup.resumeTransaction(initRes.data.access_code, {
        onSuccess: function (transaction) {
          (async () => {
            try {
              const verifyRes = await paymentAPI.verify({
                reference: transaction.reference,
                booking_id: booking.id,
                access_token: booking.access_token
              });
              onSuccess(verifyRes.data);
            } catch (err) {
              setError(getApiErrorMessage(err, 'Payment verification failed. Please contact support.'));
            } finally {
              setLoading(false);
            }
          })();
        },
        onCancel: function () {
          setLoading(false);
          setError('Payment was not completed. Your reservation is saved and we will remind you to complete payment.');
        },
        onError: function (paymentError) {
          setLoading(false);
          setError(paymentError?.message || 'Unable to start the Paystack checkout. Please try again.');
        }
      });
    } catch (err) {
      setLoading(false);
      console.error('Booking initialization failed:', err);
      if (err.message === 'DEMO_LISTING_UNAVAILABLE') {
        setError('This demo listing is not available for booking. Please refresh and try again.');
        return;
      }
      setError(getApiErrorMessage(err, 'Failed to initialize booking.'));
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#1E1B18]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#FDFBF7] border border-[#E8DFD5] w-full max-w-lg rounded-3xl p-6 relative shadow-xl my-8">
          <button onClick={onClose} className="absolute top-5 right-5 text-[#8C6D53] hover:text-[#1E1B18]">✕</button>

          <span className="text-xs font-semibold text-[#8C6D53] uppercase">{apartment.city}</span>
          <h3 className="text-2xl font-serif font-bold text-[#1E1B18] mt-1">{apartment.title}</h3>
          <p className="text-xs text-[#8C6D53] mb-6">{apartment.address}</p>

          <div className="space-y-4">
            {user ? (
              <div className="rounded-2xl border border-[#E8DFD5] bg-white p-4 text-xs text-[#8C6D53]">
                Booking as <span className="font-semibold text-[#1E1B18]">{user.full_name}</span>
                {' '}({user.email})
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E8DFD5] bg-white p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53]">No account needed</p>
                  <p className="mt-1 text-xs text-[#8C6D53] leading-relaxed">
                    Enter your details and we will email your complete booking details and transaction slip after payment.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A4535]">Full Name</label>
                  <input
                    type="text"
                    required
                    pattern="[A-Za-z][A-Za-z0-9]*"
                    title={USERNAME_RULE_MESSAGE}
                    value={guestName}
                    onChange={(e) => { setGuestName(e.target.value); setPendingBooking(null); }}
                    placeholder="Your full name"
                    className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
                  />
                  <p className="mt-1 text-[11px] text-[#A08E7E]">
                    Letters and numbers only, starting with a letter. E.g. Timothy, TimothyAkwash, Timothy123.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5A4535]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => { setGuestEmail(e.target.value); setPendingBooking(null); }}
                    placeholder="you@example.com"
                    className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
                  />
                  <p className="mt-1 text-[11px] text-[#A08E7E]">
                    Required. Your booking details and receipt will be sent here.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#5A4535]">Check In</label>
                <input
                  type="date"
                  value={checkIn}
                  min={todayValue}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    setPendingBooking(null);
                  }}
                  className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5A4535]">Number of Nights</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  step="1"
                  value={nightsInput}
                  onChange={(e) => {
                    setNightsInput(e.target.value.replace(/\D/g, ''));
                    setPendingBooking(null);
                  }}
                  placeholder="e.g. 3"
                  className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white border border-[#E8DFD5] px-4 py-3">
              <span className="text-xs font-semibold text-[#5A4535]">Check Out</span>
              <span className="text-sm font-bold text-[#1E1B18]">{checkOut ? formatDate(checkOut) : '—'}</span>
            </div>

            <div className="bg-[#F5F0EB] p-4 rounded-2xl border border-[#E8DFD5] space-y-2 text-sm">
              <div className="flex justify-between text-[#8C6D53]">
                <span>₦{pricePerNight.toLocaleString()} × {nights || 0} night{nights === 1 ? '' : 's'}</span>
                <span>₦{basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#8C6D53]">
                <span>Cleaning Fee</span>
                <span>₦{cleaningFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#8C6D53]">
                <span>Service Fee</span>
                <span>₦{serviceFee.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-[#E8DFD5] flex justify-between font-bold text-[#1E1B18] text-base">
                <span>Total Price</span>
                <span className="text-[#5A4535]">₦{totalAmount.toLocaleString()}</span>
              </div>
              {nights > 0 && (
                <p className="text-[11px] text-[#8C6D53] text-right">
                  {nights} night{nights === 1 ? '' : 's'} · {formatDate(checkIn)} to {formatDate(checkOut)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setRefundOpen(true)}
              className="w-full py-2.5 bg-white hover:bg-[#F5F0EB] text-[#5A4535] text-xs font-semibold rounded-xl border border-[#E8DFD5] transition"
            >
              Read Refund Policies
            </button>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3.5 bg-white hover:bg-[#F5F0EB] text-[#5A4535] font-bold rounded-xl border border-[#E8DFD5] transition disabled:opacity-50"
              >
                Cancel Booking
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 py-3.5 bg-[#5A4535] hover:bg-[#463528] text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Initializing Paystack...' : 'Proceed to Pay'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <RefundPolicyModal isOpen={refundOpen} onClose={() => setRefundOpen(false)} />
    </>
  );
}
