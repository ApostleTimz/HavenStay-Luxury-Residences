import React from 'react';

const STATUS_STYLES = {
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export default function MyBookingsPage({ bookings, loading, error, onProceed, onCancel, cancelingId }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-serif font-bold text-[#1E1B18] mb-2">My Reservations</h2>
      <p className="text-sm text-[#8C6D53] mb-8">Manage and view status for your upcoming and past shortlet stays.</p>

      {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {loading ? (
        <p className="py-12 text-center text-sm text-[#8C6D53]">Loading your reservations...</p>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-[#E8DFD5] p-12 text-center rounded-3xl">
          <p className="text-[#8C6D53] text-sm">No reservations found yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isPending = b.status === 'pending';
            const isCancelling = cancelingId === b.id;

            return (
              <div key={b.id} className="bg-white border border-[#E8DFD5] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div>
                  <h4 className="font-serif font-bold text-xl text-[#1E1B18]">{b.apartment_title}</h4>
                  <p className="text-xs text-[#8C6D53] mt-1">{b.city} • {b.total_nights} Nights</p>
                  <p className="text-[11px] text-[#A08E7E] mt-1">Check-in: {new Date(b.check_in).toLocaleDateString()} | Check-out: {new Date(b.check_out).toLocaleDateString()}</p>
                </div>

                <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-3">
                  <span className={`px-3 py-1 text-[11px] font-semibold rounded-full ${STATUS_STYLES[b.status] || STATUS_STYLES.pending}`}>
                    {b.status.toUpperCase()}
                  </span>
                  <p className="text-xl font-bold text-[#1E1B18]">₦{parseFloat(b.total_amount || 0).toLocaleString()}</p>

                  {isPending && (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => onProceed(b)}
                        disabled={isCancelling}
                        className="flex-1 sm:flex-none px-4 py-2 bg-[#5A4535] hover:bg-[#463528] text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                      >
                        Proceed to Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(b)}
                        disabled={isCancelling}
                        className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-rose-200 transition disabled:opacity-50"
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
