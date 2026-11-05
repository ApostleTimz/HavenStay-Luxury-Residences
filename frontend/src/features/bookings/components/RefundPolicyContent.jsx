import React from 'react';

export const CONTACT_EMAIL = 'bulusakwashikitimothy@gmail.com';
export const CONTACT_PHONE_DISPLAY = '0814 347 7093';
export const CONTACT_PHONE_HREF = '+2348143477093';

const POLICIES = [
  {
    title: '7 or more days before check-in',
    detail: 'Cancel and receive a full refund of the nightly rate and cleaning fee. A payment processing fee may be deducted.'
  },
  {
    title: '48 hours to 7 days before check-in',
    detail: 'Cancel and receive a 50% refund of the nightly rate. Cleaning and service fees are non-refundable.'
  },
  {
    title: 'Less than 48 hours before check-in',
    detail: 'Bookings are non-refundable. You may contact us to request a date change, subject to availability.'
  },
  {
    title: 'No-show or early checkout',
    detail: 'No-shows and unused nights after check-in are non-refundable.'
  }
];

export default function RefundPolicyContent() {
  return (
    <div className="space-y-5 text-sm text-[#5A4535]">
      <p className="leading-relaxed">
        We want every HavenStay stay to feel effortless. If your plans change, the refund you receive
        depends on how close to your check-in date you cancel.
      </p>

      <div className="rounded-2xl border border-[#E8DFD5] bg-white divide-y divide-[#F0E8DF]">
        {POLICIES.map((policy) => (
          <div key={policy.title} className="p-4">
            <p className="font-semibold text-[#1E1B18]">{policy.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#8C6D53]">{policy.detail}</p>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-[#5A4535]">How refunds are processed</h4>
        <ul className="mt-2 space-y-2 text-xs leading-relaxed text-[#8C6D53] list-disc pl-5">
          <li>Approved refunds are returned through Paystack to the original payment method.</li>
          <li>Refunds typically settle within 5 to 10 business days, depending on your bank.</li>
          <li>Paystack processing fees already incurred may not be refundable.</li>
          <li>Confirmed bookings can only be cancelled by contacting HavenStay support.</li>
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-[#5A4535]">How to request a refund</h4>
        <p className="mt-2 text-xs leading-relaxed text-[#8C6D53]">
          Contact us with your booking reference at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[#5A4535] underline break-all">{CONTACT_EMAIL}</a>
          {' '}or call{' '}
          <a href={`tel:${CONTACT_PHONE_HREF}`} className="font-semibold text-[#5A4535] underline">{CONTACT_PHONE_DISPLAY}</a>.
          We will confirm eligibility and process your request promptly.
        </p>
      </div>

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
        This summary is provided for convenience. The full terms provided at the time of booking
        apply, and HavenStay reserves the right to review requests on a case-by-case basis.
      </p>
    </div>
  );
}
