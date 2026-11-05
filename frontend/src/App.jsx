import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ExplorePage from './pages/ExplorePage';
import MyBookingsPage from './pages/MyBookingsPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import SubscriptionPage from './pages/SubscriptionPage';
import GuestBookingPage from './pages/GuestBookingPage';
import BookingModal from './features/bookings/components/BookingModal';
import PaymentModal from './features/bookings/components/PaymentModal';
import ReceiptModal from './features/bookings/components/ReceiptModal';
import ApartmentDetailsModal from './features/apartments/components/ApartmentDetailsModal';
import AuthModal from './features/auth/components/AuthModal';
import { bookingAPI } from './services/api';
import useAuth from './hooks/useAuth';
import useApartments from './hooks/useApartments';
import useBookings from './hooks/useBookings';

export default function App() {
  const { user, handleAuthSuccess, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [bookingApartment, setBookingApartment] = useState(null);
  const [payingBooking, setPayingBooking] = useState(null);
  const [receiptResult, setReceiptResult] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchCity, setSearchCity] = useState('');

  const { apartments, loading: apartmentsLoading, error: apartmentsError } = useApartments(searchCity);
  const { bookings, loading: bookingsLoading, error: bookingsError, loadBookings } = useBookings(
    Boolean(user && location.pathname === '/bookings')
  );

  const handleSearch = () => {
    setSearchCity(selectedCity);
    if (location.pathname !== '/') navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBookingSuccess = async (result) => {
    setBookingApartment(null);
    setSelectedApartment(null);
    setReceiptResult(result);
    if (user) {
      navigate('/bookings');
      await loadBookings();
    }
  };

  const handleCancelBooking = async (booking) => {
    const confirmed = window.confirm(`Cancel your reservation for ${booking.apartment_title}?`);
    if (!confirmed) return;

    setCancelingId(booking.id);
    try {
      await bookingAPI.cancel(booking.id);
      await loadBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to cancel this booking.');
    } finally {
      setCancelingId(null);
    }
  };

  const handlePaymentSuccess = async (result) => {
    setPayingBooking(null);
    setReceiptResult(result);
    await loadBookings();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <Navbar
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={(
              <ExplorePage
                apartments={apartments}
                loading={apartmentsLoading}
                error={apartmentsError}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                onSearch={handleSearch}
                onSelectApartment={setSelectedApartment}
              />
            )}
          />
          <Route
            path="/bookings"
            element={user
              ? (
                <MyBookingsPage
                  bookings={bookings}
                  loading={bookingsLoading}
                  error={bookingsError}
                  onProceed={setPayingBooking}
                  onCancel={handleCancelBooking}
                  cancelingId={cancelingId}
                />
              )
              : <Navigate to="/" replace />}
          />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/subscribe" element={<SubscriptionPage mode="subscribe" />} />
          <Route path="/unsubscribe" element={<SubscriptionPage mode="unsubscribe" />} />
          <Route path="/guest-booking/:token" element={<GuestBookingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {selectedApartment && (
        <ApartmentDetailsModal
          apartment={selectedApartment}
          onClose={() => setSelectedApartment(null)}
          onBook={() => {
            setBookingApartment(selectedApartment);
            setSelectedApartment(null);
          }}
        />
      )}

      {bookingApartment && (
        <BookingModal
          apartment={bookingApartment}
          user={user}
          onClose={() => setBookingApartment(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {payingBooking && (
        <PaymentModal
          booking={payingBooking}
          onClose={() => setPayingBooking(null)}
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

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
