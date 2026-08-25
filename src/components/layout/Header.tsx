import React, { useState } from 'react';
import { Menu, Bell, Search, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, role, switchRole } = useAuth();
  const { resetToDefaultSeedData } = useData();
  const [searchVal, setSearchVal] = useState('');

  const roleLabel = {
    admin: 'Administrator Utama',
    kasir: 'Petugas Kasir',
    supervisor: 'Supervisor Pondok'
  }[role];

  return (
    <header
      id="main-header"
      className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shadow-2xs"
    >
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            Dashboard Overview
          </h2>
          <span className="bg-green-100 text-green-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block">
            System Live
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Sleek Search Input */}
        <div className="relative hidden md:block">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Cari data sistem..."
            className="bg-slate-100 border-none rounded-lg py-2 pl-9 pr-4 text-xs sm:text-sm w-48 lg:w-60 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400 outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Notification Bell */}
        <button
          className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
          title="Notifikasi Sistem"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        {/* Reset Initial Seed Data Button */}
        <button
          onClick={resetToDefaultSeedData}
          title="Reset data awal pondok untuk pengujian"
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo</span>
        </button>

        {/* Role Quick Selector */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2 hidden sm:inline">Role:</span>
          <select
            value={role}
            onChange={(e) => switchRole(e.target.value as any)}
            className="text-xs font-bold text-slate-800 bg-transparent border-0 focus:ring-0 cursor-pointer py-1 px-1.5 rounded-lg outline-none"
            aria-label="Pilih Role Pengguna"
          >
            <option value="admin">Admin</option>
            <option value="kasir">Kasir</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>
      </div>
    </header>
  );
};
