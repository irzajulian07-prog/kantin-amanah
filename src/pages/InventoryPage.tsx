import React, { useState, useMemo } from 'react';
import {
  Package,
  Truck,
  ClipboardList,
  Plus,
  Search,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileText,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  X,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Printer
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Product, Supplier, StockReceipt, StockReceiptItem, StockAdjustment } from '../types';

export const InventoryPage: React.FC = () => {
  const {
    products,
    suppliers,
    categories,
    stockReceipts,
    stockAdjustments,
    createStockReceipt,
    recordStockAdjustment,
    recordBatchStockOpname,
    metrics
  } = useData();

  const { role, user } = useAuth();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<'receipts' | 'opname' | 'history'>('receipts');

  // ==========================================
  // PENERIMAAN BARANG (GOODS RECEIPT) STATE
  // ==========================================
  const [isNewReceiptModalOpen, setIsNewReceiptModalOpen] = useState(false);
  const [receiptSupplierId, setReceiptSupplierId] = useState('');
  const [receiptInvoiceNumber, setReceiptInvoiceNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiptItems, setReceiptItems] = useState<
    Array<{
      productId: string;
      productName: string;
      sku: string;
      quantity: number;
      costPrice: number;
    }>
  >([]);

  // Add Item to Receipt Form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(10);
  const [itemCostPrice, setItemCostPrice] = useState<number>(0);
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState<StockReceipt | null>(null);
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

  // ==========================================
  // STOK OPNAME STATE
  // ==========================================
  const [opnameSearchTerm, setOpnameSearchTerm] = useState('');
  const [opnameCategoryFilter, setOpnameCategoryFilter] = useState('all');
  const [opnameDiscrepancyFilter, setOpnameDiscrepancyFilter] = useState<'all' | 'diff_only' | 'matched'>('all');

  // Physical stock values keyed by productId
  const [physicalStocks, setPhysicalStocks] = useState<Record<string, number>>({});
  const [opnameReasons, setOpnameReasons] = useState<Record<string, string>>({});
  const [isSubmittingOpname, setIsSubmittingOpname] = useState(false);

  // Single Quick Opname Modal
  const [singleOpnameProduct, setSingleOpnameProduct] = useState<Product | null>(null);
  const [singlePhysicalStock, setSinglePhysicalStock] = useState<number>(0);
  const [singleReason, setSingleReason] = useState<string>('Stok opname berkala');
  const [singleNotes, setSingleNotes] = useState<string>('');

  // Selected Product Auto-fill Cost Price for Receipt
  const handleProductSelectForReceipt = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemCostPrice(prod.costPrice || 0);
    }
  };

  const handleAddItemToReceipt = () => {
    if (!selectedProductId) {
      showNotification('warning', 'Pilih Produk', 'Harap pilih produk yang diterima');
      return;
    }
    if (itemQuantity <= 0) {
      showNotification('warning', 'Jumlah Tidak Valid', 'Jumlah barang harus lebih dari 0');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    // Check if already in list
    const existingIndex = receiptItems.findIndex((i) => i.productId === selectedProductId);
    if (existingIndex > -1) {
      const updated = [...receiptItems];
      updated[existingIndex].quantity += itemQuantity;
      updated[existingIndex].costPrice = itemCostPrice;
      setReceiptItems(updated);
    } else {
      setReceiptItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: itemQuantity,
          costPrice: itemCostPrice
        }
      ]);
    }

    // Reset picker
    setSelectedProductId('');
    setItemQuantity(10);
    setItemCostPrice(0);
  };

  const handleRemoveReceiptItem = (index: number) => {
    setReceiptItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const receiptTotalCalculated = useMemo(() => {
    return receiptItems.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  }, [receiptItems]);

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptSupplierId) {
      showNotification('warning', 'Pilih Supplier', 'Harap pilih supplier pengirim barang');
      return;
    }
    if (receiptItems.length === 0) {
      showNotification('warning', 'Daftar Barang Kosong', 'Harap tambahkan minimal 1 item produk');
      return;
    }

    setIsSubmittingReceipt(true);
    try {
      await createStockReceipt({
        supplierId: receiptSupplierId,
        invoiceOrDoNumber: receiptInvoiceNumber || undefined,
        items: receiptItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          costPrice: item.costPrice,
          subtotal: item.quantity * item.costPrice
        })),
        receivedDate: receiptDate,
        notes: receiptNotes
      });

      setIsNewReceiptModalOpen(false);
      setReceiptSupplierId('');
      setReceiptInvoiceNumber('');
      setReceiptNotes('');
      setReceiptItems([]);
    } catch (err: any) {
      showNotification('error', 'Gagal', err.message || 'Gagal menyimpan penerimaan barang');
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  // ==========================================
  // STOK OPNAME HANDLERS
  // ==========================================

  // Filtered Products for Stock Opname
  const filteredOpnameProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(opnameSearchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(opnameSearchTerm.toLowerCase());

      const matchesCat = opnameCategoryFilter === 'all' ? true : p.categoryId === opnameCategoryFilter;

      const enteredPhysical = physicalStocks[p.id];
      const hasEntered = enteredPhysical !== undefined;
      const diff = hasEntered ? enteredPhysical - p.stock : 0;

      const matchesDisc =
        opnameDiscrepancyFilter === 'all'
          ? true
          : opnameDiscrepancyFilter === 'diff_only'
          ? hasEntered && diff !== 0
          : hasEntered && diff === 0;

      return matchesSearch && matchesCat && matchesDisc;
    });
  }, [products, opnameSearchTerm, opnameCategoryFilter, opnameDiscrepancyFilter, physicalStocks]);

  const handlePhysicalStockChange = (productId: string, val: string) => {
    const parsed = val === '' ? 0 : parseInt(val, 10);
    setPhysicalStocks((prev) => ({
      ...prev,
      [productId]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleReasonChange = (productId: string, val: string) => {
    setOpnameReasons((prev) => ({
      ...prev,
      [productId]: val
    }));
  };

  // Initialize physical stock with system stock for easy auditing
  const handleAutoFillSystemStock = () => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      initial[p.id] = p.stock;
    });
    setPhysicalStocks(initial);
    showNotification('info', 'Auto-fill Selesai', 'Nilai stok fisik diisi sesuai stok sistem saat ini');
  };

  // Save Batch Opname
  const handleSaveBatchOpname = async () => {
    const itemsToAdjust: Array<{
      productId: string;
      physicalStock: number;
      reason: string;
      notes?: string;
    }> = [];

    Object.keys(physicalStocks).forEach((prodId) => {
      const prod = products.find((p) => p.id === prodId);
      if (prod) {
        const phys = physicalStocks[prodId];
        // Only include if modified or explicitly set
        if (phys !== prod.stock) {
          itemsToAdjust.push({
            productId: prod.id,
            physicalStock: phys,
            reason: opnameReasons[prod.id] || 'Penyesuaian stok opname fisik',
            notes: 'Batch audit penyesuaian'
          });
        }
      }
    });

    if (itemsToAdjust.length === 0) {
      showNotification('info', 'Tidak Ada Selisih', 'Semua stok fisik yang dimasukkan sama dengan stok sistem');
      return;
    }

    setIsSubmittingOpname(true);
    try {
      await recordBatchStockOpname(itemsToAdjust);
      setPhysicalStocks({});
      setOpnameReasons({});
    } catch (err: any) {
      showNotification('error', 'Gagal', err.message || 'Gagal menyimpan stok opname');
    } finally {
      setIsSubmittingOpname(false);
    }
  };

  // Save Single Quick Opname
  const handleSaveSingleOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleOpnameProduct) return;

    try {
      await recordStockAdjustment({
        productId: singleOpnameProduct.id,
        physicalStock: singlePhysicalStock,
        reason: singleReason,
        notes: singleNotes
      });
      setSingleOpnameProduct(null);
    } catch (err: any) {
      showNotification('error', 'Gagal', err.message || 'Gagal menyimpan opname');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Manajemen Inventori & Stok</h1>
            <p className="text-sm text-slate-500">
              Penerimaan barang masuk dari supplier dan penyesuaian stok fisik (Stok Opname)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewReceiptModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Penerimaan Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Produk</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.totalProducts}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Dalam {categories.length} kategori</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nilai Aset Inventori</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            Rp {metrics.totalInventoryValue.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">Berdasarkan harga pokok beli</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stok Menipis</span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.lowStockProducts}</p>
          <p className="text-xs text-amber-600 font-medium mt-1">Perlu segera order ke supplier</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faktur Penerimaan</span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.totalStockReceipts}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Dari {suppliers.length} supplier mitra</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'receipts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Penerimaan Barang (Barang Masuk)</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
            {stockReceipts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('opname')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'opname'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Stok Opname Fisik</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Riwayat Penyesuaian (Stock Adjustments)</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
            {stockAdjustments.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PENERIMAAN BARANG (STOCK RECEIPTS) */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Riwayat Faktur Penerimaan Barang</h3>
                <p className="text-xs text-slate-500">Semua barang masuk yang tercatat otomatis menambah stok produk</p>
              </div>
              <button
                onClick={() => setIsNewReceiptModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Catat Penerimaan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">No. Penerimaan</th>
                    <th className="px-5 py-3.5">Supplier</th>
                    <th className="px-5 py-3.5">No. Faktur / DO</th>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5">Rincian Item</th>
                    <th className="px-5 py-3.5">Total Biaya (Rp)</th>
                    <th className="px-5 py-3.5">Petugas</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        Belum ada riwayat penerimaan barang.
                      </td>
                    </tr>
                  ) : (
                    stockReceipts.map((rcv) => (
                      <tr key={rcv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">
                          {rcv.receiptNumber}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{rcv.supplierName}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                          {rcv.invoiceOrDoNumber || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {new Date(rcv.receivedDate).toLocaleDateString('id-ID', {
                            dateStyle: 'medium'
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                            {rcv.items.length} item ({rcv.totalItemsCount} unit)
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600">
                          Rp {rcv.totalCost.toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{rcv.receivedByName}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedReceiptDetail(rcv)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail
                          </button>
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

      {/* TAB 2: STOK OPNAME FISIK */}
      {activeTab === 'opname' && (
        <div className="space-y-4">
          {/* Opname Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari SKU atau nama produk..."
                  value={opnameSearchTerm}
                  onChange={(e) => setOpnameSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <select
                value={opnameCategoryFilter}
                onChange={(e) => setOpnameCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={opnameDiscrepancyFilter}
                onChange={(e) => setOpnameDiscrepancyFilter(e.target.value as any)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto"
              >
                <option value="all">Semua Kondisi</option>
                <option value="diff_only">Hanya yang Berselisih</option>
                <option value="matched">Hanya yang Cocok</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <button
                type="button"
                onClick={handleAutoFillSystemStock}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
                title="Isi kolom stok fisik dengan angka stok sistem saat ini"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Auto-fill Stok Sistem
              </button>

              <button
                type="button"
                onClick={handleSaveBatchOpname}
                disabled={isSubmittingOpname}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmittingOpname ? 'Menyimpan...' : 'Simpan Semua Perubahan Opname'}</span>
              </button>
            </div>
          </div>

          {/* Opname Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">SKU & Produk</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5 text-center">Stok Sistem</th>
                    <th className="px-5 py-3.5 text-center">Stok Fisik (Input)</th>
                    <th className="px-5 py-3.5 text-center">Selisih</th>
                    <th className="px-5 py-3.5">Nilai Selisih (Rp)</th>
                    <th className="px-5 py-3.5">Alasan / Catatan Penyesuaian</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOpnameProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                        Tidak ada produk yang cocok dengan pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOpnameProducts.map((prod) => {
                      const enteredPhys =
                        physicalStocks[prod.id] !== undefined ? physicalStocks[prod.id] : prod.stock;
                      const diff = enteredPhys - prod.stock;
                      const valueDiff = diff * prod.costPrice;

                      return (
                        <tr
                          key={prod.id}
                          className={`transition-colors ${
                            diff !== 0 ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900">{prod.name}</p>
                            <p className="text-xs text-slate-400 font-mono">SKU: {prod.sku}</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600">
                            {categories.find((c) => c.id === prod.categoryId)?.name || '-'}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                            {prod.stock} {prod.unit}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <div className="inline-flex items-center justify-center">
                              <input
                                type="number"
                                min={0}
                                value={enteredPhys}
                                onChange={(e) => handlePhysicalStockChange(prod.id, e.target.value)}
                                className={`w-20 px-2 py-1 text-center font-bold text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                                  diff > 0
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 focus:ring-emerald-500/20'
                                    : diff < 0
                                    ? 'bg-rose-50 border-rose-300 text-rose-700 focus:ring-rose-500/20'
                                    : 'bg-white border-slate-200 text-slate-800 focus:ring-blue-500/20'
                                }`}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {diff === 0 ? (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-600">
                                0
                              </span>
                            ) : diff > 0 ? (
                              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center gap-0.5">
                                <TrendingUp className="w-3 h-3" /> +{diff}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-700 flex items-center justify-center gap-0.5">
                                <TrendingDown className="w-3 h-3" /> {diff}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs font-semibold">
                            {valueDiff === 0 ? (
                              <span className="text-slate-400">Rp 0</span>
                            ) : valueDiff > 0 ? (
                              <span className="text-emerald-600 font-bold">
                                +Rp {valueDiff.toLocaleString('id-ID')}
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold">
                                -Rp {Math.abs(valueDiff).toLocaleString('id-ID')}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <input
                              type="text"
                              value={opnameReasons[prod.id] || ''}
                              onChange={(e) => handleReasonChange(prod.id, e.target.value)}
                              placeholder="Misal: Selisih fisik / rusak / kadaluarsa"
                              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setSingleOpnameProduct(prod);
                                setSinglePhysicalStock(enteredPhys);
                                setSingleReason(opnameReasons[prod.id] || 'Stok opname berkala');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              Sesuaikan
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT STOK OPNAME (STOCK ADJUSTMENTS HISTORY) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Riwayat Penyesuaian Stok (Audit Trail)</h3>
                <p className="text-xs text-slate-500">
                  Semua penyesuaian tersimpan pada koleksi <code className="text-blue-600 font-mono">stockAdjustments</code> dan tercatat di audit log.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">No. Opname</th>
                    <th className="px-5 py-3.5">Produk</th>
                    <th className="px-5 py-3.5">Stok Sistem</th>
                    <th className="px-5 py-3.5">Stok Fisik</th>
                    <th className="px-5 py-3.5">Selisih</th>
                    <th className="px-5 py-3.5">Nilai Selisih</th>
                    <th className="px-5 py-3.5">Alasan</th>
                    <th className="px-5 py-3.5">Petugas</th>
                    <th className="px-5 py-3.5">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-10 text-center text-slate-400">
                        Belum ada riwayat penyesuaian stok opname.
                      </td>
                    </tr>
                  ) : (
                    stockAdjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">
                          {adj.adjustmentNumber}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900">{adj.productName}</p>
                          <p className="text-xs text-slate-400 font-mono">SKU: {adj.sku}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">{adj.systemStock}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">{adj.physicalStock}</td>
                        <td className="px-5 py-3.5">
                          {adj.difference > 0 ? (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-100 text-emerald-700">
                              +{adj.difference}
                            </span>
                          ) : adj.difference < 0 ? (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-700">
                              {adj.difference}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-600">
                              0 (Cocok)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold">
                          {adj.totalValueDifference > 0 ? (
                            <span className="text-emerald-600">
                              +Rp {adj.totalValueDifference.toLocaleString('id-ID')}
                            </span>
                          ) : adj.totalValueDifference < 0 ? (
                            <span className="text-rose-600">
                              -Rp {Math.abs(adj.totalValueDifference).toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Rp 0</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                          {adj.reason}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500">{adj.adjustedByName}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">
                          {new Date(adj.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
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

      {/* MODAL: NEW STOCK RECEIPT (PENERIMAAN BARANG) */}
      {isNewReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Form Penerimaan Barang Masuk</h3>
                  <p className="text-xs text-slate-500">Stok produk akan otomatis bertambah saat disimpan</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewReceiptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReceipt} className="p-6 space-y-6">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supplier Pengirim <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={receiptSupplierId}
                    onChange={(e) => setReceiptSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Faktur / DO (Opsional)
                  </label>
                  <input
                    type="text"
                    value={receiptInvoiceNumber}
                    onChange={(e) => setReceiptInvoiceNumber(e.target.value)}
                    placeholder="Contoh: INV-SPL-2025-08"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Penerimaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              {/* Item Adder Row */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tambahkan Produk ke Faktur
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pilih Produk</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelectForReceipt(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">-- Pilih Produk Katalog --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok saat ini: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jumlah Masuk</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Harga Beli Satuan (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={itemCostPrice}
                      onChange={(e) => setItemCostPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToReceipt}
                      className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Daftar Barang Diterima ({receiptItems.length})</label>
                  <span className="text-xs text-slate-500">
                    Total Biaya:{' '}
                    <strong className="text-emerald-600">Rp {receiptTotalCalculated.toLocaleString('id-ID')}</strong>
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                      <tr>
                        <th className="p-2.5">Produk</th>
                        <th className="p-2.5 text-center">Jumlah</th>
                        <th className="p-2.5">Harga Beli</th>
                        <th className="p-2.5">Subtotal</th>
                        <th className="p-2.5 text-right">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receiptItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            Belum ada item barang ditambahkan.
                          </td>
                        </tr>
                      ) : (
                        receiptItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-semibold text-slate-900">
                              {item.productName}
                              <span className="block text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-800">{item.quantity}</td>
                            <td className="p-2.5">Rp {item.costPrice.toLocaleString('id-ID')}</td>
                            <td className="p-2.5 font-bold text-emerald-600">
                              Rp {(item.quantity * item.costPrice).toLocaleString('id-ID')}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveReceiptItem(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Penerimaan</label>
                <input
                  type="text"
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="Misal: Barang diterima kondisi baik dan lengkap"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewReceiptModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReceipt || receiptItems.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingReceipt ? 'Menyimpan...' : 'Simpan Faktur & Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL STOCK RECEIPT */}
      {selectedReceiptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {selectedReceiptDetail.receiptNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Faktur Penerimaan: {selectedReceiptDetail.supplierName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceiptDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-slate-400 block">No Faktur / DO:</span>
                <span className="font-semibold text-slate-800">{selectedReceiptDetail.invoiceOrDoNumber || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tanggal:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedReceiptDetail.receivedDate).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Petugas Penerima:</span>
                <span className="font-semibold text-slate-800">{selectedReceiptDetail.receivedByName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Biaya:</span>
                <span className="font-bold text-emerald-600">
                  Rp {selectedReceiptDetail.totalCost.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Rincian Barang</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">Produk</th>
                      <th className="p-2.5 text-center">Jumlah</th>
                      <th className="p-2.5">Harga Beli</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReceiptDetail.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-semibold text-slate-800">{item.productName}</td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5">Rp {item.costPrice.toLocaleString('id-ID')}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-600">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedReceiptDetail.notes && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg">
                Catatan: "{selectedReceiptDetail.notes}"
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReceiptDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE QUICK OPNAME ADJUSTMENT */}
      {singleOpnameProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Penyesuaian Stok Opname</h3>
                <p className="text-xs text-slate-500 font-mono">SKU: {singleOpnameProduct.sku}</p>
              </div>
              <button
                onClick={() => setSingleOpnameProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleOpname} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Nama Produk:</span>
                  <span className="font-bold text-slate-900">{singleOpnameProduct.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Stok Sistem Saat Ini:</span>
                  <span className="font-bold text-blue-600 text-sm">
                    {singleOpnameProduct.stock} {singleOpnameProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stok Fisik Aktual Hasil Hitung <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={singlePhysicalStock}
                  onChange={(e) => setSinglePhysicalStock(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Selisih:</span>
                  <span
                    className={`font-bold ${
                      singlePhysicalStock - singleOpnameProduct.stock > 0
                        ? 'text-emerald-600'
                        : singlePhysicalStock - singleOpnameProduct.stock < 0
                        ? 'text-rose-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {singlePhysicalStock - singleOpnameProduct.stock >= 0 ? '+' : ''}
                    {singlePhysicalStock - singleOpnameProduct.stock} unit
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penyesuaian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={singleReason}
                  onChange={(e) => setSingleReason(e.target.value)}
                  placeholder="Misal: Hasil stok opname akhir bulan / barang rusak"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={singleNotes}
                  onChange={(e) => setSingleNotes(e.target.value)}
                  placeholder="Catatan tambahan opname"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSingleOpnameProduct(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs"
                >
                  Simpan Stok Fisik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
