import React, { useState } from 'react';
import { paymentAPI, getApiErrorMessage } from '../../../services/api';
import RefundPolicyModal from './RefundPolicyModal';

export default function PaymentModal({ booking, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refundOpen, setRefundOpen] = useState(false);
  const totalAmount = parseFloat(booking.total_amount || 0);

const formatDate = (value) => {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00Z`)
    : new Date(value);
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
};

  const handlePayment = async () => {
    setError('');
    if (!window.PaystackPop) {
      setError('Payment service is unavailable. Please refresh and try again.');
      return;
    }

    setLoading(true);

    try {
      const identifiers = {
        booking_id: booking.id,
        access_token: booking.access_token
      };
      const initRes = await paymentAPI.initialize(identifiers);
      const popup = new window.PaystackPop();

      popup.resumeTransaction(initRes.data.access_code, {
        onSuccess: function (transaction) {
          (async () => {
            try {
              const verifyRes = await paymentAPI.verify({
                reference: transaction.reference,
                ...identifiers
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
        },
        onError: function (paymentError) {
          setLoading(false);
          setError(paymentError?.message || 'Unable to start the Paystack checkout. Please try again.');
        }
      });
    } catch (err) {
      setLoading(false);
      setError(getApiErrorMessage(err, 'Unable to initialize payment. Please try again.'));
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#1E1B18]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#FDFBF7] border border-[#E8DFD5] w-full max-w-md rounded-3xl p-6 relative shadow-xl my-8">
          <button onClick={onClose} className="absolute top-5 right-5 text-[#8C6D53] hover:text-[#1E1B18]">✕</button>

          <span className="text-xs font-semibold text-[#8C6D53] uppercase">Complete payment</span>
          <h3 className="text-2xl font-serif font-bold text-[#1E1B18] mt-1">{booking.apartment_title}</h3>
          <p className="text-xs text-[#8C6D53] mb-6">{booking.city}</p>

          <div className="bg-[#F5F0EB] p-4 rounded-2xl border border-[#E8DFD5] space-y-2 text-sm">
            <div className="flex justify-between text-[#8C6D53]">
              <span>Check-in</span>
              <span>{formatDate(booking.check_in)}</span>
            </div>
            <div className="flex justify-between text-[#8C6D53]">
              <span>Check-out</span>
              <span>{formatDate(booking.check_out)}</span>
            </div>
            <div className="flex justify-between text-[#8C6D53]">
              <span>Nights</span>
              <span>{booking.total_nights}</span>
            </div>
            <div className="pt-2 border-t border-[#E8DFD5] flex justify-between font-bold text-[#1E1B18] text-base">
              <span>Total Price</span>
              <span className="text-[#5A4535]">₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRefundOpen(true)}
            className="mt-4 w-full py-2.5 bg-white hover:bg-[#F5F0EB] text-[#5A4535] text-xs font-semibold rounded-xl border border-[#E8DFD5] transition"
          >
            Read Refund Policies
          </button>

          {error && (
            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 bg-white hover:bg-[#F5F0EB] text-[#5A4535] font-bold rounded-xl border border-[#E8DFD5] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="flex-1 py-3.5 bg-[#5A4535] hover:bg-[#463528] text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Initializing Paystack...' : 'Proceed to Pay'}
            </button>
          </div>
        </div>
      </div>

      <RefundPolicyModal isOpen={refundOpen} onClose={() => setRefundOpen(false)} />
    </>
  );
}
