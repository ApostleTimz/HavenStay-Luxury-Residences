import React from 'react';
import RefundPolicyContent from './RefundPolicyContent';

export default function RefundPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1E1B18]/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] border border-[#E8DFD5] w-full max-w-lg rounded-3xl shadow-xl my-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#E8DFD5] px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8C6D53]">Before you pay</p>
            <h3 className="mt-1 text-2xl font-serif font-bold text-[#1E1B18]">Refund Policy</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8C6D53] hover:text-[#1E1B18] text-lg leading-none"
            aria-label="Close refund policy"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <RefundPolicyContent />
        </div>

        <div className="border-t border-[#E8DFD5] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[#5A4535] hover:bg-[#463528] text-white font-semibold text-sm rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
