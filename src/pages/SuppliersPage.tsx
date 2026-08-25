import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Supplier } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';

export const SuppliersPage: React.FC = () => {
  const { canEditMasterData } = useAuth();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    picName: string;
    phone: string;
    email: string;
    address: string;
    status: 'active' | 'inactive';
    notes: string;
  }>({
    code: '',
    name: '',
    picName: '',
    phone: '',
    email: '',
    address: '',
    status: 'active',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return suppliers.filter((item) => {
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.picName.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const matchStatus = filterStatus === 'all' || item.status === filterStatus;

      return matchQuery && matchStatus;
    });
  }, [suppliers, searchQuery, filterStatus]);

  const handleOpenAdd = () => {
    setSelectedSupplier(null);
    setFormErrors({});
    const codeSuffix = String(suppliers.length + 1).padStart(3, '0');
    setFormData({
      code: `SUP-${codeSuffix}`,
      name: '',
      picName: '',
      phone: '',
      email: '',
      address: '',
      status: 'active',
      notes: ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: Supplier) => {
    setSelectedSupplier(item);
    setFormErrors({});
    setFormData({
      code: item.code || '',
      name: item.name,
      picName: item.picName || '',
      phone: item.phone,
      email: item.email || '',
      address: item.address,
      status: item.status || 'active',
      notes: item.notes || ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (item: Supplier) => {
    setSelectedSupplier(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Nama supplier / perusahaan wajib diisi.';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Nomor kontak / WhatsApp supplier wajib diisi.';
    }

    if (!formData.address.trim()) {
      errors.address = 'Alamat kantor / gudang supplier wajib diisi.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier.id, formData);
      } else {
        await addSupplier(formData);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Error saving supplier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedSupplier) {
      await deleteSupplier(selectedSupplier.id);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Data Supplier</h1>
            <p className="text-xs text-slate-500">
              Kelola data distributor mitra, penanggung jawab (PIC), kontak telepon, alamat, dan catatan kerjasama
            </p>
          </div>
        </div>

        {canEditMasterData && (
          <button
            id="add-supplier-button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Supplier</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-supplier-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama toko, PIC, kontak, atau alamat..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Mitra Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Supplier / Perusahaan</th>
                <th className="py-4 px-6">Penanggung Jawab (PIC)</th>
                <th className="py-4 px-6">Kontak WhatsApp</th>
                <th className="py-4 px-6">Alamat Kantor / Gudang</th>
                <th className="py-4 px-6">Catatan Kerjasama</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada supplier mitra yang sesuai</p>
                    <p className="text-[11px] text-slate-400">Coba ubah kata kunci atau tambahkan supplier baru.</p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Supplier Name & Code */}
                    <td className="py-3.5 px-6">
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 uppercase font-mono">
                          {item.code}
                        </span>
                        <p className="font-bold text-slate-900 mt-1">{item.name}</p>
                      </div>
                    </td>

                    {/* PIC */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{item.picName || '-'}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-6">
                      <div className="space-y-0.5">
                        <a
                          href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{item.phone}</span>
                        </a>
                        {item.email && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            <span>{item.email}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-6 max-w-xs">
                      <p className="text-slate-600 truncate flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{item.address}</span>
                      </p>
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-6 max-w-xs">
                      <p className="text-slate-500 text-[11px] truncate">
                        {item.notes || '-'}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      {canEditMasterData && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`edit-supplier-${item.id}`}
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-supplier-${item.id}`}
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Supplier */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedSupplier ? 'Edit Supplier Mitra' : 'Tambah Supplier Baru'}
        subtitle="Data tersimpan di Firestore dan terintegrasi langsung dengan katalog produk"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Supplier <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-supplier-code"
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUP-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perusahaan / Toko Mitra <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-supplier-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                placeholder="PT Segar Alami Sejahtera"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                  formErrors.name ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.name && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama PIC / Penanggung Jawab
              </label>
              <input
                id="form-supplier-pic"
                type="text"
                value={formData.picName}
                onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                placeholder="Ibu Rahmawati"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Kontak / WhatsApp <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-supplier-phone"
                type="text"
                required
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                }}
                placeholder="081399887766"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                  formErrors.phone ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.phone && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Perusahaan (Opsional)
              </label>
              <input
                id="form-supplier-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@segaralami.co.id"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kemitraan</label>
              <select
                id="form-supplier-status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="active">Mitra Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Kantor / Gudang <span className="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                id="form-supplier-address"
                rows={2}
                required
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                }}
                placeholder="Jl. Raya Pesantren No. 45, Cirebon"
                className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                  formErrors.address ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                }`}
              />
              {formErrors.address && (
                <p className="text-[11px] text-rose-500 mt-1">{formErrors.address}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Kerjasama
              </label>
              <input
                id="form-supplier-notes"
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Contoh: Pemasok galon air mineral & susu santriwati, jadwal kirim tiap Senin"
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
              id="submit-supplier-button"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : selectedSupplier ? 'Perbarui Supplier' : 'Simpan Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Supplier"
        message={`Apakah Anda yakin ingin menghapus supplier "${selectedSupplier?.name}"? Data akan dihapus dari Firestore.`}
        confirmText="Ya, Hapus Supplier"
      />
    </div>
  );
};
