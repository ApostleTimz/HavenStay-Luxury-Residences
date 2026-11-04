import React from 'react';
import HeroSection from '../features/apartments/components/HeroSection';
import ApartmentCard from '../features/apartments/components/ApartmentCard';

export default function ExplorePage({ apartments, loading, error, selectedCity, setSelectedCity, onSearch, onSelectApartment }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <HeroSection 
        selectedCity={selectedCity} 
        setSelectedCity={setSelectedCity} 
        onSearch={onSearch} 
      />

      <div id="residences" className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1E1B18]">Curated Residences</h2>
          <p className="text-xs text-[#8C6D53]">Discover exceptional stays across prime locations</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-[#F5F0EB] text-[#5A4535] rounded-full border border-[#E8DFD5]">
          {apartments.length} Available
        </span>
      </div>

      {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {loading ? (
        <p className="py-12 text-center text-sm text-[#8C6D53]">Finding available residences...</p>
      ) : apartments.length === 0 ? (
        <div className="rounded-2xl border border-[#E8DFD5] bg-white p-12 text-center">
          <p className="font-serif text-xl font-bold text-[#1E1B18]">No residences found</p>
          <p className="mt-2 text-sm text-[#8C6D53]">Try another city or clear your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apartments.map((apt) => (
            <ApartmentCard key={apt.id} apartment={apt} onSelect={onSelectApartment} />
          ))}
        </div>
      )}
    </div>
  );
}