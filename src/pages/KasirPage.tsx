import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CreditCard,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Receipt,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Radio,
  Sparkles,
  ArrowRight,
  ChevronRight,
  UserCheck,
  Building,
  GraduationCap,
  Wallet,
  Clock,
  QrCode,
  Tag,
  Check,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Santriwati, Product, Transaction } from '../types';
import { verifyPin } from '../utils/security';
import { Modal } from '../components/common/Modal';

type PosStep = 'rfid' | 'pin' | 'cart' | 'receipt';

interface CartItem {
  product: Product;
  quantity: number;
}

export const KasirPage: React.FC = () => {
  const {
    santriwati,
    products,
    categories,
    processPosTransaction,
    getSantriByRfid,
    getSantriDailyUsage,
    recordPinFailedAttempt,
    recordPinSuccess,
    unlockSantriPin,
    logAuditAction
  } = useData();

  const { user } = useAuth();
  const { showNotification } = useNotification();

  // POS Workflow State
  const [currentStep, setCurrentStep] = useState<PosStep>('rfid');
  const [rfidInput, setRfidInput] = useState<string>('');
  const [selectedSantri, setSelectedSantri] = useState<Santriwati | null>(null);

  // PIN Verification State
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);
  const [lockCountdown, setLockCountdown] = useState<string>('');

  // Cart & Catalog State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [trxNotes, setTrxNotes] = useState<string>('');
  const [isProcessingTrx, setIsProcessingTrx] = useState<boolean>(false);

  // Receipt Modal State
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Ref for auto-focus
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Auto focus RFID input when step is 'rfid'
  useEffect(() => {
    if (currentStep === 'rfid') {
      setTimeout(() => rfidInputRef.current?.focus(), 150);
    } else if (currentStep === 'pin') {
      setTimeout(() => pinInputRef.current?.focus(), 150);
    }
  }, [currentStep]);

  // Keep fresh santri data if santriwati state changes
  useEffect(() => {
    if (selectedSantri) {
      const fresh = santriwati.find((s) => s.id === selectedSantri.id);
      if (fresh) {
        setSelectedSantri(fresh);
      }
    }
  }, [santriwati]);

  // Lock countdown timer
  useEffect(() => {
    if (!selectedSantri?.pinLockedUntil) {
      setLockCountdown('');
      return;
    }

    const updateRemaining = () => {
      const lockUntil = new Date(selectedSantri.pinLockedUntil!).getTime();
      const now = Date.now();
      const diff = lockUntil - now;

      if (diff <= 0) {
        setLockCountdown('');
      } else {
        const mins = Math.floor(diff / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setLockCountdown(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [selectedSantri?.pinLockedUntil]);

  // Currency Formatter
  const formatIDR = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);

  // 1. RFID LOOKUP HANDLER
  const handleRfidSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanRfid = rfidInput.trim().toUpperCase();

    if (!cleanRfid) {
      showNotification('warning', 'RFID Kosong', 'Tempelkan kartu RFID atau ketik UID kartu santriwati.');
      return;
    }

    const found = getSantriByRfid(cleanRfid);

    if (!found) {
      await logAuditAction(
        'RFID_SCAN',
        'POS',
        `Pindai kartu gagal: Kartu UID "${cleanRfid}" tidak terdaftar di database.`
      );
      showNotification(
        'error',
        'Kartu Tidak Dikenali',
        `UID RFID "${cleanRfid}" tidak terdaftar di database santriwati AMANAH Smart Mart.`
      );
      return;
    }

    // Check if inactive
    if (found.status !== 'active') {
      await logAuditAction(
        'RFID_SCAN',
        'POS',
        `Pindai kartu ditolak: Santriwati ${found.name} (NIS: ${found.nis}) berstatus Nonaktif.`
      );
      showNotification(
        'error',
        'Santriwati Nonaktif',
        `Transaksi DITOLAK: Santriwati ${found.name} (NIS: ${found.nis}) berstatus Nonaktif. Hubungi pengurus asrama.`
      );
      return;
    }

    await logAuditAction(
      'RFID_SCAN',
      'POS',
      `Kartu RFID terbaca: ${found.name} (NIS: ${found.nis}, UID: ${found.rfidUid}). Saldo: Rp ${found.balance.toLocaleString('id-ID')}`
    );

    setSelectedSantri(found);
    setPinInput('');
    setPinError('');
    setCurrentStep('pin');
  };

  // Quick Select Santri (for testing / demo convenience)
  const handleQuickSelectSantri = async (santri: Santriwati) => {
    if (santri.status !== 'active') {
      showNotification(
        'error',
        'Santriwati Nonaktif',
        `Transaksi DITOLAK: Santriwati ${santri.name} berstatus Nonaktif.`
      );
      return;
    }
    await logAuditAction(
      'RFID_SCAN',
      'POS',
      `Pilih cepat santriwati: ${santri.name} (NIS: ${santri.nis}, UID: ${santri.rfidUid})`
    );
    setRfidInput(santri.rfidUid);
    setSelectedSantri(santri);
    setPinInput('');
    setPinError('');
    setCurrentStep('pin');
  };

  // 2. PIN VERIFICATION HANDLER
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSantri) return;

    if (pinInput.length !== 6) {
      setPinError('PIN harus tepat 6 digit angka.');
      return;
    }

    // Check if account is locked
    if (selectedSantri.pinLockedUntil && new Date(selectedSantri.pinLockedUntil) > new Date()) {
      showNotification(
        'error',
        'Kartu Terkunci',
        `Kartu santriwati ${selectedSantri.name} sedang terkunci karena 3x salah PIN. Harap tunggu atau buka gembok.`
      );
      return;
    }

    setIsVerifyingPin(true);
    setPinError('');

    try {
      // Secure verify with salt fallbacks
      const isValid = await verifyPin(
        pinInput,
        selectedSantri.pinHash,
        selectedSantri.nis
      );

      if (isValid) {
        // PIN correct
        await recordPinSuccess(selectedSantri.id);
        await logAuditAction(
          'PIN_VERIFIED',
          'POS',
          `PIN berhasil diverifikasi untuk santriwati ${selectedSantri.name} (NIS: ${selectedSantri.nis}) di kasir.`
        );
        showNotification('success', 'Otentikasi Berhasil', `Selamat datang, ${selectedSantri.name}. Silakan pilih produk belanja.`);
        setCurrentStep('cart');
      } else {
        // PIN wrong
        const result = await recordPinFailedAttempt(selectedSantri.id);
        setPinInput('');
        if (result.isLocked) {
          setPinError('Kartu terkunci selama 15 menit karena 3 kali salah memasukkan PIN.');
        } else {
          setPinError(`PIN salah! Percobaan ${result.failedAttempts} dari 3.`);
        }
      }
    } catch (err: any) {
      console.error('Error verifying PIN:', err);
      setPinError('Terjadi kesalahan saat memverifikasi PIN.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Numpad button click for PIN
  const handleNumpadClick = (num: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + num);
      if (pinError) setPinError('');
    }
  };

  const handleNumpadBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    if (pinError) setPinError('');
  };

  const handleNumpadClear = () => {
    setPinInput('');
    if (pinError) setPinError('');
  };

  // 3. CART OPERATIONS
  const activeAvailableProducts = useMemo(() => {
    return products.filter((p) => p.status === 'active' && p.stock > 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return activeAvailableProducts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()));
      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [activeAvailableProducts, productSearch, selectedCategory]);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart + 1 > product.stock) {
      showNotification(
        'warning',
        'Stok Tidak Cukup',
        `Maksimal stok produk ${product.name} hanya tersisa ${product.stock} ${product.unit}.`
      );
      return;
    }

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart((prev) => [...prev, { product, quantity: 1 }]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stock) {
              showNotification(
                'warning',
                'Batas Stok',
                `Stok hanya tersedia ${item.product.stock} ${item.product.unit}.`
              );
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Cart Calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  }, [cart]);

  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const santriTodayUsage = useMemo(() => {
    return selectedSantri ? getSantriDailyUsage(selectedSantri.id) : 0;
  }, [selectedSantri, getSantriDailyUsage]);

  const santriRemainingLimit = useMemo(() => {
    if (!selectedSantri) return 0;
    return Math.max(0, (selectedSantri.dailyLimit || 30000) - santriTodayUsage);
  }, [selectedSantri, santriTodayUsage]);

  const isBalanceSufficient = selectedSantri ? selectedSantri.balance >= cartTotal : false;
  const isLimitSufficient = selectedSantri ? cartTotal <= santriRemainingLimit : false;
  const canCheckout =
    selectedSantri &&
    cart.length > 0 &&
    isBalanceSufficient &&
    isLimitSufficient &&
    !isProcessingTrx;

  // 4. CHECKOUT / TRANSACTION PROCESSOR
  const handleCheckout = async () => {
    if (!selectedSantri) return;

    if (cart.length === 0) {
      showNotification('warning', 'Keranjang Kosong', 'Pilih minimal satu produk untuk diproses.');
      return;
    }

    if (!isBalanceSufficient) {
      showNotification(
        'error',
        'Saldo Tidak Cukup',
        `Saldo santriwati (${formatIDR(selectedSantri.balance)}) tidak mencukupi untuk total belanja ${formatIDR(cartTotal)}.`
      );
      return;
    }

    if (!isLimitSufficient) {
      showNotification(
        'error',
        'Limit Harian Terlampaui',
        `Total belanja (${formatIDR(cartTotal)}) melebihi sisa limit harian santriwati (${formatIDR(santriRemainingLimit)}).`
      );
      return;
    }

    setIsProcessingTrx(true);

    try {
      const completedTrx = await processPosTransaction({
        santriwati: selectedSantri,
        items: cart,
        notes: trxNotes
      });

      setLastTransaction(completedTrx);
      setShowReceiptModal(true);
      setCurrentStep('receipt');
    } catch (err: any) {
      console.error('POS Checkout error:', err);
    } finally {
      setIsProcessingTrx(false);
    }
  };

  // Reset entire POS for next customer
  const handleResetPos = () => {
    setCurrentStep('rfid');
    setRfidInput('');
    setSelectedSantri(null);
    setPinInput('');
    setPinError('');
    setCart([]);
    setTrxNotes('');
    setProductSearch('');
    setSelectedCategory('all');
    setShowReceiptModal(false);
  };

  // Print Receipt function
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Kasir & POS Smart Mart
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 tracking-wider">
                  RFID + PIN
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Alur Transaksi: Tap RFID → Verifikasi PIN 6-Digit → Pilih Produk → Validasi Saldo/Limit → Bayar & Cetak Struk
              </p>
            </div>
          </div>
        </div>

        {/* Step Flow Indicator */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              currentStep === 'rfid'
                ? 'bg-blue-600 text-white shadow-2xs'
                : selectedSantri
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-400'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>1. RFID</span>
          </div>

          <ChevronRight className="w-3 h-3 text-slate-300" />

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              currentStep === 'pin'
                ? 'bg-blue-600 text-white shadow-2xs'
                : currentStep === 'cart' || currentStep === 'receipt'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-400'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>2. PIN</span>
          </div>

          <ChevronRight className="w-3 h-3 text-slate-300" />

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              currentStep === 'cart'
                ? 'bg-blue-600 text-white shadow-2xs'
                : currentStep === 'receipt'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-slate-400'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>3. Belanja</span>
          </div>

          <ChevronRight className="w-3 h-3 text-slate-300" />

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              currentStep === 'receipt'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>4. Struk</span>
          </div>
        </div>
      </div>

      {/* STEP 1: SCAN / INPUT RFID */}
      {currentStep === 'rfid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main RFID Scan Box */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-2xs text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center mb-4 relative">
                <Radio className="w-10 h-10 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></span>
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Tempelkan Kartu RFID Santriwati
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                Dekatkan kartu smart card santriwati ke RFID Reader atau ketik UID secara manual di bawah ini.
              </p>

              <form onSubmit={handleRfidSubmit} className="max-w-md mx-auto space-y-3">
                <div className="relative">
                  <input
                    ref={rfidInputRef}
                    id="rfid-input-field"
                    type="text"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: AMN-01001 / EA8490B1"
                    className="w-full pl-10 pr-24 py-3.5 bg-slate-50 border-2 border-blue-200 rounded-2xl text-center font-mono text-base font-bold text-slate-900 tracking-widest focus:ring-4 focus:ring-blue-100 focus:border-blue-600 focus:bg-white transition-all uppercase placeholder:text-slate-400"
                  />
                  <Radio className="w-5 h-5 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="submit"
                    id="rfid-submit-btn"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Cari Santri
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tekan <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono">Enter</kbd> setelah menempelkan kartu
                </p>
              </form>
            </div>

            {/* Instruction Tip Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Sistem Keamanan AMANAH Smart Mart:</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Hanya kartu santriwati berstatus <strong>Aktif</strong> yang dapat bertransaksi. Santriwati Nonaktif akan ditolak secara otomatis oleh sistem demi keamanan dana wali santri.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Select Santriwati (Testing / Convenience) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Daftar Cepat Santriwati (Simulasi Demo)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Klik untuk memilih</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1 flex-1">
              {santriwati.slice(0, 8).map((s) => {
                const used = getSantriDailyUsage(s.id);
                const sisa = Math.max(0, (s.dailyLimit || 30000) - used);
                const isLocked = s.pinLockedUntil && new Date(s.pinLockedUntil) > new Date();

                return (
                  <div
                    key={s.id}
                    onClick={() => handleQuickSelectSantri(s)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      s.status === 'inactive'
                        ? 'bg-rose-50/60 border-rose-200 opacity-75 hover:bg-rose-50'
                        : isLocked
                        ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                        : 'bg-slate-50/80 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          s.photoURL ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            s.name
                          )}&background=2563eb&color=fff`
                        }
                        alt={s.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{s.name}</h4>
                          {s.status === 'inactive' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                              Nonaktif
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-700 rounded flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Terkunci
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          NIS: {s.nis} • RFID: <strong className="text-blue-700">{s.rfidUid}</strong>
                        </p>
                        <p className="text-[10px] text-slate-400">{s.classRoom} – {s.dormitory}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">Saldo</span>
                      <span className="text-xs font-bold text-emerald-600 font-mono">
                        {formatIDR(s.balance)}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Sisa Limit: {formatIDR(sisa)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PIN VERIFICATION */}
      {currentStep === 'pin' && selectedSantri && (
        <div className="max-w-xl mx-auto space-y-5">
          {/* Santri Identity Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <img
                  src={
                    selectedSantri.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedSantri.name
                    )}&background=2563eb&color=fff`
                  }
                  alt={selectedSantri.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/20 shadow-xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedSantri.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    NIS: {selectedSantri.nis} • UID: {selectedSantri.rfidUid}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {selectedSantri.classRoom} | Asrama {selectedSantri.dormitory}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetPos}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Ganti Kartu
              </button>
            </div>

            {/* Financial Status Quick View */}
            <div className="grid grid-cols-3 gap-3 pt-4 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Saldo Dompet</span>
                <span className="text-sm font-extrabold text-emerald-600 font-mono">
                  {formatIDR(selectedSantri.balance)}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Pakai Hari Ini</span>
                <span className="text-sm font-extrabold text-slate-700 font-mono">
                  {formatIDR(santriTodayUsage)}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">Sisa Limit Harian</span>
                <span className="text-sm font-extrabold text-blue-600 font-mono">
                  {formatIDR(santriRemainingLimit)}
                </span>
              </div>
            </div>
          </div>

          {/* PIN Input & Secure Numpad */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Masukkan PIN Santriwati (6 Digit)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Otentikasi PIN terenkripsi SHA-256 (Maksimal 3x percobaan, lock 15 menit)
              </p>
            </div>

            {/* Lockout Warning */}
            {selectedSantri.pinLockedUntil && new Date(selectedSantri.pinLockedUntil) > new Date() ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
                <div className="flex items-center justify-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>KARTU TERKUNCI KARENA 3X SALAH PIN</span>
                </div>
                <p className="text-slate-600">
                  Tunggu waktu buka gembok otomatis: <strong className="font-mono text-rose-700">{lockCountdown}</strong>
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => unlockSantriPin(selectedSantri.id)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Buka Gembok (Otorisasi Petugas)
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 6 Digit Masked Circles */}
                <div className="flex items-center justify-center gap-3 my-4">
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const isFilled = pinInput.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center font-mono text-lg font-bold transition-all ${
                          isFilled
                            ? 'bg-blue-600 border-blue-600 text-white scale-105 shadow-xs'
                            : 'bg-slate-50 border-slate-300 text-slate-400'
                        }`}
                      >
                        {isFilled ? '●' : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Hidden real input for keyboard support */}
                <input
                  ref={pinInputRef}
                  id="pin-keyboard-input"
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setPinInput(val);
                    if (pinError) setPinError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && pinInput.length === 6) {
                      handlePinSubmit();
                    }
                  }}
                  className="opacity-0 absolute -z-10 pointer-events-none"
                />

                {/* Error Banner */}
                {pinError && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 py-2 px-3 rounded-xl border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                {/* Secure Touch / Click Numpad */}
                <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto pt-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumpadClick(num)}
                      className="py-3 bg-slate-100 hover:bg-slate-200 active:bg-blue-100 text-slate-800 font-mono font-bold text-lg rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleNumpadClear}
                    className="py-3 bg-slate-100 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNumpadClick('0')}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-lg rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleNumpadBackspace}
                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  >
                    ⌫
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleResetPos}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    id="verify-pin-btn"
                    onClick={() => handlePinSubmit()}
                    disabled={pinInput.length !== 6 || isVerifyingPin}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isVerifyingPin ? (
                      'Memverifikasi...'
                    ) : (
                      <>
                        <span>Verifikasi PIN</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 text-[11px] text-slate-400">
                  Tip Demo: PIN Default Seed Data adalah <code className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">123456</code>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: PRODUCT CATALOG & CART */}
      {currentStep === 'cart' && selectedSantri && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Product Catalog (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="relative">
                <input
                  id="search-pos-products"
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Cari produk berdasarkan nama, barcode, atau SKU..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Produk ({activeAvailableProducts.length})
                </button>

                {categories.map((cat) => {
                  const count = activeAvailableProducts.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Tag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Tidak Ada Produk Ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Hanya produk berstatus Aktif dan memiliki stok &gt; 0 yang ditampilkan di kasir.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const inCart = cart.find((i) => i.product.id === p.id);
                  const isLowStock = p.stock <= p.minStock;

                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                    >
                      {inCart && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-xs">
                          {inCart.quantity} di keranjang
                        </div>
                      )}

                      <div>
                        <div className="w-full h-24 bg-slate-100 rounded-xl overflow-hidden mb-2.5 relative">
                          <img
                            src={
                              p.imageURL ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=60'
                            }
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {isLowStock && (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-amber-500/90 text-white text-[9px] font-bold rounded">
                              Sisa {p.stock}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-blue-600 font-medium">{p.categoryName}</span>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight mt-0.5">
                          {p.name}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[9px] text-slate-400 block">Harga</span>
                          <span className="text-xs font-extrabold text-slate-900 font-mono">
                            {formatIDR(p.sellingPrice)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Cart & Validation Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Customer Summary Mini Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      selectedSantri.photoURL ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        selectedSantri.name
                      )}&background=2563eb&color=fff`
                    }
                    alt={selectedSantri.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      {selectedSantri.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      NIS: {selectedSantri.nis} • {selectedSantri.classRoom}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetPos}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Batal / Ganti
                </button>
              </div>

              {/* Dynamic Balance & Limit Indicator */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Saldo Dompet:</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-600 text-sm mt-0.5">
                    {formatIDR(selectedSantri.balance)}
                  </div>
                  {cartTotal > 0 && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Sisa setelah beli:{' '}
                      <strong
                        className={`font-mono ${
                          isBalanceSufficient ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {formatIDR(selectedSantri.balance - cartTotal)}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Sisa Limit Hari Ini:</span>
                  </div>
                  <div className="font-mono font-bold text-blue-600 text-sm mt-0.5">
                    {formatIDR(santriRemainingLimit)}
                  </div>
                  {cartTotal > 0 && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Sisa setelah beli:{' '}
                      <strong
                        className={`font-mono ${
                          isLimitSufficient ? 'text-blue-700' : 'text-rose-600'
                        }`}
                      >
                        {formatIDR(santriRemainingLimit - cartTotal)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Keranjang Belanja ({cartTotalItems} item)
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              {/* Cart Item List */}
              <div className="my-3 space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>Keranjang masih kosong.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pilih produk di sebelah kiri</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>{formatIDR(item.product.sellingPrice)}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700">
                            Subtotal: {formatIDR(item.product.sellingPrice * item.quantity)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="w-6 h-6 rounded-lg hover:bg-rose-100 text-rose-600 flex items-center justify-center ml-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total & Validation Warnings */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Subtotal Belanja:</span>
                  <span className="font-mono font-bold text-slate-900">{formatIDR(cartTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1 border-t border-slate-200/60">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-base font-extrabold text-blue-600">
                    {formatIDR(cartTotal)}
                  </span>
                </div>

                {/* Validation Warnings if any */}
                {cart.length > 0 && !isBalanceSufficient && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>Saldo santriwati tidak cukup! Kurang {formatIDR(cartTotal - selectedSantri.balance)}.</span>
                  </div>
                )}

                {cart.length > 0 && isBalanceSufficient && !isLimitSufficient && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Melebihi limit belanja harian! Kurangi belanja senilai {formatIDR(cartTotal - santriRemainingLimit)}.</span>
                  </div>
                )}

                {/* Optional Transaction Notes */}
                <input
                  type="text"
                  value={trxNotes}
                  onChange={(e) => setTrxNotes(e.target.value)}
                  placeholder="Catatan transaksi (opsional)..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                />

                {/* Pay Button */}
                <button
                  type="button"
                  id="pos-pay-button"
                  onClick={handleCheckout}
                  disabled={!canCheckout}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isProcessingTrx ? (
                    'Memproses Transaksi...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Bayar via Kartu RFID ({formatIDR(cartTotal)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: RECEIPT MODAL / RECEIPT VIEW */}
      {lastTransaction && (
        <Modal
          isOpen={showReceiptModal}
          onClose={handleResetPos}
          title="Struk Bukti Pembayaran Digital"
          subtitle={`No. Faktur: ${lastTransaction.invoiceNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Printable Receipt Paper Container */}
            <div
              id="printable-receipt"
              className="bg-white p-5 rounded-2xl border-2 border-dashed border-slate-300 font-sans text-xs text-slate-800 space-y-3"
            >
              {/* Pesantren & Mart Header */}
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  AMANAH SMART MART
                </h3>
                <p className="text-[11px] text-slate-500">Pondok Pesantren Putri Darul Amanah</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Jl. Pesantren No. 12, Kendal • Telp (0294) 123456
                </p>
              </div>

              {/* Transaction Metadata */}
              <div className="space-y-1 text-[11px] text-slate-600 border-b border-slate-200 pb-3">
                <div className="flex justify-between">
                  <span>No. Faktur:</span>
                  <span className="font-mono font-bold text-slate-900">{lastTransaction.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>
                    {new Date(lastTransaction.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span className="font-medium text-slate-800">{lastTransaction.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Santriwati:</span>
                  <span className="font-bold text-slate-900">
                    {lastTransaction.santriwatiName} ({lastTransaction.santriwatiClass})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>NIS / RFID:</span>
                  <span className="font-mono">{lastTransaction.santriwatiNis}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 border-b border-slate-200 pb-3">
                <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                  <span>Item</span>
                  <span>Subtotal</span>
                </div>
                {lastTransaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div className="pr-2">
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-slate-400 block text-[10px]">
                        {item.quantity} x {formatIDR(item.price)}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 self-end">
                      {formatIDR(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total & Balances */}
              <div className="space-y-1 text-xs border-b border-slate-200 pb-3">
                <div className="flex justify-between font-extrabold text-sm text-slate-900">
                  <span>TOTAL BELANJA:</span>
                  <span className="font-mono text-blue-600">{formatIDR(lastTransaction.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Metode Pembayaran:</span>
                  <span className="font-semibold text-slate-800">Kartu RFID Smart Card</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Saldo Sebelum:</span>
                  <span className="font-mono">{formatIDR(lastTransaction.santriBalanceBefore || 0)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-emerald-700">
                  <span>Sisa Saldo Kantin:</span>
                  <span className="font-mono">{formatIDR(lastTransaction.santriBalanceAfter || 0)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Sisa Limit Belanja Hari Ini:</span>
                  <span className="font-mono">{formatIDR(lastTransaction.dailyLimitRemaining || 0)}</span>
                </div>
              </div>

              {/* Footer barcode & gratitude */}
              <div className="text-center pt-1 text-[10px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">Terima Kasih Atas Kunjungan Anda</p>
                <p className="italic">Semoga Berkah & Bermanfaat</p>
                <div className="font-mono text-[9px] text-slate-300 tracking-widest pt-1">
                  *** AMANAH POS SMART SYSTEM ***
                </div>
              </div>
            </div>

            {/* Receipt Modal Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>

              <button
                type="button"
                id="next-transaction-btn"
                onClick={handleResetPos}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Transaksi Baru</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
