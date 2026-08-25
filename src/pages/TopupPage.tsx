import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Upload,
  QrCode,
  Building2,
  Banknote,
  Eye,
  Settings,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Calendar,
  FileText,
  UserCheck,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Topup, Santriwati } from '../types';

export const TopupPage: React.FC = () => {
  const {
    santriwati,
    topups,
    settings,
    createTopupRequest,
    approveTopup,
    rejectTopup,
    updateSettings,
    metrics
  } = useData();
  const { role, user } = useAuth();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'settings'>('queue');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Modal States
  const [isNewTopupModalOpen, setIsNewTopupModalOpen] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [rejectingTopup, setRejectingTopup] = useState<Topup | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Topup Form State
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [santriSearchInput, setSantriSearchInput] = useState('');
  const [topupAmount, setTopupAmount] = useState<number>(50000);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer' | 'cash'>('qris');
  const [proofImageBase64, setProofImageBase64] = useState<string>('');
  const [topupNotes, setTopupNotes] = useState('');
  const [instantApproveCash, setInstantApproveCash] = useState(true);

  // Settings Edit State
  const [bankName, setBankName] = useState(settings.bankName || 'Dana');
  const [bankAccountName, setBankAccountName] = useState(settings.bankAccountName || 'Vidia Varageta Adinda');
  const [bankAccountNumber, setBankAccountNumber] = useState(settings.bankAccountNumber || '085727799365');
  const [qrisUrlInput, setQrisUrlInput] = useState(settings.qrisUrl || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Quick Amount Presets
  const amountPresets = [10000, 20000, 50000, 100000, 200000, 500000];

  // Selected Santri Details
  const selectedSantri = useMemo(() => {
    return santriwati.find((s) => s.id === selectedSantriId);
  }, [santriwati, selectedSantriId]);

  // Filtered Santriwati for search in modal
  const filteredSantriList = useMemo(() => {
    if (!santriSearchInput.trim()) return santriwati.slice(0, 8);
    const q = santriSearchInput.toLowerCase();
    return santriwati.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.rfidUid.toLowerCase().includes(q)
    );
  }, [santriwati, santriSearchInput]);

  // Filtered Topups
  const filteredTopups = useMemo(() => {
    return topups.filter((t) => {
      const matchesSearch =
        t.topupNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.santriName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.santriNis.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
          ? t.status === 'pending'
          : statusFilter === 'approved'
          ? t.status === 'approved' || t.status === 'success'
          : t.status === 'rejected';

      const matchesMethod = methodFilter === 'all' ? true : t.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [topups, searchTerm, statusFilter, methodFilter]);

  const pendingTopups = useMemo(() => {
    return topups.filter((t) => t.status === 'pending');
  }, [topups]);

  // Handle Proof Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showNotification('error', 'Ukuran Terlalu Besar', 'Maksimal ukuran foto adalah 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setProofImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle QRIS Image Upload for Settings
  const handleQrisSettingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setQrisUrlInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit New Topup Request
  const handleSubmitTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriId) {
      showNotification('warning', 'Pilih Santriwati', 'Harap pilih santriwati tujuan top up');
      return;
    }
    if (topupAmount <= 0) {
      showNotification('warning', 'Nominal Tidak Valid', 'Nominal top up minimal Rp 1.000');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTopup = await createTopupRequest({
        santriId: selectedSantriId,
        amount: topupAmount,
        paymentMethod,
        proofPhotoURL: proofImageBase64 || undefined,
        notes: topupNotes,
        requestedBy: user?.displayName || 'Petugas'
      });

      // If Cash and user is admin/kasir who wants instant approval
      if (paymentMethod === 'cash' && instantApproveCash && (role === 'admin' || role === 'kasir')) {
        await approveTopup(newTopup.id, 'Top up tunai langsung disetujui di kasir');
      }

      setIsNewTopupModalOpen(false);
      resetForm();
    } catch (err: any) {
      showNotification('error', 'Gagal', err.message || 'Gagal memproses top up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSantriId('');
    setSantriSearchInput('');
    setTopupAmount(50000);
    setPaymentMethod('qris');
    setProofImageBase64('');
    setTopupNotes('');
  };

  // Handle Approve Topup
  const handleApprove = async (topupId: string) => {
    try {
      await approveTopup(topupId);
    } catch (err: any) {
      showNotification('error', 'Gagal', err.message || 'Gagal menyetujui top up');
    }
  };

  // Handle Reject Topup
  const handleConfirmReject = async () => {
    if (!rejectingTopup) return;
    try {
      await rejectTopup(rejectingTopup.id, rejectionReason);
      setRejectingTopup(null);
      setRejectionReason('');
    } catch (err: any) {
      showNotification('error', 'Gagal', err.message || 'Gagal menolak top up');
    }
  };

  // Save Payment Settings
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSettings({
        bankName,
        bankAccountName,
        bankAccountNumber,
        qrisUrl: qrisUrlInput
      });
    } catch (err: any) {
      showNotification('error', 'Gagal', 'Gagal menyimpan pengaturan');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Top Up Saldo Santriwati</h1>
            <p className="text-sm text-slate-500">
              Kelola isi ulang saldo via QRIS, Transfer Bank ({settings.bankName || 'Dana'}), dan Tunai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewTopupModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Form Top Up Baru</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menunggu Persetujuan</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.pendingTopupsCount}</p>
          <p className="text-xs text-amber-600 font-medium mt-1">Perlu verifikasi bukti bayar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Top Up Berhasil</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            Rp {metrics.totalTopupsApproved.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Akumulasi saldo masuk</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metode Pembayaran</span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">{settings.bankName || 'Dana'} & QRIS</p>
          <p className="text-xs text-slate-500 font-medium mt-1 truncate">a.n {settings.bankAccountName || 'Pesantren'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Saldo Aktif</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            Rp {metrics.totalSantriBalance.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Dari {metrics.activeSantriwati} santriwati aktif</p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'queue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Antrean Pending</span>
          {pendingTopups.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
              {pendingTopups.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Semua Riwayat Top Up</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
            {topups.length}
          </span>
        </button>

        {role === 'admin' && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Konfigurasi Rekening & QRIS</span>
          </button>
        )}
      </div>

      {/* TAB 1: PENDING QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {pendingTopups.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tidak Ada Antrean Pending</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Semua pengajuan top up saldo santriwati telah diproses. Permohonan baru akan muncul di sini.
              </p>
              <button
                onClick={() => setIsNewTopupModalOpen(true)}
                className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengajuan Top Up</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingTopups.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {item.topupNumber}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-2">{item.santriName}</h4>
                        <p className="text-xs text-slate-500">
                          NIS: {item.santriNis} • Kelas {item.santriClass}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-400 block uppercase">Metode</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase">
                          {item.paymentMethod}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Nominal Top Up:</span>
                      <span className="text-lg font-bold text-emerald-600">
                        Rp {item.amount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Proof preview if available */}
                    {item.proofPhotoURL ? (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> Bukti Pembayaran:
                        </span>
                        <div
                          onClick={() => setSelectedProofUrl(item.proofPhotoURL || null)}
                          className="relative h-32 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-900"
                        >
                          <img
                            src={item.proofPhotoURL}
                            alt="Bukti Transfer"
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold gap-1">
                            <Eye className="w-4 h-4" /> Lihat Foto
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        Tidak melampirkan foto bukti (Tunai / Verifikasi Langsung)
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg">
                        Catatan: "{item.notes}"
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span>Diajukan: {item.requestedBy}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setRejectingTopup(item)}
                      className="flex-1 px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Tolak
                    </button>
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Setujui & Tambah Saldo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL TOPUP HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nomor top up, nama santri, NIS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Disetujui (Approved)</option>
                <option value="rejected">Ditolak (Rejected)</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">Semua Metode</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer Bank</option>
                <option value="cash">Tunai (Cash)</option>
              </select>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">No. Top Up</th>
                    <th className="px-5 py-3.5">Santriwati</th>
                    <th className="px-5 py-3.5">Metode</th>
                    <th className="px-5 py-3.5">Nominal</th>
                    <th className="px-5 py-3.5">Bukti</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Waktu</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTopups.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        Tidak ada riwayat top up yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTopups.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">
                          {item.topupNumber}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{item.santriName}</p>
                          <p className="text-xs text-slate-400">
                            NIS: {item.santriNis} • Kelas {item.santriClass}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 uppercase">
                            {item.paymentMethod}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600">
                          Rp {item.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-3.5">
                          {item.proofPhotoURL ? (
                            <button
                              onClick={() => setSelectedProofUrl(item.proofPhotoURL || null)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {item.status === 'pending' && (
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                              Pending
                            </span>
                          )}
                          {(item.status === 'approved' || item.status === 'success') && (
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Disetujui
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                              Ditolak
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {item.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApprove(item.id)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
                                title="Setujui"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectingTopup(item)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg border border-rose-200"
                                title="Tolak"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {item.approvedByName ? `Oleh ${item.approvedByName}` : 'Selesai'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS CONFIGURATION */}
      {activeTab === 'settings' && role === 'admin' && (
        <div className="max-w-3xl bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Konfigurasi Pembayaran Top Up</h3>
            <p className="text-xs text-slate-500">
              Konfigurasi ini disimpan di Firestore <code className="text-blue-600 font-mono">settings</code> dan otomatis diterapkan di seluruh halaman tanpa hardcode.
            </p>
          </div>

          <form onSubmit={handleSavePaymentSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Bank / E-Wallet
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Contoh: Dana / BCA / Mandiri"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Rekening / No. HP E-Wallet
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Contoh: 085727799365"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Atas Nama Pemilik Rekening
              </label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="Contoh: Vidia Varageta Adinda"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            {/* QRIS Upload / Image */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">
                Gambar / QR Code QRIS Pesantren
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-36 h-36 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                  {qrisUrlInput ? (
                    <img src={qrisUrlInput} alt="QRIS Preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <QrCode className="w-8 h-8 mx-auto mb-1 opacity-50" />
                      <span className="text-[10px]">Belum ada QRIS</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload Foto QRIS Baru</span>
                    <input type="file" accept="image/*" onChange={handleQrisSettingUpload} className="hidden" />
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Format gambar JPG/PNG. Gambar ini akan ditampilkan saat santri atau wali memilih metode bayar QRIS.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Pembayaran'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: FORM TOP UP BARU */}
      {isNewTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Form Pengajuan Top Up Saldo</h3>
                  <p className="text-xs text-slate-500">Isi nominal dan pilih santriwati tujuan</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTopupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTopup} className="p-6 space-y-5">
              {/* 1. Pilih Santriwati */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Pilih Santriwati <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ketik Nama, NIS, atau Scan RFID..."
                      value={santriSearchInput}
                      onChange={(e) => setSantriSearchInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {filteredSantriList.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSantriId(s.id)}
                        className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          selectedSantriId === s.id
                            ? 'bg-blue-50/80 text-blue-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold">{s.name}</p>
                          <p className="text-[11px] text-slate-400">
                            NIS: {s.nis} • {s.classRoom} ({s.dormitory})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600">
                            Rp {(s.balance || 0).toLocaleString('id-ID')}
                          </span>
                          {selectedSantriId === s.id && (
                            <Check className="w-4 h-4 text-blue-600 ml-auto mt-0.5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Nominal Top Up */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Nominal Top Up (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {amountPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTopupAmount(preset)}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-colors ${
                          topupAmount === preset
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset >= 1000000 ? `${preset / 1000000} Jt` : `${preset / 1000}k`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Metode Pembayaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Metode Pembayaran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'qris'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs">QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs">Transfer Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs">Tunai (Cash)</span>
                  </button>
                </div>

                {/* Display Payment Information based on Method */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  {paymentMethod === 'qris' && (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg p-1 shrink-0 flex items-center justify-center">
                        {settings.qrisUrl ? (
                          <img src={settings.qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                        ) : (
                          <QrCode className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-slate-800">Scan QRIS Pesantren</p>
                        <p className="text-slate-500">Mendukung Gopay, OVO, Dana, ShopeePay, BCA, dll.</p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'transfer' && (
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-800">Rekening Tujuan Pembayaran:</p>
                      <p className="text-slate-600">
                        Bank / E-Wallet: <span className="font-bold text-blue-700">{settings.bankName || 'Dana'}</span>
                      </p>
                      <p className="text-slate-600">
                        No. Rekening: <span className="font-mono font-bold text-slate-900">{settings.bankAccountNumber || '085727799365'}</span>
                      </p>
                      <p className="text-slate-600">
                        Atas Nama: <span className="font-semibold text-slate-800">{settings.bankAccountName || 'Vidia Varageta Adinda'}</span>
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span>Uang tunai diserahkan langsung ke petugas kasir / bendahara.</span>
                      {(role === 'admin' || role === 'kasir') && (
                        <label className="flex items-center gap-1.5 font-semibold text-blue-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={instantApproveCash}
                            onChange={(e) => setInstantApproveCash(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Langsung Setujui Saldo</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Upload Bukti Pembayaran */}
              {paymentMethod !== 'cash' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4. Bukti Pembayaran / Struk Transfer
                  </label>
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors text-center">
                      {proofImageBase64 ? (
                        <div className="space-y-2">
                          <img
                            src={proofImageBase64}
                            alt="Bukti"
                            className="max-h-28 rounded-lg mx-auto border border-slate-200 object-contain"
                          />
                          <p className="text-xs text-blue-600 font-semibold">Klik untuk ganti foto bukti</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-700">Upload Foto Bukti Transfer</span>
                          <span className="text-[11px] text-slate-400">Format JPG, PNG (Maks 3MB)</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              {/* 5. Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={topupNotes}
                  onChange={(e) => setTopupNotes(e.target.value)}
                  placeholder="Misal: Kiriman uang saku dari wali santri"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTopupModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSantriId}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Memproses...' : 'Kirim Pengajuan Top Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROOF IMAGE VIEWER */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Bukti Pembayaran / Struk</h3>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-900">
              <img
                src={selectedProofUrl}
                alt="Bukti Transfer Detail"
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-3 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT CONFIRMATION */}
      {rejectingTopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Tolak Permohonan Top Up</h3>
                <p className="text-xs text-slate-500">{rejectingTopup.topupNumber}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Anda akan menolak pengajuan top up sebesar{' '}
              <strong className="text-slate-900">Rp {rejectingTopup.amount.toLocaleString('id-ID')}</strong> untuk{' '}
              <strong className="text-slate-900">{rejectingTopup.santriName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Penolakan <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Bukti transfer buram / dana belum masuk rekening pesantren"
                rows={3}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingTopup(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
