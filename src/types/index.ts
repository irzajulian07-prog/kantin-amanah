export type UserRole = 'admin' | 'kasir' | 'supervisor';

export type AccountStatus = 'active' | 'inactive';
export type SantriStatus = 'active' | 'inactive';
export type ProductStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  status: AccountStatus;
  phoneNumber?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Santriwati {
  id: string;
  nis: string;                 // Nomor Induk Santri (UNIK)
  name: string;                // Nama Santriwati
  classRoom: string;           // Kelas
  dormitory: string;           // Asrama
  rfidUid: string;             // UID RFID (UNIK)
  photoURL?: string;           // Foto Profil (Firebase Storage / URL)
  balance: number;             // Saldo Kantin (IDR)
  dailyLimit: number;          // Limit Harian Belanja (IDR)
  status: SantriStatus;        // Status Aktif / Nonaktif
  
  // Security Fields (PIN) - Never plaintext
  pinHash: string;             // SHA-256 Hashed PIN
  pinFailedAttempts: number;   // Count of consecutive failed PIN attempts
  pinLockedUntil: string | null; // ISO timestamp if locked, otherwise null
  
  nisn?: string;               // Nomor Induk Siswa Nasional
  guardianName?: string;       // Nama Wali
  guardianPhone?: string;      // Kontak Wali
  barcode?: string;            // Barcode Identitas Kartu
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  code: string;         // e.g., 'MAKANAN', 'MINUMAN', 'ATK'
  name: string;
  icon?: string;        // Lucide icon name
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  productCount?: number;
}

export interface Supplier {
  id: string;
  code: string;         // e.g., 'SUP-001'
  name: string;         // Nama PT/Toko/Distributor
  picName: string;      // Penanggung Jawab / Sales
  phone: string;
  email?: string;
  address: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: string;
}

export type ProductUnit = 'pcs' | 'pack' | 'botol' | 'buah' | 'porsi' | 'box' | 'sachet';

export interface Product {
  id: string;
  sku: string;          // Kode Produk
  barcode: string;      // Barcode Scanner Code
  name: string;
  categoryId: string;
  categoryName?: string;
  costPrice: number;    // Harga Beli / Pokok
  sellingPrice: number; // Harga Jual
  stock: number;        // Stok Saat Ini
  minStock: number;     // Minimum Stok untuk Notifikasi
  unit: ProductUnit;
  supplierId?: string;
  supplierName?: string;
  photoURL?: string;
  status: ProductStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  productId: string;
  sku?: string;
  barcode?: string;
  productName: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  unit?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  santriwatiId: string;
  santriId?: string; // alias for backwards compatibility
  santriwatiNis: string;
  santriwatiName: string;
  santriwatiClass?: string;
  santriwatiDormitory?: string;
  cashierId: string;
  cashierName: string;
  items: TransactionItem[];
  subtotal: number;
  discount?: number;
  totalAmount: number;
  paymentMethod: 'rfid_card' | 'balance' | 'cash' | 'qris';
  status: 'completed' | 'cancelled' | 'pending';
  santriBalanceBefore?: number;
  santriBalanceAfter?: number;
  dailyLimitRemaining?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Topup {
  id: string;
  topupNumber: string;
  santriId: string;
  santriwatiId?: string;
  santriName: string;
  santriNis?: string;
  santriClass?: string;
  santriDormitory?: string;
  amount: number;
  paymentMethod: 'qris' | 'transfer' | 'cash';
  proofPhotoURL?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'success';
  requestedBy?: string;
  approvedBy?: string;
  approvedByName?: string;
  rejectionReason?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface StockReceiptItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
  unit?: string;
}

export interface StockReceipt {
  id: string;
  receiptNumber: string;
  supplierId: string;
  supplierName: string;
  receivedBy: string;
  receivedByName: string;
  invoiceOrDoNumber?: string;
  items: StockReceiptItem[];
  totalCost: number;
  totalItemsCount: number;
  notes?: string;
  receivedDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  productId: string;
  productName: string;
  sku?: string;
  categoryName?: string;
  systemStock: number;
  physicalStock: number;
  difference: number; // physicalStock - systemStock
  unitCostPrice: number;
  totalValueDifference: number; // difference * unitCostPrice
  adjustmentType: 'addition' | 'reduction' | 'loss' | 'damage' | 'audit_match' | 'expired' | 'other';
  reason: string;
  adjustedBy: string;
  adjustedByName: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'RFID_SCAN'
    | 'STATUS_CHANGE'
    | 'TRANSACTION'
    | 'PIN_FAILED'
    | 'PIN_LOCKED'
    | 'ACCOUNT_LOCKED'
    | 'PIN_VERIFIED'
    | 'RESET_PIN'
    | 'TOPUP_REQUEST'
    | 'TOPUP_APPROVE'
    | 'TOPUP_REJECT'
    | 'STOCK_RECEIPT'
    | 'STOCK_OPNAME'
    | 'STOCK_ADJUST'
    | 'BALANCE_ADJUST';
  module:
    | 'AUTH'
    | 'SANTRIWATI'
    | 'PRODUCTS'
    | 'CATEGORIES'
    | 'SUPPLIERS'
    | 'USERS'
    | 'SETTINGS'
    | 'POS'
    | 'INVENTORY'
    | 'FINANCE'
    | 'TOPUP';
  details: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AppSettings {
  appName: string;
  pesantrenName: string;
  tagline: string;
  logoURL?: string;
  qrisURL?: string;
  paymentBank: string;
  paymentAccountName: string;
  paymentAccountNumber: string;
  receiptFooter: string;
  defaultDailyLimit: number;
  contactEmail: string;
  contactPhone: string;
  address: string;
}
