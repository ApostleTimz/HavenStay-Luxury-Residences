import React, { useState } from 'react';
import { apartmentAPI, bookingAPI, paymentAPI } from '../../../services/api';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export default function BookingModal({ apartment, user, onClose, onSuccess, onRequireAuth }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [nights, setNights] = useState(1);
  const [loading, setLoading] = useState(false);

  const pricePerNight = parseFloat(apartment.price_per_night || 0);
  const cleaningFee = parseFloat(apartment.cleaning_fee || 0);
  const serviceFee = parseFloat(apartment.service_fee || 0);
  const totalAmount = (pricePerNight * nights) + cleaningFee + serviceFee;

  const handlePayment = async () => {
    if (!user) {
      onClose();
      onRequireAuth();
      return;
    }
    if (!checkIn || !checkOut) {
      alert("Please select your check-in and check-out dates");
      return;
    }
    if (!window.PaystackPop) {
      alert("Payment service is unavailable. Please refresh and try again.");
      return;
    }

    setLoading(true);

    try {
      const apartmentId = await resolveApartmentId(apartment);
      const bookingRes = await bookingAPI.create({
        apartment_id: apartmentId,
        check_in: checkIn,
        check_out: checkOut,
        total_nights: nights
      });

      const booking = bookingRes.data;
      const initRes = await paymentAPI.initialize({ booking_id: booking.id });

      const popup = new window.PaystackPop();
      popup.resumeTransaction(initRes.data.access_code, {
        onSuccess: function (transaction) {
          (async () => {
            try {
              const verifyRes = await paymentAPI.verify({
                reference: transaction.reference,
                booking_id: booking.id
              });
              onSuccess(verifyRes.data);
            } catch (err) {
              alert(err.response?.data?.message || "Payment verification failed. Please contact support.");
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
          alert(paymentError?.message || "Unable to start the Paystack checkout. Please try again.");
        }
      });
    } catch (err) {
      setLoading(false);
      console.error('Booking initialization failed:', err);
      if (err.message === 'DEMO_LISTING_UNAVAILABLE') {
        alert("This demo listing is not available for booking. Please refresh and try again.");
        return;
      }
      alert(err.response?.data?.message || "Failed to initialize booking.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E1B18]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] border border-[#E8DFD5] w-full max-w-lg rounded-3xl p-6 relative shadow-xl">
        <button onClick={onClose} className="absolute top-5 right-5 text-[#8C6D53] hover:text-[#1E1B18]">✕</button>

        <span className="text-xs font-semibold text-[#8C6D53] uppercase">{apartment.city}</span>
        <h3 className="text-2xl font-serif font-bold text-[#1E1B18] mt-1">{apartment.title}</h3>
        <p className="text-xs text-[#8C6D53] mb-6">{apartment.address}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#5A4535]">Check In</label>
              <input 
                type="date" 
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5A4535]">Check Out</label>
              <input 
                type="date" 
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5A4535]">Total Nights</label>
            <input 
              type="number" 
              min="1" 
              value={nights}
              onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
            />
          </div>

          <div className="bg-[#F5F0EB] p-4 rounded-2xl border border-[#E8DFD5] space-y-2 text-sm">
            <div className="flex justify-between text-[#8C6D53]">
              <span>₦{pricePerNight.toLocaleString()} × {nights} nights</span>
              <span>₦{(pricePerNight * nights).toLocaleString()}</span>
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
          </div>

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
  );
}