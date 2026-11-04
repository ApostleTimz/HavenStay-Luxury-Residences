import React, { useState } from 'react';
import { authAPI } from '../../../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('signin');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = authMode === 'signup'
        ? await authAPI.signup(form)
        : await authAPI.signin({ email: form.email, password: form.password });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onAuthSuccess(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1E1B18]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] border border-[#E8DFD5] w-full max-w-md rounded-3xl p-6 relative shadow-xl">
        <button onClick={onClose} className="absolute top-5 right-5 text-[#8C6D53] hover:text-[#1E1B18]">✕</button>

        <h3 className="text-2xl font-serif font-bold text-[#1E1B18] mb-1">
          {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h3>
        <p className="text-xs text-[#8C6D53] mb-6">
          {authMode === 'signin' ? 'Sign in to access your luxury reservations' : 'Register to book handcrafted shortlet stays'}
        </p>

        {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-[#5A4535]">Full Name</label>
              <input 
                type="text" 
                required 
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#5A4535]">Email Address</label>
            <input 
              type="email" 
              required 
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5A4535]">Password</label>
            <input 
              type="password" 
              required 
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#5A4535] hover:bg-[#463528] text-white font-bold rounded-xl transition shadow-sm mt-2 disabled:opacity-50 text-sm"
          >
            {loading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <p className="text-center text-xs text-[#8C6D53] mt-6">
          {authMode === 'signin' ? "Don't have an account? " : "Already registered? "}
          <button 
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            className="text-[#5A4535] font-semibold underline"
          >
            {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}