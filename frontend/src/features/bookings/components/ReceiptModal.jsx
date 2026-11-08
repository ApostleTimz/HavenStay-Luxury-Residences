import React from 'react';

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

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

export default function ReceiptModal({ receipt, emailStatus, onClose }) {
  if (!receipt) return null;

  const emailSent = Boolean(emailStatus?.sent);

  return (
    <div className="receipt-overlay fixed inset-0 bg-[#1E1B18]/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="receipt-print-area bg-[#FDFBF7] border border-[#E8DFD5] w-full max-w-lg rounded-3xl shadow-xl overflow-hidden my-8">
        <div className="bg-[#1E1B18] px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-white text-xl font-serif font-bold">HavenStay</p>
            <p className="text-[#E8DFD5] text-[11px] uppercase tracking-widest mt-1">Payment receipt</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest">
            Paid
          </span>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="rounded-2xl border border-[#E8DFD5] bg-white p-5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53]">Total paid</p>
            <p className="text-3xl font-serif font-bold text-[#1E1B18] mt-1">{formatCurrency(receipt.totalAmount)}</p>
            <p className="text-[11px] text-[#8C6D53] mt-2 break-all">{receipt.reference}</p>
          </div>

          <div className="rounded-2xl border border-[#E8DFD5] divide-y divide-[#F0E8DF]">
            <DetailRow label="Guest" value={receipt.guestName} />
            <DetailRow label="Apartment" value={receipt.apartmentTitle} />
            <DetailRow label="Booking code" value={receipt.bookingReference} />
            <DetailRow label="Check-in" value={formatDate(receipt.checkIn)} />
            <DetailRow label="Check-out" value={formatDate(receipt.checkOut)} />
            <DetailRow label="Paid on" value={formatDateTime(receipt.paidAt)} />
          </div>

          <div className={`rounded-xl border p-3 text-xs leading-relaxed ${emailSent ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            {emailSent
              ? `Receipt emailed to ${receipt.guestEmail}.`
              : `Receipt confirmed, but the email could not be sent${emailStatus?.reason ? ` (${emailStatus.reason})` : ''}. Keep this copy.`}
          </div>

          <div className="receipt-actions flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white hover:bg-[#F5F0EB] text-[#5A4535] font-semibold text-sm rounded-xl border border-[#E8DFD5] transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-3 bg-[#5A4535] hover:bg-[#463528] text-white font-semibold text-sm rounded-xl transition"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </div>
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

