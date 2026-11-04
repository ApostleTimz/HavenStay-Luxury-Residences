import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navLinkClass = ({ isActive }) => `text-sm font-medium transition ${
  isActive
    ? 'text-[#5A4535] font-semibold underline underline-offset-8'
    : 'text-[#8C6D53] hover:text-[#1E1B18]'
}`;

export default function Navbar({ user, onOpenAuth, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E8DFD5] px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[#5A4535] flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm group-hover:bg-[#463528] transition">
            H
          </div>
          <div>
            <span className="text-xl font-serif font-bold tracking-tight text-[#1E1B18]">HavenStay</span>
            <span className="block text-[10px] tracking-widest text-[#8C6D53] uppercase font-semibold">Luxury Residences</span>
          </div>
        </button>

        <div className="flex items-center gap-4 md:gap-8">
          <NavLink to="/" end className={navLinkClass}>
            Explore Stays
          </NavLink>

          {user && (
            <NavLink to="/bookings" className={navLinkClass}>
              My Bookings
            </NavLink>
          )}

          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-[#E8DFD5]">
              <div className="hidden text-right sm:block">
                <span className="block text-xs font-semibold text-[#1E1B18]">{user.full_name}</span>
                <span className="block text-[10px] text-[#8C6D53] capitalize">{user.role}</span>
              </div>
              <button
                onClick={onLogout}
                className="px-3.5 py-1.5 text-xs bg-[#F5F0EB] hover:bg-[#EBE2D8] text-[#5A4535] font-medium rounded-lg transition border border-[#E8DFD5]"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-5 py-2.5 bg-[#5A4535] hover:bg-[#463528] text-white font-medium rounded-xl text-sm shadow-sm transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
