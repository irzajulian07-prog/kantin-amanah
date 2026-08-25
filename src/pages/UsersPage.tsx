import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Shield,
  Store,
  UserCheck,
  Check,
  X as XIcon,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User, UserRole, AccountStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';

export const UsersPage: React.FC = () => {
  const { user: currentUser, canManageUsers } = useAuth();
  const { users, addUser, updateUser, deleteUser } = useData();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<{
    displayName: string;
    email: string;
    role: UserRole;
    phoneNumber: string;
    status: AccountStatus;
    photoURL: string;
  }>({
    displayName: '',
    email: '',
    role: 'kasir',
    phoneNumber: '',
    status: 'active',
    photoURL: ''
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchQuery =
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phoneNumber && u.phoneNumber.includes(searchQuery));

      const matchRole = filterRole === 'all' || u.role === filterRole;

      return matchQuery && matchRole;
    });
  }, [users, searchQuery, filterRole]);

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setFormData({
      displayName: '',
      email: '',
      role: 'kasir',
      phoneNumber: '',
      status: 'active',
      photoURL: ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: User) => {
    setSelectedUser(item);
    setFormData({
      displayName: item.displayName,
      email: item.email,
      role: item.role,
      phoneNumber: item.phoneNumber || '',
      status: item.status,
      photoURL: item.photoURL || ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (item: User) => {
    setSelectedUser(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim() || !formData.email.trim()) {
      alert('Nama dan Email wajib diisi.');
      return;
    }

    if (selectedUser) {
      await updateUser(selectedUser.id, formData);
    } else {
      await addUser(formData);
    }
    setIsFormModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      if (selectedUser.id === currentUser?.id) {
        alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
        return;
      }
      await deleteUser(selectedUser.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const roleColors: Record<UserRole, { badge: 'success' | 'indigo' | 'warning'; label: string }> = {
    admin: { badge: 'success', label: 'Administrator' },
    kasir: { badge: 'indigo', label: 'Kasir Kantin' },
    supervisor: { badge: 'warning', label: 'Supervisor / Bendahara' }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna & Role</h1>
            <p className="text-xs text-slate-500">
              Hak akses multi-role sistem kantin: Administrator, Kasir, dan Supervisor
            </p>
          </div>
        </div>

        {canManageUsers && (
          <button
            id="add-user-button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        )}
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Matriks Hak Akses Role (RBAC)</h3>
        <p className="text-xs text-slate-500 mb-4">
          Penetapan izin modul pada sistem AMANAH Smart Mart
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Modul & Fitur</th>
                <th className="py-2.5 px-3 text-center">Admin</th>
                <th className="py-2.5 px-3 text-center">Kasir</th>
                <th className="py-2.5 px-3 text-center">Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-medium">Kelola Master Santriwati & Saldo</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Akses Penuh</td>
                <td className="py-2.5 px-3 text-center text-slate-600">Lihat & Cek Saldo</td>
                <td className="py-2.5 px-3 text-center text-blue-600">Audit & Kelola</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Katalog Produk, Kategori & Stok</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Akses Penuh</td>
                <td className="py-2.5 px-3 text-center text-slate-600">Lihat Stok & Harga</td>
                <td className="py-2.5 px-3 text-center text-blue-600">Audit & Kelola</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Supplier Mitra Pondok</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Akses Penuh</td>
                <td className="py-2.5 px-3 text-center text-slate-600">Lihat Kontak</td>
                <td className="py-2.5 px-3 text-center text-blue-600">Akses Penuh</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Manajemen Pengguna & Role</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">Akses Penuh</td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-semibold">Tidak Ada Akses</td>
                <td className="py-2.5 px-3 text-center text-rose-500 font-semibold">Tidak Ada Akses</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau email pengguna..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="kasir">Kasir</option>
            <option value="supervisor">Supervisor</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Pengguna</th>
                <th className="py-4 px-6">Role Sistem</th>
                <th className="py-4 px-6">Kontak Telepon</th>
                <th className="py-4 px-6">Status Akun</th>
                <th className="py-4 px-6">Terakhir Login</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredUsers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.photoURL ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            item.displayName
                          )}&background=0f172a&color=fff`
                        }
                        alt={item.displayName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900">{item.displayName}</p>
                          {item.id === currentUser?.id && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                              (Anda)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={roleColors[item.role].badge}>
                      {roleColors[item.role].label}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-600">{item.phoneNumber || '-'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={item.status === 'active' ? 'success' : 'neutral'} dot>
                      {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-500 text-[11px]">
                      {item.lastLogin ? new Date(item.lastLogin).toLocaleString('id-ID') : 'Belum pernah'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canManageUsers && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {item.id !== currentUser?.id && (
                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengguna */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedUser ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
        subtitle="Tetapkan hak akses role dan detail akun"
        maxWidth="md"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Petugas *
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Ustadzah Aminah (Kasir)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Email (Akun Login) *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="kasir2@amanah.sch.id"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role & Hak Akses *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white font-semibold"
            >
              <option value="admin">Admin (Hak Akses Penuh Sistem)</option>
              <option value="kasir">Kasir (Operasional Harian Kantin)</option>
              <option value="supervisor">Supervisor (Monitoring & Audit)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor WhatsApp / Telepon
            </label>
            <input
              type="text"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="081234567890"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status Akun</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as AccountStatus })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900 focus:bg-white"
            >
              <option value="active">Aktif (Dapat Login)</option>
              <option value="inactive">Nonaktif (Diblokir)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Simpan Pengguna
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun "${selectedUser?.displayName}"? Pengguna ini tidak akan dapat login lagi.`}
        confirmText="Ya, Hapus Akun"
      />
    </div>
  );
};
