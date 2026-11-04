import React from 'react';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1900&q=80';

export default function HeroSection({ selectedCity, setSelectedCity, onSearch }) {
  return (
    <section className="relative flex min-h-[600px] items-center overflow-hidden rounded-3xl border border-[#E8DFD5] mb-12 sm:min-h-[640px]">
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Luxury apartment interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E1B18]/95 via-[#1E1B18]/70 to-[#1E1B18]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18]/80 via-transparent to-[#1E1B18]/20" />
      </div>

      <div className="relative z-10 w-full p-8 md:p-14">
        <div className="max-w-2xl">
          <span className="inline-block px-3.5 py-1 bg-white/15 text-white text-xs font-semibold rounded-full uppercase tracking-wider mb-4 border border-white/25 backdrop-blur">
            Curated Shortlet Apartments
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">
            Experience refined living in handcrafted spaces.
          </h1>
          <p className="text-[#E8DFD5] text-base md:text-lg mb-8 leading-relaxed">
            Premium stays designed with natural oak, rich warm tones, and modern luxury amenities for your ultimate comfort.
          </p>

          <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-white/60 flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="Search by city (e.g. Victoria Island, Ikeja, Abuja)..."
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="flex-1 px-4 py-3 bg-transparent text-sm text-[#1E1B18] placeholder-[#B0A193] focus:outline-none"
            />
            <button
              onClick={onSearch}
              className="px-6 py-3 bg-[#5A4535] hover:bg-[#463528] text-white font-semibold text-sm rounded-xl transition"
            >
              Find Apartment
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/80">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              12 curated residences
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Verified hosts
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
              Secure payments
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
