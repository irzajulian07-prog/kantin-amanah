import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Tag,
  Truck,
  Layers,
  ArrowUpDown,
  ShoppingBag,
  Power
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Product, ProductStatus, ProductUnit } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';
import { ImageUpload } from '../components/common/ImageUpload';

export const ProductsPage: React.FC = () => {
  const { role, canEditMasterData } = useAuth();
  const {
    products,
    categories,
    suppliers,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus
  } = useData();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('all');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    sku: string;
    barcode: string;
    name: string;
    categoryId: string;
    supplierId: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    minStock: number;
    unit: ProductUnit;
    status: ProductStatus;
    photoURL: string;
    description: string;
  }>({
    sku: '',
    barcode: '',
    name: '',
    categoryId: categories[0]?.id || '',
    supplierId: suppliers[0]?.id || '',
    costPrice: 5000,
    sellingPrice: 7000,
    stock: 50,
    minStock: 10,
    unit: 'pcs',
    status: 'active',
    photoURL: '',
    description: ''
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((item) => {
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(q));

      const matchCategory =
        filterCategory === 'all' ||
        (filterCategory === 'uncategorized' && (!item.categoryId || item.categoryName === 'Tanpa Kategori')) ||
        item.categoryId === filterCategory;

      const matchSupplier = filterSupplier === 'all' || item.supplierId === filterSupplier;

      let matchStock = true;
      if (filterStockStatus === 'low') {
        matchStock = item.stock <= item.minStock && item.stock > 0;
      } else if (filterStockStatus === 'out') {
        matchStock = item.stock === 0;
      } else if (filterStockStatus === 'available') {
        matchStock = item.stock > item.minStock;
      }

      return matchQuery && matchCategory && matchSupplier && matchStock;
    });
  }, [products, searchQuery, filterCategory, filterSupplier, filterStockStatus]);

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setFormErrors({});
    const skuSuffix = String(products.length + 1).padStart(3, '0');
    setFormData({
      sku: `PRD-${skuSuffix}`,
      barcode: `899100100${skuSuffix}`,
      name: '',
      categoryId: categories[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      costPrice: 5000,
      sellingPrice: 7000,
      stock: 50,
      minStock: 10,
      unit: 'pcs',
      status: 'active',
      photoURL: '',
      description: ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: Product) => {
    setSelectedProduct(item);
    setFormErrors({});
    setFormData({
      sku: item.sku || '',
      barcode: item.barcode || '',
      name: item.name,
      categoryId: item.categoryId || '',
      supplierId: item.supplierId || '',
      costPrice: item.costPrice || 0,
      sellingPrice: item.sellingPrice || 0,
      stock: item.stock || 0,
      minStock: item.minStock || 5,
      unit: item.unit || 'pcs',
      status: item.status || 'active',
      photoURL: item.photoURL || '',
      description: item.description || ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (item: Product) => {
    setSelectedProduct(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Nama produk wajib diisi.';
    }

    if (formData.costPrice < 0) {
      errors.costPrice = 'Harga beli tidak boleh negatif.';
    }

    if (formData.sellingPrice < 0) {
      errors.sellingPrice = 'Harga jual tidak boleh negatif.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, {
          ...formData,
          costPrice: Number(formData.costPrice),
          sellingPrice: Number(formData.sellingPrice),
          stock: Number(formData.stock),
          minStock: Number(formData.minStock)
        });
      } else {
        await addProduct({
          ...formData,
          costPrice: Number(formData.costPrice),
          sellingPrice: Number(formData.sellingPrice),
          stock: Number(formData.stock),
          minStock: Number(formData.minStock)
        });
      }
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      await deleteProduct(selectedProduct.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleQuickToggle = async (item: Product) => {
    await toggleProductStatus(item.id);
  };

  // Profit calculations
  const profitNominal = Number(formData.sellingPrice) - Number(formData.costPrice);
  const profitMarginPercent =
    Number(formData.costPrice) > 0
      ? Math.round((profitNominal / Number(formData.costPrice)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Data Produk</h1>
            <p className="text-xs text-slate-500">
              Katalog produk kantin, penetapan harga beli/jual, kontrol stok, dan upload foto ke Storage
            </p>
          </div>
        </div>

        {canEditMasterData && (
          <button
            id="add-product-button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-product-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk, SKU, barcode..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="uncategorized">Tanpa Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Supplier filter */}
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Stock status filter */}
          <select
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kondisi Stok</option>
            <option value="available">Stok Aman</option>
            <option value="low">Stok Menipis (Di Bawah Min)</option>
            <option value="out">Stok Habis (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Produk</th>
                <th className="py-4 px-6">Kategori</th>
                <th className="py-4 px-6">Harga Beli</th>
                <th className="py-4 px-6">Harga Jual</th>
                <th className="py-4 px-6">Margin Keuntungan</th>
                <th className="py-4 px-6">Sisa Stok</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada produk yang cocok</p>
                    <p className="text-[11px] text-slate-400">Coba ubah kata kunci atau filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const itemProfit = (item.sellingPrice || 0) - (item.costPrice || 0);
                  const itemMargin =
                    item.costPrice > 0 ? Math.round((itemProfit / item.costPrice) * 100) : 0;
                  const isLow = item.stock <= item.minStock && item.stock > 0;
                  const isOut = item.stock === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Photo & SKU */}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.photoURL ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'
                            }
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              SKU: {item.sku || '-'} {item.barcode ? `• ${item.barcode}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            item.categoryName === 'Tanpa Kategori' || !item.categoryId
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.categoryName || 'Tanpa Kategori'}
                        </span>
                        {item.supplierName && item.supplierName !== 'Umum' && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{item.supplierName}</p>
                        )}
                      </td>

                      {/* Harga Beli */}
                      <td className="py-3 px-6">
                        <span className="font-medium text-slate-600">{formatIDR(item.costPrice || 0)}</span>
                      </td>

                      {/* Harga Jual */}
                      <td className="py-3 px-6">
                        <span className="font-bold text-slate-900">{formatIDR(item.sellingPrice || 0)}</span>
                      </td>

                      {/* Margin Keuntungan */}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-emerald-600">+{formatIDR(itemProfit)}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {itemMargin}%
                          </span>
                        </div>
                      </td>

                      {/* Stok */}
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {item.stock} {item.unit}
                          </span>
                          {isOut && (
                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded border border-rose-200">
                              Habis
                            </span>
                          )}
                          {isLow && (
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded border border-amber-200">
                              Menipis
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">Min. {item.minStock} {item.unit}</p>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-6">
                        <button
                          type="button"
                          onClick={() => canEditMasterData && handleQuickToggle(item)}
                          disabled={!canEditMasterData}
                          title={canEditMasterData ? 'Klik untuk toggle status produk' : undefined}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all ${
                            item.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer'
                          } ${!canEditMasterData ? 'cursor-default' : ''}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{item.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-right">
                        {canEditMasterData && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`edit-product-${item.id}`}
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Produk"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-product-${item.id}`}
                              onClick={() => handleOpenDelete(item)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Produk"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Produk */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
        subtitle="Data tersimpan di Firestore dan tersinkronisasi langsung ke kasir & inventori"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          {/* Photo Upload with Firebase Storage */}
          <div>
            <ImageUpload
              id="product-photo-upload"
              label="Foto Produk (Firebase Storage)"
              category="products"
              currentImageURL={formData.photoURL}
              onImageUploaded={(url) => setFormData((prev) => ({ ...prev, photoURL: url }))}
              helperText="Unggah foto produk kantin yang jelas & higienis (Maks. 2MB)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Kode Produk <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-product-sku"
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="PRD-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Barcode Scanner (Opsional)
              </label>
              <input
                id="form-product-barcode"
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="899100100101"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Produk <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-product-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                placeholder="Nasi Goreng Spesial Santri"
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
                Kategori Produk
              </label>
              <select
                id="form-product-category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="">-- Tanpa Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Mitra
              </label>
              <select
                id="form-product-supplier"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="">-- Pemasok Umum / Dapur Internal --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Pokok / Beli (IDR) <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-product-cost"
                type="number"
                min="0"
                step="500"
                required
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Jual Santri (IDR) <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-product-price"
                type="number"
                min="0"
                step="500"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Live Profit Preview Banner */}
            <div className="sm:col-span-2 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
              <span className="text-blue-900 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Estimasi Laba per Satuan:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-950">{formatIDR(profitNominal)}</span>
                <span className="text-[10px] font-extrabold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                  Margin: {profitMarginPercent}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Stok <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-product-stock"
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batas Minimum Stok (Peringatan) <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                id="form-product-min-stock"
                type="number"
                min="1"
                required
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan Produk</label>
              <select
                id="form-product-unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as ProductUnit })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="pcs">pcs (Biji / Buah)</option>
                <option value="pack">pack (Bungkus)</option>
                <option value="botol">botol</option>
                <option value="porsi">porsi</option>
                <option value="box">box</option>
                <option value="sachet">sachet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Produk
              </label>
              <select
                id="form-product-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="active">Aktif (Dijual di Kantin)</option>
                <option value="inactive">Nonaktif (Diarsipkan)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi / Keterangan Produk
              </label>
              <textarea
                id="form-product-desc"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi singkat produk kantin..."
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
              id="submit-product-button"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : selectedProduct ? 'Perbarui Produk' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Produk"
        message={`Apakah Anda yakin ingin menghapus produk "${selectedProduct?.name}" (SKU: ${selectedProduct?.sku})? Data akan dihapus dari Firestore.`}
        confirmText="Ya, Hapus Produk"
      />
    </div>
  );
};
