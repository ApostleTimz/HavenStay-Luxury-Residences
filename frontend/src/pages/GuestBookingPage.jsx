import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bookingAPI, getApiErrorMessage } from '../services/api';
import PaymentModal from '../features/bookings/components/PaymentModal';
import ReceiptModal from '../features/bookings/components/ReceiptModal';
import RefundPolicyModal from '../features/bookings/components/RefundPolicyModal';

const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString('en-NG', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})}`;

const formatDate = (value) => {
  if (!value) return '—';
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
    ? new Date(`${value.slice(0, 10)}T12:00:00Z`)
    : new Date(value);
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
};

export default function GuestBookingPage() {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadBooking = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await bookingAPI.getGuestBooking(token);
        if (!cancelled) setBooking(res.data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Unable to load this booking link.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBooking();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-sm text-[#8C6D53]">Loading your reservation...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-serif font-bold text-[#1E1B18]">Reservation link unavailable</h2>
        <p className="mt-2 text-sm text-[#8C6D53]">{error || 'This booking link is invalid or has expired.'}</p>
        <Link to="/" className="mt-6 inline-block px-5 py-2.5 bg-[#5A4535] hover:bg-[#463528] text-white text-sm font-semibold rounded-xl transition">
          Browse residences
        </Link>
      </div>
    );
  }

  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';

  const handlePaymentSuccess = (result) => {
    setPaying(false);
    setReceiptResult(result);
    setBooking({ ...booking, status: 'confirmed' });
  };

  return (
    <>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link to="/" className="text-xs font-semibold text-[#8C6D53] hover:text-[#1E1B18] transition">
          ← Back to HavenStay
        </Link>

        <div className="mt-4 rounded-3xl border border-[#E8DFD5] bg-[#FDFBF7] overflow-hidden shadow-sm">
          <div className="bg-[#1E1B18] px-6 py-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-white text-xl font-serif font-bold">HavenStay</p>
              <p className="text-[#E8DFD5] text-[11px] uppercase tracking-widest mt-1">
                {isConfirmed ? 'Confirmed reservation' : isPending ? 'Payment pending' : 'Reservation cancelled'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              isConfirmed
                ? 'bg-emerald-600 text-white'
                : isPending
                  ? 'bg-amber-500 text-white'
                  : 'bg-rose-500 text-white'
            }`}>
              {booking.status}
            </span>
          </div>

          <div className="px-6 py-6 space-y-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53]">Booking reference</p>
              <p className="mt-1 text-sm font-bold text-[#1E1B18] break-all">{String(booking.id).slice(0, 8).toUpperCase()}</p>
            </div>

            <div className="rounded-2xl border border-[#E8DFD5] bg-white p-4">
              <p className="text-sm text-[#1E1B18]">
                Hi <span className="font-semibold">{booking.guest_name || 'Guest'}</span>,
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#8C6D53]">
                {isConfirmed
                  ? 'Your payment has been received. A full transaction slip has been emailed to you.'
                  : isPending
                    ? 'Your reservation is saved but still awaiting payment. Complete payment below to confirm your stay.'
                    : 'This reservation has been cancelled. Contact us if you need help rebooking.'}
              </p>
            </div>

            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53] mb-2">Booking details</h4>
              <div className="rounded-2xl border border-[#E8DFD5] bg-white divide-y divide-[#F0E8DF]">
                <DetailRow label="Apartment" value={booking.apartment_title} />
                <DetailRow label="Address" value={booking.address} />
                <DetailRow label="City" value={booking.city} />
                <DetailRow label="Check-in" value={formatDate(booking.check_in)} />
                <DetailRow label="Check-out" value={formatDate(booking.check_out)} />
                <DetailRow label="Nights" value={booking.total_nights} />
              </div>
            </div>

            <div className="rounded-2xl border border-[#E8DFD5] bg-[#F5F0EB] p-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#8C6D53]">
                <span>Total price</span>
                <span>{formatCurrency(booking.total_amount)}</span>
              </div>
              <div className="pt-2 border-t border-[#E8DFD5] flex justify-between text-base font-bold text-[#1E1B18]">
                <span>{isConfirmed ? 'Amount paid' : 'Amount due'}</span>
                <span className="text-[#5A4535]">{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>

            {isPending && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaying(true)}
                  className="w-full py-3.5 bg-[#5A4535] hover:bg-[#463528] text-white font-bold rounded-xl transition shadow-sm"
                >
                  Proceed to Pay
                </button>
                <button
                  type="button"
                  onClick={() => setRefundOpen(true)}
                  className="w-full py-2.5 bg-white hover:bg-[#F5F0EB] text-[#5A4535] text-xs font-semibold rounded-xl border border-[#E8DFD5] transition"
                >
                  Read Refund Policies
                </button>
              </div>
            )}

            <p className="text-xs text-[#8C6D53] leading-relaxed">
              Need help? Reply to your booking email or contact HavenStay support. Keep this link to return to your booking.
            </p>
          </div>
        </div>
      </div>

      {paying && (
        <PaymentModal
          booking={booking}
          onClose={() => setPaying(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {receiptResult?.receipt && (
        <ReceiptModal
          receipt={receiptResult.receipt}
          emailStatus={receiptResult.email}
          onClose={() => setReceiptResult(null)}
        />
      )}

      <RefundPolicyModal isOpen={refundOpen} onClose={() => setRefundOpen(false)} />
    </>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="text-xs text-[#8C6D53]">{label}</span>
      <span className="text-xs font-semibold text-[#1E1B18] text-right break-words">{value || '—'}</span>
    </div>
  );
}
