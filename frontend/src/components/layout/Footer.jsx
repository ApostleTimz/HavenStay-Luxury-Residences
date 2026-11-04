import React from 'react';
import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'bulusakwashikitimothy@gmail.com';
const CONTACT_PHONE_DISPLAY = '0814 347 7093';
const CONTACT_PHONE_HREF = '+2348143477093';

export default function Footer() {
  return (
    <footer className="border-t border-[#E8DFD5] bg-[#F5F0EB] mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5A4535] flex items-center justify-center text-white font-serif font-bold text-xl">
              H
            </div>
            <div>
              <span className="block text-xl font-serif font-bold text-[#1E1B18]">HavenStay</span>
              <span className="block text-[10px] tracking-widest text-[#8C6D53] uppercase font-semibold">
                Luxury Residences
              </span>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#8C6D53]">
            Handcrafted shortlet apartments in prime locations, designed for guests who value
            comfort, privacy, and refined living.
          </p>
          <p className="mt-4 text-xs text-[#A08E7E]">
            Serving Lagos, Abuja, and Port Harcourt.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#5A4535]">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#8C6D53]">
            <li>
              <Link to="/" className="hover:text-[#1E1B18] transition">Explore Stays</Link>
            </li>
            <li>
              <Link to="/bookings" className="hover:text-[#1E1B18] transition">My Bookings</Link>
            </li>
            <li>
              <Link to="/" className="hover:text-[#1E1B18] transition">Curated Residences</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#5A4535]">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm text-[#8C6D53]">
            <li>
              <span className="block text-[11px] uppercase tracking-wide text-[#A08E7E]">Email</span>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="break-all font-medium text-[#5A4535] hover:text-[#1E1B18] transition"
              >
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <span className="block text-[11px] uppercase tracking-wide text-[#A08E7E]">Phone</span>
              <a
                href={`tel:${CONTACT_PHONE_HREF}`}
                className="font-medium text-[#5A4535] hover:text-[#1E1B18] transition"
              >
                {CONTACT_PHONE_DISPLAY}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#E8DFD5]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-2 text-xs text-[#A08E7E] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HavenStay Luxury Residences. All rights reserved.</p>
          <p>Secure payments powered by Paystack.</p>
        </div>
      </div>
    </footer>
  );
}
