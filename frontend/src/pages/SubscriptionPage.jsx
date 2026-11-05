import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getApiErrorMessage, subscriptionAPI } from '../services/api';

export default function SubscriptionPage({ mode = 'subscribe' }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [subscriber, setSubscriber] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadStatus = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await subscriptionAPI.status(token);
      setSubscriber(res.data.subscriber);
    } catch (err) {
      setError(getApiErrorMessage(err, 'This subscription link is invalid or has expired.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const updateSubscription = async (subscribe) => {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const res = token
        ? await (subscribe ? subscriptionAPI.subscribeByToken(token) : subscriptionAPI.unsubscribeByToken(token))
        : await (subscribe
          ? subscriptionAPI.subscribe({ email })
          : subscriptionAPI.unsubscribe({ email }));

      setSubscriber(res.data.subscriber);
      setMessage(res.data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to update your subscription right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  const isSubscribed = Boolean(subscriber?.is_subscribed);
  const primaryIsSubscribe = mode === 'subscribe';
  const alreadyInDesiredState = Boolean(subscriber) && isSubscribed === primaryIsSubscribe;

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <p className="text-sm text-[#8C6D53]">Checking your subscription preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="rounded-3xl border border-[#E8DFD5] bg-[#FDFBF7] p-8 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53]">HavenStay updates</p>
        <h2 className="mt-2 text-3xl font-serif font-bold text-[#1E1B18]">
          {primaryIsSubscribe ? 'Subscribe to updates' : 'Unsubscribe from updates'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#8C6D53]">
          Manage the emails you receive about new residences, seasonal offers, and platform news.
          Booking receipts and payment reminders are transactional and are always delivered.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
            {message}
          </div>
        )}

        {subscriber && (
          <div className="mt-5 rounded-2xl border border-[#E8DFD5] bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53]">Email</p>
                <p className="mt-1 text-sm font-semibold text-[#1E1B18] break-all">{subscriber.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                isSubscribed
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isSubscribed ? 'Subscribed' : 'Unsubscribed'}
              </span>
            </div>
          </div>
        )}

        {!token && (
          <div className="mt-5">
            <label className="text-xs font-semibold text-[#5A4535]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full mt-1 px-3 py-2.5 bg-white border border-[#E8DFD5] rounded-xl text-sm text-[#1E1B18]"
            />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => updateSubscription(primaryIsSubscribe)}
            disabled={submitting || alreadyInDesiredState || (!token && !email.trim())}
            className="flex-1 py-3 bg-[#5A4535] hover:bg-[#463528] text-white font-semibold text-sm rounded-xl transition disabled:opacity-50"
          >
            {submitting
              ? 'Updating...'
              : alreadyInDesiredState
                ? primaryIsSubscribe ? 'You are subscribed' : 'You are unsubscribed'
                : primaryIsSubscribe
                  ? 'Subscribe me to updates'
                  : 'Unsubscribe me from updates'}
          </button>
          {(subscriber || token) && (
            <button
              type="button"
              onClick={() => updateSubscription(!primaryIsSubscribe)}
              disabled={submitting}
              className="flex-1 py-3 bg-white hover:bg-[#F5F0EB] text-[#5A4535] font-semibold text-sm rounded-xl border border-[#E8DFD5] transition disabled:opacity-50"
            >
              {primaryIsSubscribe ? 'Unsubscribe instead' : 'Subscribe instead'}
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#8C6D53]">
          <Link to="/" className="font-semibold text-[#5A4535] underline">Return to HavenStay</Link>
        </p>
      </div>
    </div>
  );
}
