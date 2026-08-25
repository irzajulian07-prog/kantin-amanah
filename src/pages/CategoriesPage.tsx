import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Utensils,
  Coffee,
  Cookie,
  BookOpen,
  Sparkles,
  ShoppingBag,
  Package,
  Layers,
  CheckCircle2,
  Folder,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Category } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';

export const CategoriesPage: React.FC = () => {
  const { canEditMasterData } = useAuth();
  const { categories, products, addCategory, updateCategory, deleteCategory } = useData();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    icon: string;
    description: string;
    status: 'active' | 'inactive';
  }>({
    code: '',
    name: '',
    icon: 'Folder',
    description: '',
    status: 'active'
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const iconOptions = [
    { name: 'Utensils', label: 'Makanan / Kuliner', Icon: Utensils },
    { name: 'Coffee', label: 'Minuman / Susu', Icon: Coffee },
    { name: 'Cookie', label: 'Snack / Camilan', Icon: Cookie },
    { name: 'BookOpen', label: 'ATK & Kitab', Icon: BookOpen },
    { name: 'Sparkles', label: 'Kebersihan & Asrama', Icon: Sparkles },
    { name: 'ShoppingBag', label: 'Toko & Serbaguna', Icon: ShoppingBag },
    { name: 'Folder', label: 'Kategori Umum', Icon: Folder }
  ];

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'Utensils':
        return Utensils;
      case 'Coffee':
        return Coffee;
      case 'Cookie':
        return Cookie;
      case 'BookOpen':
        return BookOpen;
      case 'Sparkles':
        return Sparkles;
      case 'ShoppingBag':
        return ShoppingBag;
      default:
        return Folder;
    }
  };

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (cat) =>
        !q ||
        cat.name.toLowerCase().includes(q) ||
        cat.code.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setFormErrors({});
    setFormData({
      code: `CAT-${String(categories.length + 1).padStart(2, '0')}`,
      name: '',
      icon: 'Utensils',
      description: '',
      status: 'active'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: Category) => {
    setSelectedCategory(item);
    setFormErrors({});
    setFormData({
      code: item.code || '',
      name: item.name,
      icon: item.icon || 'Folder',
      description: item.description || '',
      status: item.status || 'active'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (item: Category) => {
    setSelectedCategory(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Nama kategori wajib diisi.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, formData);
      } else {
        await addCategory(formData);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedCategory) {
      await deleteCategory(selectedCategory.id);
      setIsDeleteDialogOpen(false);
    }
  };

  // Get products count for selected category
  const selectedCatProductCount = selectedCategory
    ? products.filter((p) => p.categoryId === selectedCategory.id).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FolderTree className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Kategori Produk</h1>
            <p className="text-xs text-slate-500">
              Klasifikasi menu kantin, minuman, perlengkapan santriwati, dan pemindahan otomatis saat dihapus
            </p>
          </div>
        </div>

        {canEditMasterData && (
          <button
            id="add-category-button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-category-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau deskripsi kategori..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Total: {filteredCategories.length} Kategori Terdaftar
        </span>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
            <FolderTree className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">Tidak ada kategori ditemukan</p>
            <p className="text-xs text-slate-400 mt-0.5">Coba cari dengan kata kunci lain atau tambahkan kategori baru.</p>
          </div>
        ) : (
          filteredCategories.map((item) => {
            const IconComp = getIconComponent(item.icon);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
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
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {item.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {item.description || 'Tidak ada deskripsi khusus.'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {item.productCount || 0} Produk Terkait
                  </span>

                  {canEditMasterData && (
                    <div className="flex items-center gap-1">
                      <button
                        id={`edit-category-${item.id}`}
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kategori"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        id={`delete-category-${item.id}`}
                        onClick={() => handleOpenDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedCategory ? 'Edit Kategori Produk' : 'Tambah Kategori Baru'}
        subtitle="Data tersimpan di Firestore dan otomatis tersinkronisasi ke katalog produk"
        maxWidth="md"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kode Kategori / Slug <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              id="form-category-code"
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="MAKANAN"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kategori <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              id="form-category-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
              }}
              placeholder="Makanan & Lauk Pauk"
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                formErrors.name ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
              }`}
            />
            {formErrors.name && (
              <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Ikon Visual</label>
            <div className="grid grid-cols-2 gap-2">
              {iconOptions.map((opt) => {
                const Icon = opt.Icon;
                const isSelected = formData.icon === opt.name;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: opt.name })}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Kategori
            </label>
            <textarea
              id="form-category-desc"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Nasi, lauk pauk, makanan pokok harian santri..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status Kategori</label>
            <select
              id="form-category-status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
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
              id="submit-category-button"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : selectedCategory ? 'Perbarui Kategori' : 'Simpan Kategori'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Kategori Produk"
        message={
          selectedCatProductCount > 0
            ? `Kategori "${selectedCategory?.name}" terhubung dengan ${selectedCatProductCount} produk. Jika dihapus, produk tidak akan hilang dan statusnya otomatis diubah menjadi "Tanpa Kategori". Lanjutkan penghapusan?`
            : `Apakah Anda yakin ingin menghapus kategori "${selectedCategory?.name}"?`
        }
        confirmText="Ya, Hapus Kategori"
      />
    </div>
  );
};
