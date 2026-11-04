import { useState } from 'react';

export default function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; }
    catch { return null; }
  });

  const handleAuthSuccess = (userData) => setUser(userData);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, handleAuthSuccess, logout };
}
