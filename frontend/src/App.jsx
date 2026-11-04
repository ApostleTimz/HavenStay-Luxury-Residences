import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ExplorePage from './pages/ExplorePage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingModal from './features/bookings/components/BookingModal';
import AuthModal from './features/auth/components/AuthModal';
import useAuth from './hooks/useAuth';
import useApartments from './hooks/useApartments';
import useBookings from './hooks/useBookings';

export default function App() {
  const { user, handleAuthSuccess, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
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

  const handleBookingSuccess = async () => {
    setSelectedApartment(null);
    navigate('/bookings');
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
              ? <MyBookingsPage bookings={bookings} loading={bookingsLoading} error={bookingsError} />
              : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {selectedApartment && (
        <BookingModal
          apartment={selectedApartment}
          user={user}
          onClose={() => setSelectedApartment(null)}
          onSuccess={handleBookingSuccess}
          onRequireAuth={() => setAuthOpen(true)}
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
