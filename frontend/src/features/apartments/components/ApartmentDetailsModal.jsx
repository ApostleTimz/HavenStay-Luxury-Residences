import React, { useState } from 'react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80';

const formatMoney = (value) => `₦${parseFloat(value || 0).toLocaleString()}`;

export default function ApartmentDetailsModal({ apartment, onClose, onBook }) {
  const images = apartment.images?.length ? apartment.images : [FALLBACK_IMAGE];
  const [activeImage, setActiveImage] = useState(0);
  const amenities = apartment.amenities || [];
  const price = parseFloat(apartment.price_per_night || 0);
  const cleaningFee = parseFloat(apartment.cleaning_fee || 0);
  const serviceFee = parseFloat(apartment.service_fee || 0);

  const stats = [
    { label: 'Bedrooms', value: apartment.bedrooms },
    { label: 'Bathrooms', value: apartment.bathrooms },
    { label: 'Max Guests', value: apartment.max_guests }
  ].filter((stat) => stat.value != null);

  return (
    <div className="fixed inset-0 bg-[#1E1B18]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] border border-[#E8DFD5] w-full max-w-4xl rounded-3xl overflow-hidden relative shadow-xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#FDFBF7]/90 backdrop-blur text-[#5A4535] hover:text-[#1E1B18] border border-[#E8DFD5] shadow-sm"
          aria-label="Close apartment details"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-[#F5F0EB]">
            <div className="h-72 sm:h-96 lg:h-[420px] overflow-hidden">
              <img
                src={images[activeImage] || FALLBACK_IMAGE}
                alt={apartment.title}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                      index === activeImage ? 'border-[#5A4535]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt={`${apartment.title} view ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 flex flex-col">
            <span className="text-xs font-semibold text-[#8C6D53] uppercase tracking-widest">{apartment.city}</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1B18] mt-1">{apartment.title}</h2>
            <p className="text-xs text-[#8C6D53] mt-1">{apartment.address}</p>

            {apartment.host_name && (
              <p className="mt-3 text-xs text-[#8C6D53]">
                Hosted by <span className="font-semibold text-[#5A4535]">{apartment.host_name}</span>
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {stats.map((stat) => (
                <span
                  key={stat.label}
                  className="px-3 py-1.5 rounded-full bg-[#F5F0EB] border border-[#E8DFD5] text-[11px] font-semibold text-[#5A4535]"
                >
                  {stat.value} {stat.label}
                </span>
              ))}
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-bold text-[#1E1B18] mb-1">About this residence</h3>
              <p className="text-sm text-[#5A4535] leading-relaxed whitespace-pre-line">{apartment.description}</p>
            </div>

            {amenities.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-[#1E1B18] mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E8DFD5] text-[11px] text-[#5A4535]"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-5 border-t border-[#E8DFD5]">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-2xl font-bold text-[#1E1B18]">{formatMoney(price)}</span>
                  <span className="text-xs text-[#8C6D53]"> / night</span>
                  <p className="mt-1 text-[11px] text-[#8C6D53]">
                    + {formatMoney(cleaningFee)} cleaning &middot; {formatMoney(serviceFee)} service fee
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onBook}
                className="w-full mt-4 py-3.5 bg-[#5A4535] hover:bg-[#463528] text-white font-bold rounded-xl transition shadow-sm text-sm"
              >
                Book This Residence
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-3 bg-white hover:bg-[#F5F0EB] text-[#5A4535] font-semibold rounded-xl border border-[#E8DFD5] transition text-xs"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
