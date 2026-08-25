import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Lock,
  Mail,
  Shield,
  UserCheck,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, loginAsRole, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('admin@amanah.sch.id');
  const [password, setPassword] = useState<string>('password123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Mohon masukkan alamat email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      showNotification('success', 'Berhasil Masuk', `Selamat datang di sistem AMANAH Smart Mart.`);
      navigate('/');
    } else {
      setErrorMessage(res.message || 'Gagal masuk. Silakan periksa kredensial Anda.');
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    loginAsRole(role);
    showNotification('success', `Masuk sebagai ${role.toUpperCase()}`, `Anda telah masuk dengan role ${role}.`);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-900/40 mb-4 border border-blue-400/30">
            <Store className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            AMANAH <span className="text-blue-400 font-normal">– Smart Mart</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
            Sistem Kantin Digital Pondok Pesantren Putri Darul Amanah
          </p>
        </div>

        {/* Main Login Card */}
        <div className="mt-8 bg-slate-900/90 backdrop-blur-md py-8 px-6 shadow-2xl shadow-black/60 rounded-3xl sm:px-10 border border-slate-800">
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-rose-950/80 border border-rose-800/60 rounded-xl flex items-center gap-3 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email Pengguna
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@amanah.sch.id"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="submit-login-button"
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-950/50 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Roles */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Akses Cepat Pengujian (1-Klik Role Demo):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="demo-admin-button"
                onClick={() => handleQuickDemo('admin')}
                className="flex flex-col items-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white transition-all duration-150 group text-center"
              >
                <Shield className="w-4 h-4 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Admin</span>
                <span className="text-[9px] text-slate-500 group-hover:text-slate-400">Akses Penuh</span>
              </button>

              <button
                type="button"
                id="demo-kasir-button"
                onClick={() => handleQuickDemo('kasir')}
                className="flex flex-col items-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white transition-all duration-150 group text-center"
              >
                <Store className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Kasir</span>
                <span className="text-[9px] text-slate-500 group-hover:text-slate-400">Kantin Harian</span>
              </button>

              <button
                type="button"
                id="demo-spv-button"
                onClick={() => handleQuickDemo('supervisor')}
                className="flex flex-col items-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white transition-all duration-150 group text-center"
              >
                <UserCheck className="w-4 h-4 text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Supervisor</span>
                <span className="text-[9px] text-slate-500 group-hover:text-slate-400">Audit & Cek</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Fondasi Tahap 1 • AMANAH Smart Mart • Single Source of Truth Firestore
        </p>
      </div>
    </div>
  );
};
