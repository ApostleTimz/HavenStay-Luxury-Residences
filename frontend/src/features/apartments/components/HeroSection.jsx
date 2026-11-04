import React, { useEffect, useState } from 'react';

const HERO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1900&q=80',
    label: 'Lagoon View Suite',
    location: 'Lekki, Lagos',
  },
  {
    src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1900&q=80',
    label: 'Skyline Loft',
    location: 'Victoria Island, Lagos',
  },
  {
    src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1900&q=80',
    label: 'Ikoyi Palm Residence',
    location: 'Ikoyi, Lagos',
  },
  {
    src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1900&q=80',
    label: 'Maitama Garden Apartment',
    location: 'Maitama, Abuja',
  },
  {
    src: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1900&q=80',
    label: 'The Oak Penthouse',
    location: 'Asokoro, Abuja',
  },
  {
    src: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1900&q=80',
    label: 'Marina Residences',
    location: 'Port Harcourt',
  },
];

export default function HeroSection({ selectedCity, setSelectedCity, onSearch }) {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative flex min-h-[600px] items-center overflow-hidden rounded-3xl border border-[#E8DFD5] mb-12 sm:min-h-[640px]">
      <div className="absolute inset-0">
        {HERO_IMAGES.map((image, index) => (
          <img
            key={image.src}
            src={image.src}
            alt={`${image.label} in ${image.location}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              index === activeImage ? 'animate-hero-zoom opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E1B18]/95 via-[#1E1B18]/70 to-[#1E1B18]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18]/80 via-transparent to-[#1E1B18]/20" />
      </div>

      <div className="relative z-10 w-full p-8 md:p-14">
        <div className="max-w-2xl">
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

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                Featured stay
              </p>
              <p className="text-sm font-semibold text-white">{HERO_IMAGES[activeImage].label}</p>
              <p className="text-[11px] text-white/70">{HERO_IMAGES[activeImage].location}</p>
            </div>

            <div className="flex items-center gap-2">
              {HERO_IMAGES.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show ${image.label}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeImage ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="animate-hero-float absolute right-6 top-6 hidden rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-lg backdrop-blur sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
          Guest favourite
        </p>
        <p className="text-sm font-semibold text-white">4.9 / 5 rating</p>
      </div>
    </section>
  );
}
