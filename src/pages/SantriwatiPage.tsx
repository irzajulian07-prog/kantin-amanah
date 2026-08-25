import React, { useState, useMemo } from 'react';
import {
  Users2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Building,
  KeyRound,
  History,
  QrCode,
  Radio,
  Power,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Santriwati, SantriStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';
import { ImageUpload } from '../components/common/ImageUpload';
import { hashPin, formatRfidUid } from '../utils/security';

export const SantriwatiPage: React.FC = () => {
  const { role, canEditMasterData } = useAuth();
  const {
    santriwati,
    addSantriwati,
    updateSantriwati,
    deleteSantriwati,
    toggleSantriStatus,
    getTransactionsBySantriId
  } = useData();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDormitory, setFilterDormitory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedSantri, setSelectedSantri] = useState<Santriwati | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nis: string;
    nisn: string;
    name: string;
    classRoom: string;
    dormitory: string;
    rfidUid: string;
    guardianName: string;
    guardianPhone: string;
    balance: number;
    dailyLimit: number;
    status: SantriStatus;
    photoURL: string;
    pin: string; // 6-digit PIN input for hashing
    changePin: boolean;
    resetLock: boolean;
    notes: string;
  }>({
    nis: '',
    nisn: '',
    name: '',
    classRoom: 'Kelas 1 Ula A',
    dormitory: 'Asrama Khadijah',
    rfidUid: '',
    guardianName: '',
    guardianPhone: '',
    balance: 100000,
    dailyLimit: 30000,
    status: 'active',
    photoURL: '',
    pin: '123456',
    changePin: true,
    resetLock: false,
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPin, setShowPin] = useState<boolean>(false);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Filtered List - search by Name, NIS, or RFID UID
  const filteredSantri = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return santriwati.filter((item) => {
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.nis.toLowerCase().includes(q) ||
        (item.rfidUid && item.rfidUid.toLowerCase().includes(q)) ||
        (item.nisn && item.nisn.toLowerCase().includes(q)) ||
        item.dormitory.toLowerCase().includes(q) ||
        item.classRoom.toLowerCase().includes(q);

      const matchDorm =
        filterDormitory === 'all' ||
        item.dormitory.toLowerCase().includes(filterDormitory.toLowerCase());

      const matchStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchQuery && matchDorm && matchStatus;
    });
  }, [santriwati, searchQuery, filterDormitory, filterStatus]);

  const handleOpenAdd = () => {
    setSelectedSantri(null);
    setFormErrors({});
    const newNis = `202401${String(santriwati.length + 1).padStart(3, '0')}`;
    const generatedRfid = `E28068${String(santriwati.length + 100).padStart(6, '0')}`;

    setFormData({
      nis: newNis,
      nisn: '',
      name: '',
      classRoom: 'Kelas 1 Ula A',
      dormitory: 'Asrama Khadijah Lt. 1',
      rfidUid: generatedRfid,
      guardianName: '',
      guardianPhone: '',
      balance: 100000,
      dailyLimit: 30000,
      status: 'active',
      photoURL: '',
      pin: '123456',
      changePin: true,
      resetLock: false,
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: Santriwati) => {
    setSelectedSantri(item);
    setFormErrors({});
    setFormData({
      nis: item.nis,
      nisn: item.nisn || '',
      name: item.name,
      classRoom: item.classRoom,
      dormitory: item.dormitory,
      rfidUid: item.rfidUid || '',
      guardianName: item.guardianName || '',
      guardianPhone: item.guardianPhone || '',
      balance: item.balance,
      dailyLimit: item.dailyLimit,
      status: item.status,
      photoURL: item.photoURL || '',
      pin: '', // left blank unless changing
      changePin: false,
      resetLock: false,
      notes: item.notes || ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (item: Santriwati) => {
    setSelectedSantri(item);
    setIsDetailModalOpen(true);
  };

  const handleOpenHistory = (item: Santriwati) => {
    setSelectedSantri(item);
    setIsHistoryModalOpen(true);
  };

  const handleOpenDelete = (item: Santriwati) => {
    setSelectedSantri(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // Validate Name
    if (!formData.name.trim()) {
      errors.name = 'Nama lengkap santriwati wajib diisi.';
    }

    // Validate NIS (Uniqueness)
    const cleanNis = formData.nis.trim();
    if (!cleanNis) {
      errors.nis = 'NIS wajib diisi.';
    } else {
      const isDuplicateNis = santriwati.some(
        (s) => (!selectedSantri || s.id !== selectedSantri.id) && s.nis.trim().toLowerCase() === cleanNis.toLowerCase()
      );
      if (isDuplicateNis) {
        errors.nis = 'NIS sudah terdaftar untuk santriwati lain. NIS harus unik.';
      }
    }

    // Validate RFID UID (Uniqueness)
    const cleanRfid = formatRfidUid(formData.rfidUid);
    if (!cleanRfid) {
      errors.rfidUid = 'UID RFID wajib diisi untuk otentikasi kartu belanja santriwati.';
    } else {
      const isDuplicateRfid = santriwati.some(
        (s) => (!selectedSantri || s.id !== selectedSantri.id) && s.rfidUid && s.rfidUid.trim().toUpperCase() === cleanRfid
      );
      if (isDuplicateRfid) {
        errors.rfidUid = 'UID RFID sudah digunakan santriwati lain. UID RFID harus unik.';
      }
    }

    // Validate PIN for new records or when changePin is checked
    if (!selectedSantri || formData.changePin) {
      if (!formData.pin || formData.pin.length !== 6 || !/^\d{6}$/.test(formData.pin)) {
        errors.pin = 'PIN keamanan harus terdiri dari tepat 6 digit angka.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      let pinHash = selectedSantri ? selectedSantri.pinHash : '';
      if (!selectedSantri || formData.changePin) {
        pinHash = await hashPin(formData.pin, cleanNis);
      }

      if (selectedSantri) {
        // Update existing santriwati
        const updatePayload: Partial<Santriwati> = {
          nis: cleanNis,
          nisn: formData.nisn.trim() || undefined,
          name: formData.name.trim(),
          classRoom: formData.classRoom,
          dormitory: formData.dormitory,
          rfidUid: cleanRfid,
          guardianName: formData.guardianName.trim() || undefined,
          guardianPhone: formData.guardianPhone.trim() || undefined,
          balance: Number(formData.balance) || 0,
          dailyLimit: Number(formData.dailyLimit) || 30000,
          status: formData.status,
          photoURL: formData.photoURL || undefined,
          barcode: `SNT-${cleanNis}`,
          notes: formData.notes.trim() || undefined,
          ...(formData.changePin ? { pinHash } : {}),
          ...(formData.resetLock ? { pinFailedAttempts: 0, pinLockedUntil: null } : {})
        };

        await updateSantriwati(selectedSantri.id, updatePayload);
      } else {
        // Create new santriwati
        await addSantriwati({
          nis: cleanNis,
          nisn: formData.nisn.trim() || undefined,
          name: formData.name.trim(),
          classRoom: formData.classRoom,
          dormitory: formData.dormitory,
          rfidUid: cleanRfid,
          guardianName: formData.guardianName.trim() || undefined,
          guardianPhone: formData.guardianPhone.trim() || undefined,
          balance: Number(formData.balance) || 0,
          dailyLimit: Number(formData.dailyLimit) || 30000,
          status: formData.status,
          photoURL: formData.photoURL || undefined,
          barcode: `SNT-${cleanNis}`,
          notes: formData.notes.trim() || undefined,
          pinHash,
          pinFailedAttempts: 0,
          pinLockedUntil: null
        });
      }

      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Error saving santriwati:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedSantri) {
      await deleteSantriwati(selectedSantri.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleQuickToggle = async (item: Santriwati) => {
    await toggleSantriStatus(item.id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Data Santriwati</h1>
              {role === 'kasir' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wide">
                  Mode Kasir (Read-Only)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Identitas santriwati, UID RFID unik, keamanan PIN, saldo kantin, dan limit harian
            </p>
          </div>
        </div>

        {canEditMasterData && (
          <button
            id="add-santriwati-button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Santriwati</span>
          </button>
        )}
      </div>

      {role === 'kasir' && (
        <div className="flex items-center gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-800 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Akses Kasir Terbatas:</span> Anda memiliki izin membaca data santriwati, mengecek status kartu RFID, saldo, dan limit harian untuk keperluan verifikasi transaksi. Penambahan atau pengeditan data santriwati dibatasi untuk Admin/Supervisor.
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-santriwati-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIS, atau UID RFID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Filter Asrama */}
          <select
            value={filterDormitory}
            onChange={(e) => setFilterDormitory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Asrama</option>
            <option value="khadijah">Asrama Khadijah</option>
            <option value="aisyah">Asrama Aisyah</option>
            <option value="fatimah">Asrama Fatimah</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Santriwati Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Santriwati & RFID</th>
                <th className="py-4 px-6">Kelas & Asrama</th>
                <th className="py-4 px-6">Wali & Kontak</th>
                <th className="py-4 px-6">Saldo Kantin</th>
                <th className="py-4 px-6">Limit Harian</th>
                <th className="py-4 px-6">Status Akun</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSantri.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data santriwati yang cocok</p>
                    <p className="text-[11px] text-slate-400">Coba gunakan kata kunci pencarian atau filter lain.</p>
                  </td>
                </tr>
              ) : (
                filteredSantri.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Santriwati & RFID */}
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            item.photoURL ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              item.name
                            )}&background=e0e7ff&color=2563eb`
                          }
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500 font-mono">NIS: {item.nis}</span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-medium">
                              <Radio className="w-2.5 h-2.5 text-blue-500" />
                              {item.rfidUid}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kelas & Asrama */}
                    <td className="py-3 px-6">
                      <p className="font-semibold text-slate-800">{item.classRoom}</p>
                      <p className="text-[11px] text-slate-500">{item.dormitory}</p>
                    </td>

                    {/* Wali & Kontak */}
                    <td className="py-3 px-6">
                      <p className="font-semibold text-slate-800">{item.guardianName || '-'}</p>
                      {item.guardianPhone ? (
                        <a
                          href={`https://wa.me/${item.guardianPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{item.guardianPhone}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>

                    {/* Saldo Kantin */}
                    <td className="py-3 px-6">
                      <span className="font-bold text-emerald-600">{formatIDR(item.balance || 0)}</span>
                    </td>

                    {/* Limit Harian */}
                    <td className="py-3 px-6">
                      <span className="font-medium text-slate-600">{formatIDR(item.dailyLimit || 30000)}</span>
                    </td>

                    {/* Status Aktif / Nonaktif Toggle */}
                    <td className="py-3 px-6">
                      <button
                        type="button"
                        onClick={() => canEditMasterData && handleQuickToggle(item)}
                        disabled={!canEditMasterData}
                        title={canEditMasterData ? 'Klik untuk toggle status aktif/nonaktif' : undefined}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer'
                        } ${!canEditMasterData ? 'cursor-default' : ''}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{item.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Riwayat Transaksi Placeholder */}
                        <button
                          id={`history-santri-${item.id}`}
                          onClick={() => handleOpenHistory(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Riwayat Transaksi (Tahap 3)"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* View ID Card */}
                        <button
                          id={`detail-santri-${item.id}`}
                          onClick={() => handleOpenDetail(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Lihat Kartu Identitas Santriwati"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEditMasterData && (
                          <>
                            <button
                              id={`edit-santri-${item.id}`}
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Data Santriwati"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-santri-${item.id}`}
                              onClick={() => handleOpenDelete(item)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Santriwati"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Santriwati */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedSantri ? 'Edit Data Santriwati' : 'Tambah Santriwati Baru'}
        subtitle="Data tersimpan di Firestore dan tersinkronisasi otomatis antar modul"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          {/* Photo Upload with Firebase Storage */}
          <div>
            <ImageUpload
              id="santriwati-photo-upload"
              label="Foto Profil Santriwati (Firebase Storage)"
              category="santriwati"
              currentImageURL={formData.photoURL}
              onImageUploaded={(url) => setFormData((prev) => ({ ...prev, photoURL: url }))}
              helperText="Format JPG, PNG atau WebP (Maks. 2MB)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* NIS (Unique) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIS (Nomor Induk Santri) <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-santri-nis"
                type="text"
                required
                value={formData.nis}
                onChange={(e) => {
                  setFormData({ ...formData, nis: e.target.value });
                  if (formErrors.nis) setFormErrors({ ...formErrors, nis: '' });
                }}
                placeholder="202401001"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all ${
                  formErrors.nis ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.nis && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.nis}</p>
              )}
            </div>

            {/* UID RFID (Unique) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                UID Kartu RFID <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  id="form-santri-rfid"
                  type="text"
                  required
                  value={formData.rfidUid}
                  onChange={(e) => {
                    setFormData({ ...formData, rfidUid: formatRfidUid(e.target.value) });
                    if (formErrors.rfidUid) setFormErrors({ ...formErrors, rfidUid: '' });
                  }}
                  placeholder="E28068940001"
                  className={`w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase ${
                    formErrors.rfidUid ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                  }`}
                />
                <Radio className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              {formErrors.rfidUid ? (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.rfidUid}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-0.5">UID chip RFID unik untuk transaksi tap kartu</p>
              )}
            </div>

            {/* Nama Lengkap */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Santriwati <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-santri-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                placeholder="Aisyah Humaira Putri"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                  formErrors.name ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.name && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Kelas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kelas / Tingkat <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-santri-class"
                type="text"
                required
                value={formData.classRoom}
                onChange={(e) => setFormData({ ...formData, classRoom: e.target.value })}
                placeholder="Kelas 3 Ulya (Tahfizh)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Asrama */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asrama & Kamar <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-santri-dorm"
                type="text"
                required
                value={formData.dormitory}
                onChange={(e) => setFormData({ ...formData, dormitory: e.target.value })}
                placeholder="Asrama Khadijah Lt. 2 (Kamar 204)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Saldo Kantin */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Saldo Kantin (IDR)
              </label>
              <input
                id="form-santri-balance"
                type="number"
                min="0"
                step="5000"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Limit Harian */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Limit Belanja Harian (IDR)
              </label>
              <input
                id="form-santri-daily-limit"
                type="number"
                min="5000"
                step="5000"
                value={formData.dailyLimit}
                onChange={(e) => setFormData({ ...formData, dailyLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Status Aktif/Nonaktif */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Santriwati
              </label>
              <select
                id="form-santri-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SantriStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>

            {/* Wali & Kontak */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Wali Santriwati
              </label>
              <input
                id="form-santri-guardian"
                type="text"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                placeholder="Drs. H. Hendra Wijaya"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. HP / WhatsApp Wali Santriwati
              </label>
              <input
                id="form-santri-phone"
                type="text"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                placeholder="081233445566"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Security PIN Section */}
            <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900">Keamanan PIN Transaksi (6 Digit)</h4>
                </div>
                {selectedSantri && (
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.changePin}
                      onChange={(e) => setFormData({ ...formData, changePin: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Ubah / Setel Ulang PIN</span>
                  </label>
                )}
              </div>

              {(!selectedSantri || formData.changePin) && (
                <div>
                  <div className="relative max-w-xs">
                    <input
                      id="form-santri-pin"
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={formData.pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        setFormData({ ...formData, pin: val });
                        if (formErrors.pin) setFormErrors({ ...formErrors, pin: '' });
                      }}
                      placeholder="Contoh: 123456"
                      className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono tracking-widest text-slate-900 focus:ring-2 focus:ring-blue-500 ${
                        formErrors.pin ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      {showPin ? 'Sembunyikan' : 'Lihat'}
                    </button>
                  </div>
                  {formErrors.pin ? (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.pin}</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">
                      PIN disimpan secara aman menggunakan algoritma enkripsi SHA-256 (bukan plaintext).
                    </p>
                  )}
                </div>
              )}

              {selectedSantri && selectedSantri.pinFailedAttempts > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-rose-600 text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Terdeteksi {selectedSantri.pinFailedAttempts} kali kesalahan input PIN</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.resetLock}
                      onChange={(e) => setFormData({ ...formData, resetLock: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Reset Kunci & Percobaan</span>
                  </label>
                </div>
              )}
            </div>

            {/* Catatan Khusus */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Khusus (Alergi / Riwayat Kesehatan)
              </label>
              <textarea
                id="form-santri-notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Contoh: Alergi kacang tanah, santriwati berprestasi..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="submit-santriwati-button"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : selectedSantri ? 'Perbarui Santriwati' : 'Simpan Santriwati'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail ID Card Digital Santriwati */}
      {selectedSantri && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Kartu Identitas Digital Santriwati"
          subtitle="Pondok Pesantren Putri Darul Amanah – AMANAH Smart Mart"
          maxWidth="md"
        >
          <div className="space-y-5">
            {/* Card Graphic */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      selectedSantri.photoURL ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        selectedSantri.name
                      )}&background=2563eb&color=fff`
                    }
                    alt={selectedSantri.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border-2 border-slate-700 shadow shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      Santriwati Amanah Smart Mart
                    </span>
                    <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                      {selectedSantri.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-300 font-mono">NIS: {selectedSantri.nis}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 text-blue-300 rounded text-[10px] font-mono">
                        <Radio className="w-2.5 h-2.5" />
                        {selectedSantri.rfidUid}
                      </span>
                    </div>
                  </div>
                </div>

                <QrCode className="w-10 h-10 text-slate-400" />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Kelas & Asrama</span>
                  <span className="font-semibold text-white">{selectedSantri.classRoom}</span>
                  <span className="block text-[10px] text-slate-300 mt-0.5">{selectedSantri.dormitory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Saldo Kantin</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    {formatIDR(selectedSantri.balance || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional details */}
            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Status Santriwati:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    selectedSantri.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedSantri.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Wali Santriwati:</span>
                <span className="font-semibold">{selectedSantri.guardianName || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Kontak Telepon Wali:</span>
                <span className="font-semibold">{selectedSantri.guardianPhone || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Limit Belanja Harian:</span>
                <span className="font-semibold text-slate-900">{formatIDR(selectedSantri.dailyLimit || 30000)} / hari</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Keamanan PIN:</span>
                <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Terenkripsi SHA-256
                </span>
              </div>
              {selectedSantri.notes && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-0.5">Catatan Khusus:</span>
                  <p className="italic text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                    {selectedSantri.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsHistoryModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Riwayat Transaksi</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Riwayat Transaksi (Langsung dari collection transactions) */}
      {selectedSantri && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Riwayat Transaksi Santriwati: ${selectedSantri.name}`}
          subtitle="Data bersumber langsung dari koleksi transactions Firestore"
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Header Santriwati Summary */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedSantri.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedSantri.name
                    )}&background=2563eb&color=fff`
                  }
                  alt={selectedSantri.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-slate-300 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedSantri.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">NIS: {selectedSantri.nis} • RFID: {selectedSantri.rfidUid}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Saldo Saat Ini</span>
                <p className="text-base font-extrabold text-emerald-600">{formatIDR(selectedSantri.balance || 0)}</p>
              </div>
            </div>

            {/* Transactions List */}
            {(() => {
              const santriTrxList = getTransactionsBySantriId(selectedSantri.id);

              if (santriTrxList.length === 0) {
                return (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">
                      Belum Ada Riwayat Transaksi
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Santriwati ini belum memiliki transaksi belanja di kantin kasir POS AMANAH Smart Mart.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {santriTrxList.map((trx) => (
                    <div
                      key={trx.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {trx.invoiceNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase">
                            {trx.status === 'completed' ? 'Selesai' : trx.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(trx.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="space-y-1 my-2 text-xs">
                        {trx.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 text-[11px]">
                            <span>
                              {item.productName} <span className="text-slate-400">x{item.quantity}</span>
                            </span>
                            <span className="font-semibold text-slate-800 font-mono">
                              {formatIDR(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-[11px] text-slate-500">
                          Kasir: <strong className="text-slate-700">{trx.cashierName}</strong>
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 mr-1.5">Total:</span>
                          <span className="font-extrabold text-blue-600 text-sm font-mono">
                            {formatIDR(trx.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Santriwati"
        message={`Apakah Anda yakin ingin menghapus santriwati ${selectedSantri?.name} (NIS: ${selectedSantri?.nis})? Tindakan ini akan menghapus data dari Firestore dan dicatat pada audit log.`}
        confirmText="Ya, Hapus Santriwati"
      />
    </div>
  );
};
