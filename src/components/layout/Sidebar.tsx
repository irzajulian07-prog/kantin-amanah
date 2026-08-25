import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Users2,
  Package,
  FolderTree,
  Truck,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Sparkles,
  ChevronRight,
  Database,
  Store,
  Layers,
  X,
  Wallet,
  ClipboardList,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, role, logout, switchRole, canManageUsers } = useAuth();
  const { metrics, isFirebaseActive } = useData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'supervisor']
    },
    {
      to: '/kasir',
      label: 'Kasir & POS RFID',
      icon: CreditCard,
      badge: 'POS',
      badgeVariant: 'highlight',
      roles: ['admin', 'kasir']
    },
    {
      to: '/topup',
      label: 'Top Up Saldo',
      icon: Wallet,
      badge: metrics.pendingTopupsCount > 0 ? `${metrics.pendingTopupsCount} Pending` : undefined,
      badgeVariant: metrics.pendingTopupsCount > 0 ? 'warning' : 'neutral',
      roles: ['admin']
    },
    {
      to: '/santriwati',
      label: 'Santriwati',
      icon: Users2,
      badge: role === 'kasir' ? 'Read-Only' : metrics.totalSantriwati,
      roles: ['admin', 'supervisor', 'kasir']
    },
    {
      to: '/inventory',
      label: 'Inventori & Opname',
      icon: ClipboardList,
      badge: metrics.lowStockProducts > 0 ? `${metrics.lowStockProducts} Menipis` : undefined,
      badgeVariant: metrics.lowStockProducts > 0 ? 'warning' : 'neutral',
      roles: ['admin', 'supervisor']
    },
    {
      to: '/reports',
      label: 'Laporan & Rekap',
      icon: FileSpreadsheet,
      badge: '8 Modul',
      badgeVariant: 'neutral',
      roles: ['admin', 'supervisor']
    },
    {
      to: '/products',
      label: 'Produk & Katalog',
      icon: Package,
      badge: metrics.totalProducts,
      roles: ['admin', 'supervisor']
    },
    {
      to: '/categories',
      label: 'Kategori',
      icon: FolderTree,
      badge: metrics.totalCategories,
      roles: ['admin', 'supervisor']
    },
    {
      to: '/suppliers',
      label: 'Supplier Mitra',
      icon: Truck,
      badge: metrics.totalSuppliers,
      roles: ['admin', 'supervisor']
    },
    {
      to: '/audit-logs',
      label: 'Audit Log & Keamanan',
      icon: ShieldAlert,
      roles: ['admin', 'supervisor']
    },
    {
      to: '/users',
      label: 'Pengguna & Role',
      icon: ShieldCheck,
      badge: metrics.totalUsers,
      roles: ['admin']
    }
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  const roleColors = {
    admin: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    kasir: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    supervisor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#0f172a] text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Section: Brand & Pesantren Header */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-blue-400">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white block">AMANAH</span>
                <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                  Smart Mart System
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Role Badge & Switcher for Testing */}
          <div className="px-5 pt-4">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Role Aktif:</span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    role === 'admin'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : role === 'supervisor'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {role}
                </span>
              </div>

              {/* Quick Switch for Demo */}
              <div className="flex items-center gap-1 pt-1.5 border-t border-slate-700/40">
                <span className="text-[10px] text-slate-400 mr-1 font-medium">Switch:</span>
                <button
                  type="button"
                  onClick={() => switchRole('admin')}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    role === 'admin'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('kasir')}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    role === 'kasir'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Kasir
                </button>
                <button
                  type="button"
                  onClick={() => switchRole('supervisor')}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    role === 'supervisor'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  SPV
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 mt-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Menu Navigasi
            </p>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeVariant === 'warning'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Database Source Info & User Profile */}
        <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
          {/* Single Source of Truth Indicator */}
          <div className="px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className={`w-3.5 h-3.5 ${isFirebaseActive ? 'text-emerald-400' : 'text-blue-400'}`} />
              <span className="text-[11px] text-slate-400 font-medium">Firestore Data</span>
            </div>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isFirebaseActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
              }`}
            >
              {isFirebaseActive ? 'Live Cloud' : 'Active Local'}
            </span>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/40">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-white uppercase text-sm shrink-0">
              {user?.displayName ? user.displayName.slice(0, 2) : 'AM'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {user?.displayName || 'Petugas Kantin'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                {role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors shrink-0"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
