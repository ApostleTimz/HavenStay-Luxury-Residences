import React, { useState } from 'react';
import { authAPI, getApiErrorMessage } from '../../../services/api';
import GoogleSignInButton from './GoogleSignInButton';

const EMPTY_FORM = { full_name: '', email: '', password: '', phone: '' };
const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;
const USERNAME_RULE_MESSAGE = 'Username must start with a letter and contain only letters and numbers, with no spaces or special characters.';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('signin');
  const [step, setStep] = useState('form');
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setAuthMode('signin');
    setStep('form');
    setForm(EMPTY_FORM);
    setPendingEmail('');
    setVerificationCode('');
    setNotice('');
    setError('');
    setShowPassword(false);
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const completeAuth = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    onAuthSuccess(data.user);
    resetState();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    const fullName = form.full_name.trim();
    if (authMode === 'signup' && !USERNAME_PATTERN.test(fullName)) {
      setError(USERNAME_RULE_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      const email = form.email.trim();
      const res = authMode === 'signup'
        ? await authAPI.signup({ ...form, full_name: fullName, email })
        : await authAPI.signin({ email, password: form.password });

      if (res.data.verificationRequired) {
        setPendingEmail(res.data.email || email);
        setStep('verify');
        setVerificationCode('');
        setNotice(res.data.message || 'Enter the verification code we sent to your email.');
        return;
      }

      completeAuth(res.data);
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresVerification) {
        setPendingEmail(data.email || form.email.trim());
        setStep('verify');
        setVerificationCode('');
        setNotice(data.message || 'Enter the verification code we sent to your email.');
        return;
      }
      setError(getApiErrorMessage(err, 'Authentication failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await authAPI.googleLogin(credential);
      completeAuth(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Google sign-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyEmail({ email: pendingEmail, code: verificationCode.trim() });
      completeAuth(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verification failed. Please check the code and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      const res = await authAPI.resendVerification({ email: pendingEmail });
      setNotice(res.data.message || 'A new verification code has been sent.');
      setVerificationCode('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to resend the verification code. Please try again.'));
    } finally {
      setResending(false);
    }
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
    setStep('form');
    setError('');
    setNotice('');
    setVerificationCode('');
    setShowPassword(false);
  };

  return (
    <div className="fixed inset-0 bg-[#1E1B18]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] border border-[#E8DFD5] w-full max-w-md rounded-3xl p-6 relative shadow-xl">
        <button onClick={closeModal} className="absolute top-5 right-5 text-[#8C6D53] hover:text-[#1E1B18]">✕</button>

        <h3 className="text-2xl font-serif font-bold text-[#1E1B18] mb-1">
          {step === 'verify' ? 'Verify Your Email' : authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h3>
        <p className="text-xs text-[#8C6D53] mb-6">
          {step === 'verify'
            ? `We sent a 6-digit code to ${pendingEmail}`
            : authMode === 'signin'
              ? 'Sign in to access your luxury reservations'
              : 'Register to book handcrafted shortlet stays'}
        </p>

        {notice && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs rounded-xl">
            {notice}
          </div>
        )}

        {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs rounded-xl">{error}</div>}

        {step === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#5A4535]">Verification Code</label>
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit code"
                className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-center text-lg tracking-[0.5em] font-semibold text-[#1E1B18]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length < 6}
              className="w-full py-3.5 bg-[#5A4535] hover:bg-[#463528] text-white font-bold rounded-xl transition shadow-sm mt-2 disabled:opacity-50 text-sm"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || loading}
              className="w-full py-3 bg-white hover:bg-[#F5F0EB] text-[#5A4535] font-semibold rounded-xl border border-[#E8DFD5] transition text-xs disabled:opacity-50"
            >
              {resending ? 'Sending a new code...' : 'Resend Code'}
            </button>

            <p className="text-center text-xs text-[#8C6D53]">
              Wrong email?{' '}
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setError('');
                  setNotice('');
                  setVerificationCode('');
                }}
                className="text-[#5A4535] font-semibold underline"
              >
                Go back
              </button>
            </p>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="text-xs font-semibold text-[#5A4535]">Full Name</label>
                  <input
                    type="text"
                    required
                    pattern="[A-Za-z][A-Za-z0-9]*"
                    title={USERNAME_RULE_MESSAGE}
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
                  />
                  <p className="text-[11px] text-[#A08E7E] mt-1">
                    Letters and numbers only, starting with a letter. E.g. Timothy, TimothyAkwash, Timothy123.
                  </p>
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
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 pr-11 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#8C6D53] hover:text-[#1E1B18]"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <p className="text-[11px] text-[#A08E7E] leading-relaxed">
                  We will email you a 6-digit code. Your account is only activated after you enter it.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#5A4535] hover:bg-[#463528] text-white font-bold rounded-xl transition shadow-sm mt-2 disabled:opacity-50 text-sm"
              >
                {loading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Register Account'}
              </button>
            </form>

            <div className="flex items-center gap-3 mt-5">
              <span className="h-px flex-1 bg-[#E8DFD5]" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#A08E7E]">or</span>
              <span className="h-px flex-1 bg-[#E8DFD5]" />
            </div>

            <div className="mt-4">
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                onError={setError}
                disabled={loading}
              />
            </div>

            <p className="text-center text-xs text-[#8C6D53] mt-6">
              {authMode === 'signin' ? "Don't have an account? " : 'Already registered? '}
              <button
                onClick={switchAuthMode}
                className="text-[#5A4535] font-semibold underline"
              >
                {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
