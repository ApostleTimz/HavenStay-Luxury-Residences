import React from 'react';

const COMPANY_EMAIL = 'bulusakwashikitimothy@gmail.com';
const COMPANY_PHONE = '0814 347 7093';

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

        <div className="px-6 py-6 space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53]">Receipt reference</p>
            <p className="text-sm font-bold text-[#1E1B18] break-all mt-1">{receipt.reference}</p>
          </div>

          <div className="rounded-2xl border border-[#E8DFD5] bg-white p-4">
            <p className="text-sm text-[#1E1B18]">
              Hi <span className="font-semibold">{receipt.guestName}</span>,
            </p>
            <p className="text-xs text-[#8C6D53] mt-2 leading-relaxed">
              Your payment was successful and your reservation is confirmed. Below are your complete booking details.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53] mb-2">Booking details</h4>
            <div className="rounded-2xl border border-[#E8DFD5] divide-y divide-[#F0E8DF]">
              <DetailRow label="Apartment" value={receipt.apartmentTitle} />
              <DetailRow label="Address" value={receipt.address} />
              <DetailRow label="City" value={receipt.city} />
              <DetailRow label="Check-in" value={formatDate(receipt.checkIn)} />
              <DetailRow label="Check-out" value={formatDate(receipt.checkOut)} />
              <DetailRow label="Nights" value={receipt.nights} />
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53] mb-2">Price breakdown</h4>
            <div className="rounded-2xl border border-[#E8DFD5] bg-[#F5F0EB] p-4 space-y-2 text-sm">
              <PriceRow label="Base price" value={formatCurrency(receipt.basePrice)} />
              <PriceRow label="Cleaning fee" value={formatCurrency(receipt.cleaningFee)} />
              <PriceRow label="Service fee" value={formatCurrency(receipt.serviceFee)} />
              <div className="pt-2 border-t border-[#E8DFD5] flex justify-between text-base font-bold text-[#1E1B18]">
                <span>Total paid</span>
                <span className="text-[#5A4535]">{formatCurrency(receipt.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53] mb-2">Payment details</h4>
            <div className="rounded-2xl border border-[#E8DFD5] divide-y divide-[#F0E8DF]">
              <DetailRow label="Payment method" value="Paystack" />
              <DetailRow label="Transaction reference" value={receipt.reference} />
              <DetailRow label="Paid on" value={formatDateTime(receipt.paidAt)} />
              <DetailRow label="Guest email" value={receipt.guestEmail} />
            </div>
          </div>

          <div className={`rounded-xl border p-3 text-xs leading-relaxed ${emailSent ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            {emailSent
              ? `A copy of this receipt has been emailed to ${receipt.guestEmail}.`
              : `This receipt is confirmed, but the email could not be sent${emailStatus?.reason ? ` (${emailStatus.reason})` : ''}. Keep this copy for your records.`}
          </div>

          <p className="text-xs text-[#8C6D53] leading-relaxed">
            Need help? Contact HavenStay at{' '}
            <a href={`mailto:${COMPANY_EMAIL}`} className="font-semibold text-[#5A4535] underline break-all">{COMPANY_EMAIL}</a>
            {' '}or{' '}
            <a href="tel:+2348143477093" className="font-semibold text-[#5A4535] underline">{COMPANY_PHONE}</a>.
          </p>

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

function PriceRow({ label, value }) {
  return (
    <div className="flex justify-between text-[#8C6D53]">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
