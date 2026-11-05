import React from 'react';
import { useNavigate } from 'react-router-dom';
import RefundPolicyContent from '../features/bookings/components/RefundPolicyContent';

export default function RefundPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-xs font-semibold text-[#8C6D53] hover:text-[#1E1B18] transition"
      >
        ← Back
      </button>
      <h2 className="mt-4 text-3xl font-serif font-bold text-[#1E1B18]">Refund Policy</h2>
      <p className="mt-1 mb-6 text-sm text-[#8C6D53]">
        Read this before you complete payment. You can still proceed with your payment after reading.
      </p>
      <div className="rounded-3xl border border-[#E8DFD5] bg-[#FDFBF7] p-6">
        <RefundPolicyContent />
      </div>
    </div>
  );
}
