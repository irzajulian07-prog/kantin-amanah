import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Santriwati,
  SantriStatus,
  Product,
  ProductStatus,
  Category,
  Supplier,
  User,
  AuditLog,
  AppSettings,
  UserRole,
  Transaction,
  TransactionItem,
  Topup,
  StockReceipt,
  StockReceiptItem,
  StockAdjustment
} from '../types';
import {
  initialSantriwati,
  initialProducts,
  initialCategories,
  initialSuppliers,
  initialUsers,
  initialSettings,
  initialAuditLogs,
  initialTransactions,
  initialTopups,
  initialStockReceipts,
  initialStockAdjustments
} from '../firebase/seedData';
import { db, isFirebaseConfigured } from '../firebase/config';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface ProcessPosTransactionParams {
  santriwati: Santriwati;
  items: Array<{
    product: Product;
    quantity: number;
  }>;
  notes?: string;
}

interface CreateStockReceiptParams {
  supplierId: string;
  invoiceOrDoNumber?: string;
  items: StockReceiptItem[];
  receivedDate: string;
  notes?: string;
}

interface RecordStockAdjustmentParams {
  productId: string;
  physicalStock: number;
  reason: string;
  notes?: string;
  adjustmentType?: StockAdjustment['adjustmentType'];
}

interface DataContextType {
  // Collections
  santriwati: Santriwati[];
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  users: User[];
  transactions: Transaction[];
  topups: Topup[];
  stockReceipts: StockReceipt[];
  stockAdjustments: StockAdjustment[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  isFirebaseActive: boolean;
  isLoadingData: boolean;

  // Santriwati CRUD
  addSantriwati: (data: Omit<Santriwati, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSantriwati: (id: string, data: Partial<Santriwati>) => Promise<void>;
  deleteSantriwati: (id: string) => Promise<void>;
  toggleSantriStatus: (id: string) => Promise<void>;
  getSantriwatiById: (id: string) => Santriwati | undefined;
  getSantriByRfid: (rfidUid: string) => Santriwati | undefined;
  getSantriDailyUsage: (santriId: string, date?: Date) => number;
  recordPinFailedAttempt: (santriId: string) => Promise<{ failedAttempts: number; isLocked: boolean; lockUntil: string | null }>;
  recordPinSuccess: (santriId: string) => Promise<void>;
  unlockSantriPin: (santriId: string) => Promise<void>;

  // Product CRUD
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;

  // Category CRUD
  addCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Promise<string>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Supplier CRUD
  addSupplier: (data: Omit<Supplier, 'id' | 'createdAt'>) => Promise<string>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;

  // User Management
  addUser: (data: Omit<User, 'id' | 'createdAt'>) => Promise<string>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // POS & Transaction Processing
  processPosTransaction: (params: ProcessPosTransactionParams) => Promise<Transaction>;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsBySantriId: (santriId: string) => Transaction[];

  // Top Up Saldo
  createTopupRequest: (params: {
    santriId: string;
    amount: number;
    paymentMethod: 'qris' | 'transfer' | 'cash';
    proofPhotoURL?: string;
    notes?: string;
    requestedBy?: string;
  }) => Promise<Topup>;
  approveTopup: (topupId: string, notes?: string) => Promise<void>;
  rejectTopup: (topupId: string, rejectionReason: string) => Promise<void>;
  deleteTopup: (topupId: string) => Promise<void>;

  // Penerimaan Barang (Stock Inward)
  createStockReceipt: (params: CreateStockReceiptParams) => Promise<StockReceipt>;

  // Stok Opname (Stock Adjustment)
  recordStockAdjustment: (params: RecordStockAdjustmentParams) => Promise<StockAdjustment>;
  recordBatchStockOpname: (
    adjustments: Array<{ productId: string; physicalStock: number; reason: string; notes?: string }>
  ) => Promise<StockAdjustment[]>;

  // Settings & System
  updateSettings: (data: Partial<AppSettings>) => Promise<void>;
  logAuditAction: (action: AuditLog['action'], module: AuditLog['module'], details: string) => Promise<void>;
  resetToDefaultSeedData: () => void;

  // Metrics
  metrics: {
    totalSantriwati: number;
    activeSantriwati: number;
    totalProducts: number;
    lowStockProducts: number;
    totalCategories: number;
    totalSuppliers: number;
    totalUsers: number;
    totalInventoryValue: number;
    totalSantriBalance: number;
    totalTransactions: number;
    todayTransactionsCount: number;
    todayRevenue: number;
    pendingTopupsCount: number;
    totalTopupsApproved: number;
    totalStockReceipts: number;
    totalStockAdjustments: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  santriwati: 'amanah_db_santriwati',
  products: 'amanah_db_products',
  categories: 'amanah_db_categories',
  suppliers: 'amanah_db_suppliers',
  users: 'amanah_db_users',
  transactions: 'amanah_db_transactions',
  topups: 'amanah_db_topups',
  stockReceipts: 'amanah_db_stock_receipts',
  stockAdjustments: 'amanah_db_stock_adjustments',
  auditLogs: 'amanah_db_audit_logs',
  settings: 'amanah_db_settings',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();
  const { showNotification } = useNotification();
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const recentTrxMapRef = useRef<Map<string, { timestamp: number; trx: Transaction }>>(new Map());

  // Initialize collections with localStorage fallback or seedData
  const [santriwati, setSantriwati] = useState<Santriwati[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.santriwati);
    return saved ? JSON.parse(saved) : initialSantriwati;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.products);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.categories);
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.suppliers);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.users);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.transactions);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [topups, setTopups] = useState<Topup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.topups);
    return saved ? JSON.parse(saved) : initialTopups;
  });

  const [stockReceipts, setStockReceipts] = useState<StockReceipt[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.stockReceipts);
    return saved ? JSON.parse(saved) : initialStockReceipts;
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.stockAdjustments);
    return saved ? JSON.parse(saved) : initialStockAdjustments;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.auditLogs);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.settings);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  // Persist to local storage whenever states change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.santriwati, JSON.stringify(santriwati));
  }, [santriwati]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.topups, JSON.stringify(topups));
  }, [topups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.stockReceipts, JSON.stringify(stockReceipts));
  }, [stockReceipts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.stockAdjustments, JSON.stringify(stockAdjustments));
  }, [stockAdjustments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.auditLogs, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  // Real-time Firestore Listeners if configured
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      setIsLoadingData(true);
      const unsubSantri = onSnapshot(collection(db, 'santriwati'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Santriwati[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Santriwati));
          setSantriwati(list);
        }
      });

      const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Product));
          setProducts(list);
        }
      });

      const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Category[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Category));
          setCategories(list);
        }
      });

      const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Supplier[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Supplier));
          setSuppliers(list);
        }
      });

      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          const list: User[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as User));
          setUsers(list);
        }
      });

      const unsubTrx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Transaction[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Transaction));
          // Sort newest first
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTransactions(list);
        }
      });

      const unsubTopups = onSnapshot(collection(db, 'topups'), (snapshot) => {
        if (!snapshot.empty) {
          const list: Topup[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as Topup));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTopups(list);
        }
      });

      const unsubReceipts = onSnapshot(collection(db, 'stockReceipts'), (snapshot) => {
        if (!snapshot.empty) {
          const list: StockReceipt[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as StockReceipt));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setStockReceipts(list);
        }
      });

      const unsubAdjustments = onSnapshot(collection(db, 'stockAdjustments'), (snapshot) => {
        if (!snapshot.empty) {
          const list: StockAdjustment[] = [];
          snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as StockAdjustment));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setStockAdjustments(list);
        }
      });

      setIsLoadingData(false);

      return () => {
        unsubSantri();
        unsubProducts();
        unsubCategories();
        unsubSuppliers();
        unsubUsers();
        unsubTrx();
        unsubTopups();
        unsubReceipts();
        unsubAdjustments();
      };
    }
  }, []);

  // Audit Logger
  const logAuditAction = useCallback(
    async (action: AuditLog['action'], module: AuditLog['module'], details: string) => {
      const newLog: AuditLog = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        userId: user?.id || 'sys-admin',
        userName: user?.displayName || 'System Administrator',
        userRole: (user?.role || role || 'admin') as UserRole,
        action,
        module,
        details
      };

      setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
        } catch (e) {
          console.error('Firestore audit log write error:', e);
        }
      }
    },
    [user, role]
  );

  // Daily usage calculation helper
  const getSantriDailyUsage = useCallback(
    (santriId: string, date: Date = new Date()): number => {
      const targetDateStr = date.toISOString().slice(0, 10);
      return transactions
        .filter((t) => {
          const matchSantri = t.santriwatiId === santriId || t.santriId === santriId;
          const isCompleted = t.status === 'completed';
          const isSameDate = t.createdAt ? t.createdAt.slice(0, 10) === targetDateStr : false;
          return matchSantri && isCompleted && isSameDate;
        })
        .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    },
    [transactions]
  );

  // Santriwati Handlers
  const addSantriwati = async (data: Omit<Santriwati, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    // Uniqueness validation
    const normalizedNis = data.nis.trim().toLowerCase();
    const normalizedRfid = data.rfidUid.trim().toUpperCase();

    const isDuplicateNis = santriwati.some((s) => s.nis.trim().toLowerCase() === normalizedNis);
    if (isDuplicateNis) {
      const msg = `NIS "${data.nis}" sudah terdaftar untuk santriwati lain. NIS harus unik.`;
      showNotification('error', 'Validasi Gagal', msg);
      throw new Error(msg);
    }

    const isDuplicateRfid = santriwati.some(
      (s) => s.rfidUid && s.rfidUid.trim().toUpperCase() === normalizedRfid
    );
    if (isDuplicateRfid) {
      const msg = `UID RFID "${data.rfidUid}" sudah digunakan oleh santriwati lain. UID RFID harus unik.`;
      showNotification('error', 'Validasi Gagal', msg);
      throw new Error(msg);
    }

    const id = 'santri_' + Date.now();
    const now = new Date().toISOString();
    const newRecord: Santriwati = {
      ...data,
      id,
      rfidUid: normalizedRfid,
      pinFailedAttempts: data.pinFailedAttempts ?? 0,
      pinLockedUntil: data.pinLockedUntil ?? null,
      createdAt: now,
      updatedAt: now
    };

    setSantriwati((prev) => [newRecord, ...prev]);

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'santriwati', id), newRecord);
    }

    await logAuditAction('CREATE', 'SANTRIWATI', `Menambah data santriwati: ${data.name} (NIS: ${data.nis}, RFID: ${normalizedRfid})`);
    showNotification('success', 'Santriwati Ditambahkan', `Data ${data.name} berhasil disimpan.`);
    return id;
  };

  const updateSantriwati = async (id: string, data: Partial<Santriwati>) => {
    // Uniqueness validation on update
    if (data.nis) {
      const normalizedNis = data.nis.trim().toLowerCase();
      const isDuplicateNis = santriwati.some(
        (s) => s.id !== id && s.nis.trim().toLowerCase() === normalizedNis
      );
      if (isDuplicateNis) {
        const msg = `NIS "${data.nis}" sudah digunakan oleh santriwati lain. NIS harus unik.`;
        showNotification('error', 'Validasi Gagal', msg);
        throw new Error(msg);
      }
    }

    if (data.rfidUid) {
      const normalizedRfid = data.rfidUid.trim().toUpperCase();
      const isDuplicateRfid = santriwati.some(
        (s) => s.id !== id && s.rfidUid && s.rfidUid.trim().toUpperCase() === normalizedRfid
      );
      if (isDuplicateRfid) {
        const msg = `UID RFID "${data.rfidUid}" sudah digunakan oleh santriwati lain. UID RFID harus unik.`;
        showNotification('error', 'Validasi Gagal', msg);
        throw new Error(msg);
      }
    }

    const now = new Date().toISOString();
    const mergedData = {
      ...data,
      ...(data.rfidUid ? { rfidUid: data.rfidUid.trim().toUpperCase() } : {}),
      updatedAt: now
    };

    setSantriwati((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...mergedData } : item))
    );

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'santriwati', id), mergedData);
    }

    const updated = santriwati.find((s) => s.id === id);
    await logAuditAction('UPDATE', 'SANTRIWATI', `Memperbarui data santriwati: ${updated?.name || id}`);
    showNotification('success', 'Data Santriwati Diperbarui', `Perubahan data santriwati berhasil disimpan.`);
  };

  const toggleSantriStatus = async (id: string) => {
    const target = santriwati.find((s) => s.id === id);
    if (!target) return;
    const newStatus: SantriStatus = target.status === 'active' ? 'inactive' : 'active';
    await updateSantriwati(id, { status: newStatus });
    await logAuditAction('STATUS_CHANGE', 'SANTRIWATI', `Mengubah status santriwati ${target.name} menjadi ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}`);
    showNotification(
      'info',
      'Status Berubah',
      `Santriwati ${target.name} sekarang ${newStatus === 'active' ? 'Aktif' : 'Dinonaktifkan'}.`
    );
  };

  const deleteSantriwati = async (id: string) => {
    const target = santriwati.find((s) => s.id === id);
    setSantriwati((prev) => prev.filter((item) => item.id !== id));

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'santriwati', id));
    }

    await logAuditAction('DELETE', 'SANTRIWATI', `Menghapus santriwati: ${target?.name || id}`);
    showNotification('info', 'Santriwati Dihapus', `Data santriwati telah dihapus.`);
  };

  const getSantriwatiById = useCallback((id: string) => santriwati.find((s) => s.id === id), [santriwati]);

  const getSantriByRfid = useCallback(
    (rfidUid: string) => {
      const clean = rfidUid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (!clean) return undefined;
      return santriwati.find(
        (s) => s.rfidUid && s.rfidUid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === clean
      );
    },
    [santriwati]
  );

  // PIN security operations
  const recordPinFailedAttempt = async (
    santriId: string
  ): Promise<{ failedAttempts: number; isLocked: boolean; lockUntil: string | null }> => {
    const target = santriwati.find((s) => s.id === santriId);
    if (!target) {
      return { failedAttempts: 0, isLocked: false, lockUntil: null };
    }

    const nextAttempts = (target.pinFailedAttempts || 0) + 1;
    const now = new Date();

    if (nextAttempts >= 3) {
      // Lock account for 15 minutes
      const lockUntil = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
      const updatedData = {
        pinFailedAttempts: 3,
        pinLockedUntil: lockUntil,
        updatedAt: now.toISOString()
      };

      setSantriwati((prev) =>
        prev.map((s) => (s.id === santriId ? { ...s, ...updatedData } : s))
      );

      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'santriwati', santriId), updatedData);
      }

      await logAuditAction(
        'ACCOUNT_LOCKED',
        'POS',
        `Kartu santriwati ${target.name} (NIS: ${target.nis}) TERKUNCI 15 MENIT karena 3x salah memasukkan PIN di kasir.`
      );

      showNotification(
        'error',
        'Kartu Santriwati Terkunci',
        `PIN salah 3 kali berturut-turut. Kartu ${target.name} terkunci sementara selama 15 menit.`
      );

      return { failedAttempts: 3, isLocked: true, lockUntil };
    } else {
      const updatedData = {
        pinFailedAttempts: nextAttempts,
        updatedAt: now.toISOString()
      };

      setSantriwati((prev) =>
        prev.map((s) => (s.id === santriId ? { ...s, ...updatedData } : s))
      );

      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'santriwati', santriId), updatedData);
      }

      await logAuditAction(
        'PIN_FAILED',
        'POS',
        `Percobaan PIN salah (${nextAttempts}/3) untuk santriwati ${target.name} (NIS: ${target.nis}) di kasir.`
      );

      showNotification(
        'warning',
        'PIN Salah',
        `PIN tidak sesuai. Percobaan ke-${nextAttempts} dari 3.`
      );

      return { failedAttempts: nextAttempts, isLocked: false, lockUntil: null };
    }
  };

  const recordPinSuccess = async (santriId: string) => {
    const target = santriwati.find((s) => s.id === santriId);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedData = {
      pinFailedAttempts: 0,
      pinLockedUntil: null,
      updatedAt: now
    };

    setSantriwati((prev) =>
      prev.map((s) => (s.id === santriId ? { ...s, ...updatedData } : s))
    );

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'santriwati', santriId), updatedData);
    }

    await logAuditAction(
      'PIN_VERIFIED',
      'POS',
      `Otentikasi PIN 6-digit RFID santriwati ${target.name} (NIS: ${target.nis}) terverifikasi sukses di kasir.`
    );
  };

  const unlockSantriPin = async (santriId: string) => {
    const target = santriwati.find((s) => s.id === santriId);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedData = {
      pinFailedAttempts: 0,
      pinLockedUntil: null,
      updatedAt: now
    };

    setSantriwati((prev) =>
      prev.map((s) => (s.id === santriId ? { ...s, ...updatedData } : s))
    );

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'santriwati', santriId), updatedData);
    }

    await logAuditAction(
      'STATUS_CHANGE',
      'SANTRIWATI',
      `Reset gembok keamanan PIN untuk santriwati ${target.name} (NIS: ${target.nis})`
    );

    showNotification(
      'success',
      'Gembok PIN Dibuka',
      `Kartu ${target.name} telah dibuka dan dapat digunakan kembali di kasir.`
    );
  };

  // Product Handlers
  const addProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = 'prod_' + Date.now();
    const now = new Date().toISOString();
    const category = categories.find((c) => c.id === data.categoryId);
    const supplier = suppliers.find((s) => s.id === data.supplierId);

    const newProduct: Product = {
      ...data,
      id,
      categoryName: category?.name || (data.categoryId ? 'Lainnya' : 'Tanpa Kategori'),
      supplierName: supplier?.name || data.supplierName || 'Umum',
      createdAt: now,
      updatedAt: now
    };

    setProducts((prev) => [newProduct, ...prev]);

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'products', id), newProduct);
    }

    await logAuditAction('CREATE', 'PRODUCTS', `Menambah produk baru: ${data.name} (SKU: ${data.sku || id})`);
    showNotification('success', 'Produk Ditambahkan', `${data.name} berhasil masuk daftar katalog.`);
    return id;
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const now = new Date().toISOString();
    const category = data.categoryId !== undefined
      ? (data.categoryId ? categories.find((c) => c.id === data.categoryId) : null)
      : null;
    const supplier = data.supplierId ? suppliers.find((s) => s.id === data.supplierId) : null;

    const mergedData = {
      ...data,
      ...(data.categoryId !== undefined
        ? { categoryName: category?.name || (data.categoryId ? 'Lainnya' : 'Tanpa Kategori') }
        : {}),
      ...(supplier ? { supplierName: supplier.name } : {}),
      updatedAt: now
    };

    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...mergedData } : item))
    );

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'products', id), mergedData);
    }

    const updated = products.find((p) => p.id === id);
    await logAuditAction('UPDATE', 'PRODUCTS', `Memperbarui info produk: ${updated?.name || id}`);
    showNotification('success', 'Produk Diperbarui', `Informasi produk berhasil diperbarui.`);
  };

  const toggleProductStatus = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    await updateProduct(id, { status: newStatus });
    await logAuditAction('STATUS_CHANGE', 'PRODUCTS', `Mengubah status produk ${target.name} menjadi ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}`);
    showNotification(
      'info',
      'Status Produk Diubah',
      `Produk ${target.name} sekarang ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}.`
    );
  };

  const deleteProduct = async (id: string) => {
    const target = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((item) => item.id !== id));

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'products', id));
    }

    await logAuditAction('DELETE', 'PRODUCTS', `Menghapus produk: ${target?.name || id}`);
    showNotification('info', 'Produk Dihapus', `Produk ${target?.name || ''} telah dihapus dari katalog.`);
  };

  const getProductById = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  // Category Handlers
  const addCategory = async (data: Omit<Category, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'cat_' + Date.now();
    const newCategory: Category = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };

    setCategories((prev) => [...prev, newCategory]);

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'categories', id), newCategory);
    }

    await logAuditAction('CREATE', 'CATEGORIES', `Membuat kategori: ${data.name}`);
    showNotification('success', 'Kategori Ditambahkan', `Kategori ${data.name} siap digunakan.`);
    return id;
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );

    // If category name updated, also update products referencing this category
    if (data.name) {
      setProducts((prev) =>
        prev.map((p) => (p.categoryId === id ? { ...p, categoryName: data.name! } : p))
      );
    }

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'categories', id), data);
      if (data.name) {
        const related = products.filter((p) => p.categoryId === id);
        for (const p of related) {
          await updateDoc(doc(db, 'products', p.id), { categoryName: data.name });
        }
      }
    }

    await logAuditAction('UPDATE', 'CATEGORIES', `Memperbarui kategori: ${data.name || id}`);
    showNotification('success', 'Kategori Diperbarui', `Perubahan kategori berhasil disimpan.`);
  };

  const deleteCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    const now = new Date().toISOString();

    const matchingProducts = products.filter((p) => p.categoryId === id);
    setProducts((prev) =>
      prev.map((p) =>
        p.categoryId === id
          ? { ...p, categoryId: '', categoryName: 'Tanpa Kategori', updatedAt: now }
          : p
      )
    );

    setCategories((prev) => prev.filter((item) => item.id !== id));

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'categories', id));
      for (const p of matchingProducts) {
        await updateDoc(doc(db, 'products', p.id), {
          categoryId: '',
          categoryName: 'Tanpa Kategori',
          updatedAt: now
        });
      }
    }

    await logAuditAction(
      'DELETE',
      'CATEGORIES',
      `Menghapus kategori: ${target?.name || id}. ${matchingProducts.length} produk dialihkan ke "Tanpa Kategori"`
    );
    showNotification(
      'info',
      'Kategori Dihapus',
      `Kategori "${target?.name || ''}" telah dihapus. ${
        matchingProducts.length > 0
          ? `${matchingProducts.length} produk dialihkan ke "Tanpa Kategori".`
          : ''
      }`
    );
  };

  // Supplier Handlers
  const addSupplier = async (data: Omit<Supplier, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'sup_' + Date.now();
    const newSupplier: Supplier = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };

    setSuppliers((prev) => [...prev, newSupplier]);

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'suppliers', id), newSupplier);
    }

    await logAuditAction('CREATE', 'SUPPLIERS', `Menambah supplier mitra: ${data.name}`);
    showNotification('success', 'Supplier Ditambahkan', `Supplier ${data.name} berhasil terdaftar.`);
    return id;
  };

  const updateSupplier = async (id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'suppliers', id), data);
    }

    await logAuditAction('UPDATE', 'SUPPLIERS', `Memperbarui supplier: ${data.name || id}`);
    showNotification('success', 'Supplier Diperbarui', `Data supplier berhasil diperbarui.`);
  };

  const deleteSupplier = async (id: string) => {
    const target = suppliers.find((s) => s.id === id);
    setSuppliers((prev) => prev.filter((item) => item.id !== id));

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'suppliers', id));
    }

    await logAuditAction('DELETE', 'SUPPLIERS', `Menghapus supplier: ${target?.name || id}`);
    showNotification('info', 'Supplier Dihapus', `Data supplier telah dihapus.`);
  };

  // User Handlers (Admin Only)
  const addUser = async (data: Omit<User, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'usr_' + Date.now();
    const newUser: User = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => [...prev, newUser]);

    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'users', id), newUser);
    }

    await logAuditAction('CREATE', 'USERS', `Menambahkan pengguna baru: ${data.displayName} (${data.role})`);
    showNotification('success', 'Pengguna Ditambahkan', `Akun ${data.displayName} (${data.role}) berhasil dibuat.`);
    return id;
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'users', id), data);
    }

    await logAuditAction('UPDATE', 'USERS', `Memperbarui data pengguna: ${data.displayName || id}`);
    showNotification('success', 'Pengguna Diperbarui', `Data akun berhasil diperbarui.`);
  };

  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((item) => item.id !== id));

    if (isFirebaseConfigured && db) {
      await deleteDoc(doc(db, 'users', id));
    }

    await logAuditAction('DELETE', 'USERS', `Menghapus pengguna: ${target?.displayName || id}`);
    showNotification('info', 'Pengguna Dihapus', `Akun pengguna telah dihapus dari sistem.`);
  };

  // ==========================================
  // POS & TRANSACTION PROCESSING (TAHAP 3)
  // ==========================================
  const processPosTransaction = async (params: ProcessPosTransactionParams): Promise<Transaction> => {
    const { santriwati: currentSantri, items, notes } = params;

    // 0. Anti-Double Transaction Idempotency Guard (RFID / Double tap protection)
    const itemsSignature = (items || [])
      .map((i) => `${i.product.id}:${i.quantity}`)
      .sort()
      .join('|');
    const trxSignature = `${currentSantri.id}_${itemsSignature}`;

    const existingRecent = recentTrxMapRef.current.get(trxSignature);
    if (existingRecent && Date.now() - existingRecent.timestamp < 6000) {
      console.warn('Anti-Double Transaction triggered: duplicate RFID scan / double checkout prevented.');
      showNotification(
        'warning',
        'Anti Double-Transaction',
        `Peringatan: Transaksi ganda terdeteksi dalam rentang waktu singkat. Menggunakan transaksi sebelumnya #${existingRecent.trx.invoiceNumber} tanpa pemotongan saldo ganda.`
      );
      return existingRecent.trx;
    }

    // 1. Validate Santriwati status
    if (currentSantri.status !== 'active') {
      const msg = `Transaksi Ditolak: Santriwati ${currentSantri.name} berstatus Nonaktif.`;
      showNotification('error', 'Transaksi Ditolak', msg);
      throw new Error(msg);
    }

    // 2. Validate Lockout
    if (currentSantri.pinLockedUntil && new Date(currentSantri.pinLockedUntil) > new Date()) {
      const remainingMs = new Date(currentSantri.pinLockedUntil).getTime() - Date.now();
      const remainingMins = Math.ceil(remainingMs / (60 * 1000));
      const msg = `Kartu terkunci! Harap tunggu ${remainingMins} menit atau hubungi administrator.`;
      showNotification('error', 'Kartu Terkunci', msg);
      throw new Error(msg);
    }

    // 3. Validate empty cart
    if (!items || items.length === 0) {
      const msg = 'Keranjang belanja masih kosong.';
      showNotification('warning', 'Keranjang Kosong', msg);
      throw new Error(msg);
    }

    // 4. Calculate total and validate stock
    let totalAmount = 0;
    const trxItems: TransactionItem[] = [];

    for (const item of items) {
      const freshProduct = products.find((p) => p.id === item.product.id);
      if (!freshProduct) {
        const msg = `Produk "${item.product.name}" tidak ditemukan di database.`;
        showNotification('error', 'Produk Tidak Ditemukan', msg);
        throw new Error(msg);
      }

      if (freshProduct.status !== 'active') {
        const msg = `Produk "${freshProduct.name}" berstatus Nonaktif.`;
        showNotification('error', 'Produk Nonaktif', msg);
        throw new Error(msg);
      }

      if (freshProduct.stock < item.quantity) {
        const msg = `Stok produk "${freshProduct.name}" tidak mencukupi (Tersisa ${freshProduct.stock} ${freshProduct.unit}, diminta ${item.quantity}).`;
        showNotification('error', 'Stok Tidak Cukup', msg);
        throw new Error(msg);
      }

      const itemSubtotal = freshProduct.sellingPrice * item.quantity;
      totalAmount += itemSubtotal;

      trxItems.push({
        productId: freshProduct.id,
        sku: freshProduct.sku,
        barcode: freshProduct.barcode,
        productName: freshProduct.name,
        price: freshProduct.sellingPrice,
        costPrice: freshProduct.costPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        unit: freshProduct.unit
      });
    }

    // 5. Validate Santriwati Balance
    if (currentSantri.balance < totalAmount) {
      const msg = `Saldo tidak mencukupi. Saldo santriwati: Rp ${currentSantri.balance.toLocaleString('id-ID')}, Total belanja: Rp ${totalAmount.toLocaleString('id-ID')}.`;
      showNotification('error', 'Saldo Tidak Cukup', msg);
      throw new Error(msg);
    }

    // 6. Validate Santriwati Daily Limit
    const usedToday = getSantriDailyUsage(currentSantri.id);
    const sisaLimit = Math.max(0, currentSantri.dailyLimit - usedToday);
    if (totalAmount > sisaLimit) {
      const msg = `Transaksi melebihi sisa limit harian belanja santriwati! Sisa limit hari ini: Rp ${sisaLimit.toLocaleString('id-ID')}, Total belanja: Rp ${totalAmount.toLocaleString('id-ID')}.`;
      showNotification('error', 'Limit Harian Terlampaui', msg);
      throw new Error(msg);
    }

    // 7. Prepare Transaction Record
    const dateObj = new Date();
    const dateFormatted = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
    const invoiceNumber = `INV-${dateFormatted}-${randomSeq}`;
    const trxId = 'trx_' + Date.now() + '_' + randomSeq;
    const nowIso = dateObj.toISOString();

    const santriBalanceBefore = currentSantri.balance;
    const santriBalanceAfter = currentSantri.balance - totalAmount;
    const dailyLimitRemaining = Math.max(0, sisaLimit - totalAmount);

    const newTransaction: Transaction = {
      id: trxId,
      invoiceNumber,
      santriwatiId: currentSantri.id,
      santriId: currentSantri.id,
      santriwatiNis: currentSantri.nis,
      santriwatiName: currentSantri.name,
      santriwatiClass: currentSantri.classRoom,
      santriwatiDormitory: currentSantri.dormitory,
      cashierId: user?.id || 'usr-kasir-01',
      cashierName: user?.displayName || 'Kasir AMANAH Mart',
      items: trxItems,
      subtotal: totalAmount,
      discount: 0,
      totalAmount,
      paymentMethod: 'rfid_card',
      status: 'completed',
      santriBalanceBefore,
      santriBalanceAfter,
      dailyLimitRemaining,
      notes: notes || 'Pembelian Kantin Santriwati via RFID & PIN',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // Cache signature for idempotency
    recentTrxMapRef.current.set(trxSignature, { timestamp: Date.now(), trx: newTransaction });

    // 8. Atomic / Batch Execution
    // A. Update local states optimistically & persistently
    setSantriwati((prev) =>
      prev.map((s) =>
        s.id === currentSantri.id
          ? {
              ...s,
              balance: santriBalanceAfter,
              pinFailedAttempts: 0,
              pinLockedUntil: null,
              updatedAt: nowIso
            }
          : s
      )
    );

    setProducts((prev) =>
      prev.map((p) => {
        const cartMatch = items.find((i) => i.product.id === p.id);
        if (cartMatch) {
          return {
            ...p,
            stock: p.stock - cartMatch.quantity,
            updatedAt: nowIso
          };
        }
        return p;
      })
    );

    setTransactions((prev) => [newTransaction, ...prev]);

    // B. Firestore atomic batch write
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);

        // 1. Write transaction doc
        const trxDocRef = doc(db, 'transactions', newTransaction.id);
        batch.set(trxDocRef, newTransaction);

        // 2. Update santriwati balance doc
        const santriDocRef = doc(db, 'santriwati', currentSantri.id);
        batch.update(santriDocRef, {
          balance: santriBalanceAfter,
          pinFailedAttempts: 0,
          pinLockedUntil: null,
          updatedAt: nowIso
        });

        // 3. Update stock for each product
        for (const item of items) {
          const prodDocRef = doc(db, 'products', item.product.id);
          const currentProd = products.find((p) => p.id === item.product.id);
          const updatedStock = (currentProd?.stock || item.product.stock) - item.quantity;
          batch.update(prodDocRef, {
            stock: updatedStock,
            updatedAt: nowIso
          });
        }

        await batch.commit();
      } catch (err) {
        console.error('Firestore POS batch commit error:', err);
      }
    }

    // 9. Write audit log
    await logAuditAction(
      'TRANSACTION',
      'POS',
      `Transaksi kasir berhasil #${invoiceNumber} senilai Rp ${totalAmount.toLocaleString('id-ID')} untuk ${currentSantri.name} (NIS: ${currentSantri.nis}) oleh ${user?.displayName || 'Kasir'}.`
    );

    showNotification(
      'success',
      'Transaksi Berhasil',
      `Pembayaran #${invoiceNumber} senilai Rp ${totalAmount.toLocaleString('id-ID')} berhasil diproses.`
    );

    return newTransaction;
  };

  const getTransactionById = useCallback((id: string) => transactions.find((t) => t.id === id), [transactions]);

  const getTransactionsBySantriId = useCallback(
    (santriId: string) => {
      return transactions.filter((t) => t.santriwatiId === santriId || t.santriId === santriId);
    },
    [transactions]
  );

  // ==========================================
  // TOP UP SALDO SANTRIWATI
  // ==========================================

  const createTopupRequest = async (params: {
    santriId: string;
    amount: number;
    paymentMethod: 'qris' | 'transfer' | 'cash';
    proofPhotoURL?: string;
    notes?: string;
    requestedBy?: string;
  }): Promise<Topup> => {
    const santri = santriwati.find((s) => s.id === params.santriId);
    if (!santri) {
      throw new Error('Santriwati tidak ditemukan');
    }

    const nowIso = new Date().toISOString();
    const dateCode = nowIso.slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const topupNumber = `TOP-${dateCode}-${randSuffix}`;

    const newTopup: Topup = {
      id: 'top_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      topupNumber,
      santriId: santri.id,
      santriwatiId: santri.id,
      santriName: santri.name,
      santriNis: santri.nis,
      santriClass: santri.classRoom,
      santriDormitory: santri.dormitory,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      proofPhotoURL: params.proofPhotoURL,
      notes: params.notes,
      status: 'pending',
      requestedBy: params.requestedBy || user?.displayName || 'Kasir / Petugas',
      balanceBefore: santri.balance,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    setTopups((prev) => [newTopup, ...prev]);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'topups', newTopup.id), newTopup);
      } catch (err) {
        console.error('Firestore save topup error:', err);
      }
    }

    await logAuditAction(
      'TOPUP_REQUEST',
      'TOPUP',
      `Pengajuan top up saldo #${topupNumber} sebesar Rp ${params.amount.toLocaleString('id-ID')} untuk ${santri.name} (NIS: ${santri.nis}) via ${params.paymentMethod.toUpperCase()}`
    );

    showNotification(
      'success',
      'Pengajuan Top Up Berhasil',
      `Permohonan #${topupNumber} sebesar Rp ${params.amount.toLocaleString('id-ID')} menunggu verifikasi admin.`
    );

    return newTopup;
  };

  const approveTopup = async (topupId: string, notes?: string): Promise<void> => {
    const targetTopup = topups.find((t) => t.id === topupId);
    if (!targetTopup) {
      showNotification('error', 'Gagal', 'Data top up tidak ditemukan');
      return;
    }

    if (targetTopup.status === 'approved') {
      showNotification('info', 'Informasi', 'Permohonan top up ini sudah disetujui sebelumnya.');
      return;
    }

    const santri = santriwati.find((s) => s.id === targetTopup.santriId || s.id === targetTopup.santriwatiId);
    if (!santri) {
      showNotification('error', 'Gagal', 'Santriwati yang bersangkutan tidak ditemukan.');
      return;
    }

    const nowIso = new Date().toISOString();
    const balanceBefore = santri.balance || 0;
    const balanceAfter = balanceBefore + targetTopup.amount;

    const updatedTopup: Topup = {
      ...targetTopup,
      status: 'approved',
      approvedBy: user?.id || 'admin',
      approvedByName: user?.displayName || 'Admin',
      balanceBefore,
      balanceAfter,
      notes: notes || targetTopup.notes,
      updatedAt: nowIso
    };

    // A. Local State updates
    setTopups((prev) => prev.map((t) => (t.id === topupId ? updatedTopup : t)));
    setSantriwati((prev) =>
      prev.map((s) => (s.id === santri.id ? { ...s, balance: balanceAfter, updatedAt: nowIso } : s))
    );

    // B. Firestore atomic batch write
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        const topupDocRef = doc(db, 'topups', targetTopup.id);
        const santriDocRef = doc(db, 'santriwati', santri.id);

        batch.set(topupDocRef, updatedTopup, { merge: true });
        batch.update(santriDocRef, {
          balance: balanceAfter,
          updatedAt: nowIso
        });

        await batch.commit();
      } catch (err) {
        console.error('Firestore batch approve topup error:', err);
      }
    }

    // C. Write audit log
    await logAuditAction(
      'TOPUP_APPROVE',
      'TOPUP',
      `Menyetujui top up #${targetTopup.topupNumber} senilai Rp ${targetTopup.amount.toLocaleString('id-ID')} untuk ${santri.name} (NIS: ${santri.nis}). Saldo: Rp ${balanceBefore.toLocaleString('id-ID')} ➔ Rp ${balanceAfter.toLocaleString('id-ID')}`
    );

    showNotification(
      'success',
      'Top Up Disetujui',
      `Saldo ${santri.name} bertambah Rp ${targetTopup.amount.toLocaleString('id-ID')}. Total saldo sekarang Rp ${balanceAfter.toLocaleString('id-ID')}.`
    );
  };

  const rejectTopup = async (topupId: string, rejectionReason: string): Promise<void> => {
    const targetTopup = topups.find((t) => t.id === topupId);
    if (!targetTopup) {
      showNotification('error', 'Gagal', 'Data top up tidak ditemukan');
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedTopup: Topup = {
      ...targetTopup,
      status: 'rejected',
      rejectionReason: rejectionReason || 'Bukti transfer tidak valid atau dana belum masuk rekening pesantren.',
      approvedBy: user?.id || 'admin',
      approvedByName: user?.displayName || 'Admin',
      updatedAt: nowIso
    };

    setTopups((prev) => prev.map((t) => (t.id === topupId ? updatedTopup : t)));

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'topups', topupId), updatedTopup, { merge: true });
      } catch (err) {
        console.error('Firestore reject topup error:', err);
      }
    }

    await logAuditAction(
      'TOPUP_REJECT',
      'TOPUP',
      `Menolak permohonan top up #${targetTopup.topupNumber} (${targetTopup.santriName}). Alasan: ${rejectionReason}`
    );

    showNotification(
      'warning',
      'Top Up Ditolak',
      `Permohonan top up #${targetTopup.topupNumber} telah ditolak.`
    );
  };

  const deleteTopup = async (topupId: string): Promise<void> => {
    const target = topups.find((t) => t.id === topupId);
    setTopups((prev) => prev.filter((t) => t.id !== topupId));

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'topups', topupId));
      } catch (err) {
        console.error('Firestore delete topup error:', err);
      }
    }

    if (target) {
      await logAuditAction('DELETE', 'TOPUP', `Menghapus riwayat top up #${target.topupNumber}`);
    }
  };

  // ==========================================
  // INVENTORY: PENERIMAAN BARANG (STOCK INWARD)
  // ==========================================

  const createStockReceipt = async (params: CreateStockReceiptParams): Promise<StockReceipt> => {
    const supplier = suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) {
      throw new Error('Supplier tidak ditemukan');
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('Minimal harus ada 1 item barang dalam penerimaan');
    }

    const nowIso = new Date().toISOString();
    const dateCode = nowIso.slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `RCV-${dateCode}-${randSuffix}`;

    const calculatedItems = params.items.map((item) => ({
      ...item,
      subtotal: item.quantity * item.costPrice
    }));

    const totalCost = calculatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalItemsCount = calculatedItems.reduce((sum, item) => sum + item.quantity, 0);

    const newReceipt: StockReceipt = {
      id: 'rcv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      receiptNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      receivedBy: user?.id || 'admin',
      receivedByName: user?.displayName || 'Petugas Gudang',
      invoiceOrDoNumber: params.invoiceOrDoNumber,
      items: calculatedItems,
      totalCost,
      totalItemsCount,
      notes: params.notes,
      receivedDate: params.receivedDate || nowIso.slice(0, 10),
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // A. Update local state
    setStockReceipts((prev) => [newReceipt, ...prev]);

    // Update each product stock & costPrice in local state
    setProducts((prev) =>
      prev.map((prod) => {
        const receiptItem = calculatedItems.find((it) => it.productId === prod.id);
        if (receiptItem) {
          return {
            ...prod,
            stock: prod.stock + receiptItem.quantity,
            costPrice: receiptItem.costPrice > 0 ? receiptItem.costPrice : prod.costPrice,
            updatedAt: nowIso
          };
        }
        return prod;
      })
    );

    // B. Firestore batch commit
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        const rcvDocRef = doc(db, 'stockReceipts', newReceipt.id);
        batch.set(rcvDocRef, newReceipt);

        for (const item of calculatedItems) {
          const prodDocRef = doc(db, 'products', item.productId);
          const currentProd = products.find((p) => p.id === item.productId);
          const currentStock = currentProd?.stock || 0;
          batch.update(prodDocRef, {
            stock: currentStock + item.quantity,
            costPrice: item.costPrice > 0 ? item.costPrice : currentProd?.costPrice || item.costPrice,
            updatedAt: nowIso
          });
        }

        await batch.commit();
      } catch (err) {
        console.error('Firestore stock receipt batch error:', err);
      }
    }

    // C. Log audit action
    const itemNames = calculatedItems.map((i) => `${i.productName} (+${i.quantity})`).join(', ');
    await logAuditAction(
      'STOCK_RECEIPT',
      'INVENTORY',
      `Penerimaan barang #${receiptNumber} dari ${supplier.name}: ${calculatedItems.length} jenis item (${itemNames}), total Rp ${totalCost.toLocaleString('id-ID')}`
    );

    showNotification(
      'success',
      'Penerimaan Barang Berhasil Disimpan',
      `Faktur #${receiptNumber} tersimpan. Stok ${calculatedItems.length} produk bertambah sejumlah ${totalItemsCount} unit.`
    );

    return newReceipt;
  };

  // ==========================================
  // INVENTORY: STOK OPNAME (STOCK ADJUSTMENT)
  // ==========================================

  const recordStockAdjustment = async (params: RecordStockAdjustmentParams): Promise<StockAdjustment> => {
    const product = products.find((p) => p.id === params.productId);
    if (!product) {
      throw new Error('Produk tidak ditemukan');
    }

    const nowIso = new Date().toISOString();
    const dateCode = nowIso.slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const adjustmentNumber = `OPN-${dateCode}-${randSuffix}`;

    const systemStock = product.stock;
    const physicalStock = params.physicalStock;
    const difference = physicalStock - systemStock;
    const unitCostPrice = product.costPrice || 0;
    const totalValueDifference = difference * unitCostPrice;

    let adjType: StockAdjustment['adjustmentType'] = params.adjustmentType || 'other';
    if (!params.adjustmentType) {
      if (difference > 0) adjType = 'addition';
      else if (difference < 0) adjType = 'reduction';
      else adjType = 'audit_match';
    }

    const newAdjustment: StockAdjustment = {
      id: 'adj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      adjustmentNumber,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      categoryName: categories.find((c) => c.id === product.categoryId)?.name,
      systemStock,
      physicalStock,
      difference,
      unitCostPrice,
      totalValueDifference,
      adjustmentType: adjType,
      reason: params.reason || 'Stok opname berkala',
      adjustedBy: user?.id || 'admin',
      adjustedByName: user?.displayName || 'Petugas Opname',
      notes: params.notes,
      createdAt: nowIso
    };

    // A. Update local state
    setStockAdjustments((prev) => [newAdjustment, ...prev]);
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: physicalStock, updatedAt: nowIso } : p))
    );

    // B. Firestore write
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        const adjDocRef = doc(db, 'stockAdjustments', newAdjustment.id);
        const prodDocRef = doc(db, 'products', product.id);

        batch.set(adjDocRef, newAdjustment);
        batch.update(prodDocRef, {
          stock: physicalStock,
          updatedAt: nowIso
        });

        await batch.commit();
      } catch (err) {
        console.error('Firestore stock adjustment error:', err);
      }
    }

    // C. Audit log
    await logAuditAction(
      'STOCK_OPNAME',
      'INVENTORY',
      `Stok opname ${product.name} (SKU: ${product.sku}): Stok Sistem ${systemStock} ➔ Stok Fisik ${physicalStock} (Selisih: ${difference >= 0 ? '+' : ''}${difference}). Alasan: ${params.reason}`
    );

    showNotification(
      'success',
      'Stok Opname Berhasil Disimpan',
      `Stok sistem untuk "${product.name}" telah disesuaikan menjadi ${physicalStock} unit (Selisih: ${difference >= 0 ? '+' : ''}${difference}).`
    );

    return newAdjustment;
  };

  const recordBatchStockOpname = async (
    adjustments: Array<{ productId: string; physicalStock: number; reason: string; notes?: string }>
  ): Promise<StockAdjustment[]> => {
    const results: StockAdjustment[] = [];
    const nowIso = new Date().toISOString();
    const dateCode = nowIso.slice(0, 10).replace(/-/g, '');

    const batchUpdates: Array<{ product: Product; newAdj: StockAdjustment; physicalStock: number }> = [];

    for (let i = 0; i < adjustments.length; i++) {
      const item = adjustments[i];
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      const systemStock = product.stock;
      const physicalStock = item.physicalStock;
      const difference = physicalStock - systemStock;
      const unitCostPrice = product.costPrice || 0;
      const totalValueDifference = difference * unitCostPrice;

      let adjType: StockAdjustment['adjustmentType'] = 'other';
      if (difference > 0) adjType = 'addition';
      else if (difference < 0) adjType = 'reduction';
      else adjType = 'audit_match';

      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const adjustmentNumber = `OPN-${dateCode}-${randSuffix}`;

      const newAdjustment: StockAdjustment = {
        id: 'adj_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 6),
        adjustmentNumber,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        categoryName: categories.find((c) => c.id === product.categoryId)?.name,
        systemStock,
        physicalStock,
        difference,
        unitCostPrice,
        totalValueDifference,
        adjustmentType: adjType,
        reason: item.reason || 'Stok opname massal berkala',
        adjustedBy: user?.id || 'admin',
        adjustedByName: user?.displayName || 'Petugas Opname',
        notes: item.notes,
        createdAt: nowIso
      };

      results.push(newAdjustment);
      batchUpdates.push({ product, newAdj: newAdjustment, physicalStock });
    }

    if (results.length === 0) {
      showNotification('warning', 'Peringatan', 'Tidak ada data produk yang disesuaikan');
      return [];
    }

    // A. Update local state
    setStockAdjustments((prev) => [...results, ...prev]);
    setProducts((prev) =>
      prev.map((p) => {
        const update = batchUpdates.find((u) => u.product.id === p.id);
        if (update) {
          return { ...p, stock: update.physicalStock, updatedAt: nowIso };
        }
        return p;
      })
    );

    // B. Firestore commit
    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        for (const update of batchUpdates) {
          const adjDocRef = doc(db, 'stockAdjustments', update.newAdj.id);
          const prodDocRef = doc(db, 'products', update.product.id);
          batch.set(adjDocRef, update.newAdj);
          batch.update(prodDocRef, {
            stock: update.physicalStock,
            updatedAt: nowIso
          });
        }
        await batch.commit();
      } catch (err) {
        console.error('Firestore batch stock opname error:', err);
      }
    }

    // C. Write audit log
    await logAuditAction(
      'STOCK_OPNAME',
      'INVENTORY',
      `Stok opname massal: ${results.length} produk disinkronkan ke stok fisik aktual oleh ${user?.displayName || 'Petugas'}`
    );

    showNotification(
      'success',
      'Stok Opname Berhasil',
      `${results.length} produk berhasil disinkronkan ke stok fisik aktual.`
    );

    return results;
  };

  // Settings
  const updateSettings = async (data: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...data }));
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'settings', 'general'), { ...settings, ...data });
    }
    await logAuditAction('UPDATE', 'SETTINGS', `Memperbarui konfigurasi sistem aplikasi dan pembayaran`);
    showNotification('success', 'Pengaturan Disimpan', 'Konfigurasi aplikasi berhasil diperbarui.');
  };

  // Reset to seed data
  const resetToDefaultSeedData = () => {
    setSantriwati(initialSantriwati);
    setProducts(initialProducts);
    setCategories(initialCategories);
    setSuppliers(initialSuppliers);
    setUsers(initialUsers);
    setTransactions(initialTransactions);
    setTopups(initialTopups);
    setStockReceipts(initialStockReceipts);
    setStockAdjustments(initialStockAdjustments);
    setAuditLogs(initialAuditLogs);
    setSettings(initialSettings);

    localStorage.setItem(STORAGE_KEYS.santriwati, JSON.stringify(initialSantriwati));
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(initialProducts));
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(initialCategories));
    localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(initialSuppliers));
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(initialUsers));
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(initialTransactions));
    localStorage.setItem(STORAGE_KEYS.topups, JSON.stringify(initialTopups));
    localStorage.setItem(STORAGE_KEYS.stockReceipts, JSON.stringify(initialStockReceipts));
    localStorage.setItem(STORAGE_KEYS.stockAdjustments, JSON.stringify(initialStockAdjustments));
    localStorage.setItem(STORAGE_KEYS.auditLogs, JSON.stringify(initialAuditLogs));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(initialSettings));

    showNotification('info', 'Data Direset', 'Semua data telah diatur ulang ke data inisial pondok pesantren.');
  };

  // Calculated Metrics
  const metrics = useMemo(() => {
    const totalSantriwati = santriwati.length;
    const activeSantriwati = santriwati.filter((s) => s.status === 'active').length;
    const totalProducts = products.length;
    const lowStockProducts = products.filter((p) => p.stock <= p.minStock).length;
    const totalCategories = categories.length;
    const totalSuppliers = suppliers.length;
    const totalUsers = users.length;
    const totalInventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
    const totalSantriBalance = santriwati.reduce((sum, s) => sum + (s.balance || 0), 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCompletedTrx = transactions.filter(
      (t) => t.status === 'completed' && t.createdAt && t.createdAt.slice(0, 10) === todayStr
    );
    const totalTransactions = transactions.length;
    const todayTransactionsCount = todayCompletedTrx.length;
    const todayRevenue = todayCompletedTrx.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const pendingTopupsCount = topups.filter((t) => t.status === 'pending').length;
    const totalTopupsApproved = topups
      .filter((t) => t.status === 'approved' || t.status === 'success')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalStockReceipts = stockReceipts.length;
    const totalStockAdjustments = stockAdjustments.length;

    return {
      totalSantriwati,
      activeSantriwati,
      totalProducts,
      lowStockProducts,
      totalCategories,
      totalSuppliers,
      totalUsers,
      totalInventoryValue,
      totalSantriBalance,
      totalTransactions,
      todayTransactionsCount,
      todayRevenue,
      pendingTopupsCount,
      totalTopupsApproved,
      totalStockReceipts,
      totalStockAdjustments
    };
  }, [santriwati, products, categories, suppliers, users, transactions, topups, stockReceipts, stockAdjustments]);

  // Enrich categories with actual dynamic product count
  const enrichedCategories = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      productCount: products.filter((p) => p.categoryId === cat.id).length
    }));
  }, [categories, products]);

  return (
    <DataContext.Provider
      value={{
        santriwati,
        products,
        categories: enrichedCategories,
        suppliers,
        users,
        transactions,
        topups,
        stockReceipts,
        stockAdjustments,
        auditLogs,
        settings,
        isFirebaseActive: isFirebaseConfigured,
        isLoadingData,
        addSantriwati,
        updateSantriwati,
        deleteSantriwati,
        toggleSantriStatus,
        getSantriwatiById,
        getSantriByRfid,
        getSantriDailyUsage,
        recordPinFailedAttempt,
        recordPinSuccess,
        unlockSantriPin,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        getProductById,
        addCategory,
        updateCategory,
        deleteCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addUser,
        updateUser,
        deleteUser,
        processPosTransaction,
        getTransactionById,
        getTransactionsBySantriId,
        createTopupRequest,
        approveTopup,
        rejectTopup,
        deleteTopup,
        createStockReceipt,
        recordStockAdjustment,
        recordBatchStockOpname,
        updateSettings,
        logAuditAction,
        resetToDefaultSeedData,
        metrics
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

