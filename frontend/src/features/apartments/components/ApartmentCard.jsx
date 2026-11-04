import React from 'react';

export default function ApartmentCard({ apartment }) {
  const price = parseFloat(apartment.price_per_night || 0);

  return (
    <div className="bg-white border border-[#E8DFD5] rounded-2xl overflow-hidden hover:shadow-md hover:border-[#D4C3B3] transition flex flex-col group">
      <div className="relative h-56 overflow-hidden bg-[#F5F0EB]">
        <img 
          src={apartment.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80'} 
          alt={apartment.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <span className="absolute top-3 left-3 bg-[#FDFBF7]/90 backdrop-blur text-[#5A4535] text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider border border-[#E8DFD5]">
          {apartment.city}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#1E1B18] group-hover:text-[#5A4535] transition">{apartment.title}</h3>
          <p className="text-xs text-[#8C6D53] mt-1 line-clamp-2 leading-relaxed">{apartment.description}</p>
        </div>

        <div className="mt-5 pt-4 border-t border-[#F0E8DF]">
          <span className="text-xl font-bold text-[#1E1B18]">₦{price.toLocaleString()}</span>
          <span className="text-xs text-[#8C6D53]"> / night</span>
        </div>
      </div>
    </div>
  );
}
