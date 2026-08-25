import {
  Santriwati,
  Product,
  Category,
  Supplier,
  User,
  AppSettings,
  AuditLog,
  Transaction,
  Topup,
  StockReceipt,
  StockAdjustment
} from '../types';

export const initialUsers: User[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@amanah.sch.id',
    displayName: 'Ustadzah Fatimah Azzahra (Admin)',
    role: 'admin',
    photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    phoneNumber: '081234567890',
    createdAt: '2025-01-01T08:00:00.000Z',
    lastLogin: '2025-02-15T07:30:00.000Z'
  },
  {
    id: 'usr-kasir-01',
    email: 'kasir@amanah.sch.id',
    displayName: 'Siti Nurhaliza (Kasir Kantin)',
    role: 'kasir',
    photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    phoneNumber: '081298765432',
    createdAt: '2025-01-05T09:00:00.000Z',
    lastLogin: '2025-02-15T06:45:00.000Z'
  },
  {
    id: 'usr-spv-01',
    email: 'supervisor@amanah.sch.id',
    displayName: 'Ustadz Ahmad Fauzi (Supervisor/Bendahara)',
    role: 'supervisor',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    phoneNumber: '081345678901',
    createdAt: '2025-01-02T10:00:00.000Z',
    lastLogin: '2025-02-14T16:20:00.000Z'
  }
];

export const initialCategories: Category[] = [
  {
    id: 'cat-01',
    code: 'MAKANAN',
    name: 'Makanan & Lauk Pauk',
    icon: 'Utensils',
    description: 'Nasi, lauk siap saji, roti, dan makanan pokok santriwati',
    status: 'active',
    createdAt: '2025-01-01T08:00:00.000Z'
  },
  {
    id: 'cat-02',
    code: 'MINUMAN',
    name: 'Minuman & Susu',
    icon: 'Coffee',
    description: 'Air mineral, susu steril, sari kurma, jus, dan teh hangat',
    status: 'active',
    createdAt: '2025-01-01T08:00:00.000Z'
  },
  {
    id: 'cat-03',
    code: 'SNACK',
    name: 'Snack & Camilan Sehat',
    icon: 'Cookie',
    description: 'Biskuit gandum, kurma, kacang almond, keripik pisang, wafer',
    status: 'active',
    createdAt: '2025-01-01T08:00:00.000Z'
  },
  {
    id: 'cat-04',
    code: 'ATK_KITAB',
    name: 'Alat Tulis & Buku Catatan',
    icon: 'BookOpen',
    description: 'Pulpen, buku tulis pesantren, notes mutabaah, spidol, pensil',
    status: 'active',
    createdAt: '2025-01-01T08:00:00.000Z'
  },
  {
    id: 'cat-05',
    code: 'KEBERSIHAN',
    name: 'Perlengkapan Asrama',
    icon: 'Sparkles',
    description: 'Sabun mandi, sampo, pasta gigi, deterjen cair, tisu',
    status: 'active',
    createdAt: '2025-01-01T08:00:00.000Z'
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-01',
    code: 'SUP-001',
    name: 'CV Berkah Dapur Utama',
    picName: 'Haji Mansur',
    phone: '081288991122',
    email: 'berkahdapur@gmail.com',
    address: 'Jl. Raya Pesantren No. 45, Cirebon',
    status: 'active',
    notes: 'Pemasok makanan catering dan roti harian santri',
    createdAt: '2025-01-02T08:00:00.000Z'
  },
  {
    id: 'sup-02',
    code: 'SUP-002',
    name: 'PT Segar Alami Sejahtera',
    picName: 'Ibu Rahmawati',
    phone: '081399887766',
    email: 'info@segaralami.co.id',
    address: 'Kawasan Niaga Sentra Blok B-12, Kuningan',
    status: 'active',
    notes: 'Distributor resmi air mineral galon & botol, susu steril',
    createdAt: '2025-01-03T08:00:00.000Z'
  },
  {
    id: 'sup-03',
    code: 'SUP-003',
    name: 'Toko Kitab & ATK Barokah',
    picName: 'Ustadz Munir',
    phone: '085712345678',
    email: 'atkbarokah@yahoo.com',
    address: 'Kompleks Pertokoan Santri Mandiri No. 8',
    status: 'active',
    notes: 'Pemasok alat tulis, buku tulis bergaris, dan perlengkapan asrama',
    createdAt: '2025-01-04T08:00:00.000Z'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-01',
    sku: 'PRD-NSB-01',
    barcode: '899100100101',
    name: 'Nasi Ayam Bakar Madu + Lalapan',
    categoryId: 'cat-01',
    categoryName: 'Makanan & Lauk Pauk',
    costPrice: 12000,
    sellingPrice: 15000,
    stock: 45,
    minStock: 10,
    unit: 'porsi',
    supplierId: 'sup-01',
    supplierName: 'CV Berkah Dapur Utama',
    photoURL: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80',
    status: 'active',
    description: 'Menu makan siang higienis bergizi dengan ayam bakar bumbu madu khas pondok',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'prod-02',
    sku: 'PRD-ROTI-02',
    barcode: '899100100102',
    name: 'Roti Gandum Isi Cokelat Keju',
    categoryId: 'cat-01',
    categoryName: 'Makanan & Lauk Pauk',
    costPrice: 4000,
    sellingPrice: 5500,
    stock: 60,
    minStock: 15,
    unit: 'pcs',
    supplierId: 'sup-01',
    supplierName: 'CV Berkah Dapur Utama',
    photoURL: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
    status: 'active',
    description: 'Roti empuk bergizi untuk sarapan pagi sebelum halaqah subuh',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'prod-03',
    sku: 'PRD-MIN-01',
    barcode: '899100100103',
    name: 'Air Mineral Santri 600ml',
    categoryId: 'cat-02',
    categoryName: 'Minuman & Susu',
    costPrice: 2200,
    sellingPrice: 3000,
    stock: 120,
    minStock: 30,
    unit: 'botol',
    supplierId: 'sup-02',
    supplierName: 'PT Segar Alami Sejahtera',
    photoURL: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400&auto=format&fit=crop&q=80',
    status: 'active',
    description: 'Air mineral murni pH seimbang kemasan botol praktis',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'prod-04',
    sku: 'PRD-SUSU-02',
    barcode: '899100100104',
    name: 'Susu Steril Kurma Madu 200ml',
    categoryId: 'cat-02',
    categoryName: 'Minuman & Susu',
    costPrice: 7500,
    sellingPrice: 9500,
    stock: 8,
    minStock: 15,
    unit: 'botol',
    supplierId: 'sup-02',
    supplierName: 'PT Segar Alami Sejahtera',
    photoURL: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
    status: 'active',
    description: 'Susu bergizi tinggi untuk stamina menghafal Al-Qur\'an',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'prod-05',
    sku: 'PRD-SNK-01',
    barcode: '899100100105',
    name: 'Kurma Sukari Premium Mini Pack 100g',
    categoryId: 'cat-03',
    categoryName: 'Snack & Camilan Sehat',
    costPrice: 10000,
    sellingPrice: 13000,
    stock: 35,
    minStock: 10,
    unit: 'pack',
    supplierId: 'sup-03',
    supplierName: 'Toko Kitab & ATK Barokah',
    photoURL: 'https://images.unsplash.com/photo-1594982672728-66b96e47602f?w=400&auto=format&fit=crop&q=80',
    status: 'active',
    description: 'Kurma basah manis alami dan kaya serat',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'prod-06',
    sku: 'PRD-ATK-01',
    barcode: '899100100106',
    name: 'Buku Tulis Catatan Santriwati (58 Hal)',
    categoryId: 'cat-04',
    categoryName: 'Alat Tulis & Buku Catatan',
    costPrice: 3500,
    sellingPrice: 5000,
    stock: 80,
    minStock: 20,
    unit: 'pcs',
    supplierId: 'sup-03',
    supplierName: 'Toko Kitab & ATK Barokah',
    photoURL: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    status: 'active',
    description: 'Buku catatan bersampul rapi untuk materi kepesantrenan',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'prod-07',
    sku: 'PRD-ATK-02',
    barcode: '899100100107',
    name: 'Pulpen Gel Hitam Halus 0.5mm',
    categoryId: 'cat-04',
    categoryName: 'Alat Tulis & Buku Catatan',
    costPrice: 2000,
    sellingPrice: 3000,
    stock: 95,
    minStock: 25,
    unit: 'pcs',
    supplierId: 'sup-03',
    supplierName: 'Toko Kitab & ATK Barokah',
    photoURL: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop&q=80',
    status: 'active',
    description: 'Tinta hitam pekat cepat kering tidak tembus kertas',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z'
  },
  {
    id: 'prod-08',
    sku: 'PRD-SBN-01',
    barcode: '899100100108',
    name: 'Sabun Mandi Cair Anti Bakteri 250ml',
    categoryId: 'cat-05',
    categoryName: 'Perlengkapan Asrama',
    costPrice: 14000,
    sellingPrice: 17500,
    stock: 4,
    minStock: 10,
    unit: 'botol',
    supplierId: 'sup-02',
    supplierName: 'PT Segar Alami Sejahtera',
    photoURL: 'https://images.unsplash.com/photo-1608248597359-5a507a514d79?w=400&auto=format&fit=crop&q=80',
    status: 'active',
    description: 'Menjaga kebersihan dan higienitas santriwati di asrama',
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z'
  }
];

export const initialSantriwati: Santriwati[] = [
  {
    id: 'santri-01',
    nis: '202401001',
    nisn: '0089123451',
    name: 'Aisyah Humaira Putri',
    classRoom: 'Kelas 3 Ulya (Tahfizh)',
    dormitory: 'Asrama Khadijah Lt. 2 (Kamar 204)',
    rfidUid: 'E28068940000',
    guardianName: 'Drs. H. Hendra Wijaya',
    guardianPhone: '081233445566',
    balance: 185000,
    dailyLimit: 30000,
    status: 'active',
    pinHash: '8e6bfd1c16921fb9d5c4149021876543b59dfa357597be7d47668615967bbf9e',
    pinFailedAttempts: 0,
    pinLockedUntil: null,
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    barcode: 'SNT-202401001',
    notes: 'Alergi kacang tanah',
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-01-05T08:00:00.000Z'
  },
  {
    id: 'santri-02',
    nis: '202401002',
    nisn: '0089123452',
    name: 'Zahra Maryam Nabila',
    classRoom: 'Kelas 2 Wustha A',
    dormitory: 'Asrama Aisyah Lt. 1 (Kamar 102)',
    rfidUid: 'E28068940001',
    guardianName: 'Hj. Rina Kurniawati, S.Pd',
    guardianPhone: '081377889900',
    balance: 95000,
    dailyLimit: 25000,
    status: 'active',
    pinHash: '8e6bfd1c16921fb9d5c4149021876543b59dfa357597be7d47668615967bbf9e',
    pinFailedAttempts: 0,
    pinLockedUntil: null,
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    barcode: 'SNT-202401002',
    notes: 'Kebutuhan obat asma di poskestren',
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-01-05T08:00:00.000Z'
  },
  {
    id: 'santri-03',
    nis: '202401003',
    nisn: '0089123453',
    name: 'Khadijah Nur Salsabila',
    classRoom: 'Kelas 1 Ula B',
    dormitory: 'Asrama Fatimah Lt. 2 (Kamar 201)',
    rfidUid: 'E28068940002',
    guardianName: 'Bapak Rudi Hartono',
    guardianPhone: '085611223344',
    balance: 240000,
    dailyLimit: 35000,
    status: 'active',
    pinHash: '8e6bfd1c16921fb9d5c4149021876543b59dfa357597be7d47668615967bbf9e',
    pinFailedAttempts: 0,
    pinLockedUntil: null,
    photoURL: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    barcode: 'SNT-202401003',
    notes: 'Santriwati baru pindahan Bandung',
    createdAt: '2025-01-05T08:00:00.000Z',
    updatedAt: '2025-01-05T08:00:00.000Z'
  },
  {
    id: 'santri-04',
    nis: '202401004',
    nisn: '0089123454',
    name: 'Nafisah Syahidah Al-Kautsar',
    classRoom: 'Kelas 3 Ulya (Kitab Kuning)',
    dormitory: 'Asrama Khadijah Lt. 1 (Kamar 106)',
    rfidUid: 'E28068940003',
    guardianName: 'Ustadz Syamsul Hadi',
    guardianPhone: '081299001122',
    balance: 45000,
    dailyLimit: 20000,
    status: 'active',
    pinHash: '8e6bfd1c16921fb9d5c4149021876543b59dfa357597be7d47668615967bbf9e',
    pinFailedAttempts: 0,
    pinLockedUntil: null,
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    barcode: 'SNT-202401004',
    notes: 'Pengurus Asrama bidang kebersihan',
    createdAt: '2025-01-06T08:00:00.000Z',
    updatedAt: '2025-01-06T08:00:00.000Z'
  },
  {
    id: 'santri-05',
    nis: '202401005',
    nisn: '0089123455',
    name: 'Fathimah Az-Zahra Ramadhani',
    classRoom: 'Kelas 2 Wustha B',
    dormitory: 'Asrama Aisyah Lt. 2 (Kamar 208)',
    rfidUid: 'E28068940004',
    guardianName: 'Ir. Taufik Ismail',
    guardianPhone: '087811992288',
    balance: 310000,
    dailyLimit: 40000,
    status: 'active',
    pinHash: '8e6bfd1c16921fb9d5c4149021876543b59dfa357597be7d47668615967bbf9e',
    pinFailedAttempts: 0,
    pinLockedUntil: null,
    photoURL: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200&auto=format&fit=crop&q=80',
    barcode: 'SNT-202401005',
    notes: 'Kamar 208',
    createdAt: '2025-01-06T08:00:00.000Z',
    updatedAt: '2025-01-06T08:00:00.000Z'
  }
];

export const initialSettings: AppSettings = {
  appName: 'AMANAH – Smart Mart',
  pesantrenName: 'Pondok Pesantren Putri Darul Amanah',
  tagline: 'Sistem Kantin Digital Santriwati Terintegrasi & Berkah',
  logoURL: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
  qrisURL: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126570014ID.DANA.WWW01189360091808572779936502150857277993655204581253033605802ID5920Vidia%20Varageta%20Adinda6007SEMARANG6304ABCD',
  paymentBank: 'Dana',
  paymentAccountName: 'Vidia Varageta Adinda',
  paymentAccountNumber: '085727799365',
  receiptFooter: 'Jazakumullah Khairan Katsiran atas kunjungan dan doa santriwati.',
  defaultDailyLimit: 30000,
  contactEmail: 'kantin@darulamanah.ac.id',
  contactPhone: '0812-3456-7890',
  address: 'Jl. Pesantren Darul Amanah No. 99, Sukorejo'
};

export const initialTopups: Topup[] = [
  {
    id: 'top-20250215-001',
    topupNumber: 'TOP-20250215-001',
    santriId: 'santri-01',
    santriwatiId: 'santri-01',
    santriName: 'Aisyah Humaira Putri',
    santriNis: '202401001',
    santriClass: 'Kelas 3 Ulya (Tahfizh)',
    santriDormitory: 'Asrama Khadijah Lt. 2 (Kamar 204)',
    amount: 100000,
    paymentMethod: 'qris',
    proofPhotoURL: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    notes: 'Top up bulanan dari Umi Aisyah via QRIS',
    status: 'approved',
    requestedBy: 'Wali Santri (H. Ahmad Dahlan)',
    approvedBy: 'usr-admin-01',
    approvedByName: 'Ustadzah Fatimah Azzahra (Admin)',
    balanceBefore: 103000,
    balanceAfter: 203000,
    createdAt: '2025-02-14T09:15:00.000Z',
    updatedAt: '2025-02-14T09:30:00.000Z'
  },
  {
    id: 'top-20250215-002',
    topupNumber: 'TOP-20250215-002',
    santriId: 'santri-02',
    santriwatiId: 'santri-02',
    santriName: 'Zahra Maryam Nabila',
    santriNis: '202401002',
    santriClass: 'Kelas 2 Wustha A',
    santriDormitory: 'Asrama Aisyah Lt. 1 (Kamar 102)',
    amount: 150000,
    paymentMethod: 'transfer',
    proofPhotoURL: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    notes: 'Transfer Dana wali santri untuk uang saku',
    status: 'approved',
    requestedBy: 'Wali Santri (Drs. H. M. Ridwan)',
    approvedBy: 'usr-admin-01',
    approvedByName: 'Ustadzah Fatimah Azzahra (Admin)',
    balanceBefore: 0,
    balanceAfter: 150000,
    createdAt: '2025-02-15T08:00:00.000Z',
    updatedAt: '2025-02-15T08:10:00.000Z'
  },
  {
    id: 'top-20250215-003',
    topupNumber: 'TOP-20250215-003',
    santriId: 'santri-03',
    santriwatiId: 'santri-03',
    santriName: 'Khadijah Nurul Izzah',
    santriNis: '202401003',
    santriClass: 'Kelas 1 Wustha B',
    santriDormitory: 'Asrama Khadijah Lt. 1 (Kamar 105)',
    amount: 50000,
    paymentMethod: 'qris',
    proofPhotoURL: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    notes: 'Top up QRIS Dana santriwati',
    status: 'pending',
    requestedBy: 'Wali Santri (Ust. Syarifuddin, M.Pd)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'top-20250215-004',
    topupNumber: 'TOP-20250215-004',
    santriId: 'santri-04',
    santriwatiId: 'santri-04',
    santriName: 'Salma Salsabila Rahma',
    santriNis: '202401004',
    santriClass: 'Kelas 3 Ulya (IPA)',
    santriDormitory: 'Asrama Hafshah (Kamar 201)',
    amount: 75000,
    paymentMethod: 'cash',
    notes: 'Setor tunai langsung di kasir kantin',
    status: 'pending',
    requestedBy: 'Kasir Kantin',
    createdAt: new Date().toISOString()
  }
];

export const initialStockReceipts: StockReceipt[] = [
  {
    id: 'rcv-20250214-001',
    receiptNumber: 'RCV-20250214-001',
    supplierId: 'sup-02',
    supplierName: 'Sari Roti Sukorejo Official',
    receivedBy: 'usr-admin-01',
    receivedByName: 'Ustadzah Fatimah Azzahra (Admin)',
    invoiceOrDoNumber: 'SJ-SR-20250214-88',
    items: [
      {
        productId: 'prod-02',
        productName: 'Roti Gandum Isi Cokelat Keju',
        sku: 'PRD-ROTI-02',
        quantity: 50,
        costPrice: 4000,
        subtotal: 200000,
        unit: 'pcs'
      }
    ],
    totalCost: 200000,
    totalItemsCount: 50,
    notes: 'Pengiriman roti gandum fresh batch pagi',
    receivedDate: '2025-02-14',
    createdAt: '2025-02-14T07:30:00.000Z'
  },
  {
    id: 'rcv-20250215-001',
    receiptNumber: 'RCV-20250215-001',
    supplierId: 'sup-03',
    supplierName: 'Distributor Air Minum Barokah',
    receivedBy: 'usr-admin-01',
    receivedByName: 'Ustadzah Fatimah Azzahra (Admin)',
    invoiceOrDoNumber: 'FAK-AMB-2025-091',
    items: [
      {
        productId: 'prod-03',
        productName: 'Air Mineral Santri 600ml',
        sku: 'PRD-MIN-01',
        quantity: 120,
        costPrice: 2200,
        subtotal: 264000,
        unit: 'botol'
      },
      {
        productId: 'prod-04',
        productName: 'Susu Steril Kurma Madu 200ml',
        sku: 'PRD-SUSU-02',
        quantity: 48,
        costPrice: 7500,
        subtotal: 360000,
        unit: 'botol'
      }
    ],
    totalCost: 624000,
    totalItemsCount: 168,
    notes: 'Restock minuman dan susu suplemen santri',
    receivedDate: '2025-02-15',
    createdAt: '2025-02-15T08:00:00.000Z'
  }
];

export const initialStockAdjustments: StockAdjustment[] = [
  {
    id: 'adj-20250210-001',
    adjustmentNumber: 'ADJ-20250210-001',
    productId: 'prod-02',
    productName: 'Roti Gandum Isi Cokelat Keju',
    sku: 'PRD-ROTI-02',
    categoryName: 'Makanan & Snack',
    systemStock: 22,
    physicalStock: 20,
    difference: -2,
    unitCostPrice: 4000,
    totalValueDifference: -8000,
    adjustmentType: 'damage',
    reason: '2 pcs roti kemasan sobek saat pemindahan rak',
    adjustedBy: 'usr-admin-01',
    adjustedByName: 'Ustadzah Fatimah Azzahra (Admin)',
    notes: 'Sudah disetujui pemusnahan barang rusak',
    createdAt: '2025-02-10T14:20:00.000Z'
  },
  {
    id: 'adj-20250214-001',
    adjustmentNumber: 'ADJ-20250214-001',
    productId: 'prod-03',
    productName: 'Air Mineral Santri 600ml',
    sku: 'PRD-MIN-01',
    categoryName: 'Minuman Segar',
    systemStock: 95,
    physicalStock: 95,
    difference: 0,
    unitCostPrice: 2200,
    totalValueDifference: 0,
    adjustmentType: 'audit_match',
    reason: 'Opname rutin berkala - stok fisik sesuai tepat',
    adjustedBy: 'usr-admin-01',
    adjustedByName: 'Ustadzah Fatimah Azzahra (Admin)',
    notes: 'Kondisi stok sangat baik dan tertata rapi',
    createdAt: '2025-02-14T16:00:00.000Z'
  }
];

// Helper for generating relative dates
const getPastDateIso = (daysAgo: number, hours: number = 10, minutes: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const initialTransactions: Transaction[] = [
  // Today's transactions
  {
    id: 'trx-today-001',
    invoiceNumber: 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-0001',
    santriwatiId: 'santri-01',
    santriId: 'santri-01',
    santriwatiNis: '202401001',
    santriwatiName: 'Aisyah Humaira Putri',
    santriwatiClass: 'Kelas 3 Ulya (Tahfizh)',
    santriwatiDormitory: 'Asrama Khadijah Lt. 2 (Kamar 204)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-01',
        sku: 'PRD-NSB-01',
        productName: 'Nasi Ayam Bakar Madu + Lalapan',
        price: 15000,
        costPrice: 12000,
        quantity: 1,
        subtotal: 15000,
        unit: 'porsi'
      },
      {
        productId: 'prod-03',
        sku: 'PRD-MIN-01',
        productName: 'Air Mineral Santri 600ml',
        price: 3000,
        costPrice: 2200,
        quantity: 1,
        subtotal: 3000,
        unit: 'botol'
      }
    ],
    subtotal: 18000,
    totalAmount: 18000,
    paymentMethod: 'rfid_card',
    status: 'completed',
    santriBalanceBefore: 203000,
    santriBalanceAfter: 185000,
    dailyLimitRemaining: 12000,
    notes: 'Makan siang kantin santriwati',
    createdAt: getPastDateIso(0, 12, 15)
  },
  {
    id: 'trx-today-002',
    invoiceNumber: 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-0002',
    santriwatiId: 'santri-02',
    santriId: 'santri-02',
    santriwatiNis: '202401002',
    santriwatiName: 'Zahra Maryam Nabila',
    santriwatiClass: 'Kelas 2 Wustha A',
    santriwatiDormitory: 'Asrama Aisyah Lt. 1 (Kamar 102)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-02',
        sku: 'PRD-ROTI-02',
        productName: 'Roti Gandum Isi Cokelat Keju',
        price: 5500,
        costPrice: 4000,
        quantity: 2,
        subtotal: 11000,
        unit: 'pcs'
      },
      {
        productId: 'prod-04',
        sku: 'PRD-SUSU-02',
        productName: 'Susu Steril Kurma Madu 200ml',
        price: 9500,
        costPrice: 7500,
        quantity: 1,
        subtotal: 9500,
        unit: 'botol'
      }
    ],
    subtotal: 20500,
    totalAmount: 20500,
    paymentMethod: 'rfid_card',
    status: 'completed',
    santriBalanceBefore: 110000,
    santriBalanceAfter: 89500,
    dailyLimitRemaining: 9500,
    notes: 'Sarapan dan suplemen tahfizh',
    createdAt: getPastDateIso(0, 7, 45)
  },
  {
    id: 'trx-today-003',
    invoiceNumber: 'INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-0003',
    santriwatiId: 'santri-05',
    santriId: 'santri-05',
    santriwatiNis: '202401005',
    santriwatiName: 'Fathimah Az-Zahra Ramadhani',
    santriwatiClass: 'Kelas 2 Wustha B',
    santriwatiDormitory: 'Asrama Aisyah Lt. 2 (Kamar 208)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-05',
        sku: 'PRD-BIS-03',
        productName: 'Biskuit Gandum Oat Cereal',
        price: 7000,
        costPrice: 5500,
        quantity: 2,
        subtotal: 14000,
        unit: 'pack'
      },
      {
        productId: 'prod-03',
        sku: 'PRD-MIN-01',
        productName: 'Air Mineral Santri 600ml',
        price: 3000,
        costPrice: 2200,
        quantity: 2,
        subtotal: 6000,
        unit: 'botol'
      }
    ],
    subtotal: 20000,
    totalAmount: 20000,
    paymentMethod: 'rfid_card',
    status: 'completed',
    santriBalanceBefore: 330000,
    santriBalanceAfter: 310000,
    dailyLimitRemaining: 20000,
    notes: 'Snack sore santriwati',
    createdAt: getPastDateIso(0, 16, 20)
  },

  // 1 Day Ago
  {
    id: 'trx-day1-001',
    invoiceNumber: 'INV-DAY1-0001',
    santriwatiId: 'santri-03',
    santriId: 'santri-03',
    santriwatiNis: '202401003',
    santriwatiName: 'Khadijah Nur Salsabila',
    santriwatiClass: 'Kelas 1 Ula B',
    santriwatiDormitory: 'Asrama Fatimah Lt. 2 (Kamar 201)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-01',
        sku: 'PRD-NSB-01',
        productName: 'Nasi Ayam Bakar Madu + Lalapan',
        price: 15000,
        costPrice: 12000,
        quantity: 2,
        subtotal: 30000,
        unit: 'porsi'
      },
      {
        productId: 'prod-03',
        sku: 'PRD-MIN-01',
        productName: 'Air Mineral Santri 600ml',
        price: 3000,
        costPrice: 2200,
        quantity: 2,
        subtotal: 6000,
        unit: 'botol'
      }
    ],
    subtotal: 36000,
    totalAmount: 36000,
    paymentMethod: 'rfid_card',
    status: 'completed',
    santriBalanceBefore: 276000,
    santriBalanceAfter: 240000,
    dailyLimitRemaining: 0,
    notes: 'Makan siang & teman kamar',
    createdAt: getPastDateIso(1, 12, 30)
  },
  {
    id: 'trx-day1-002',
    invoiceNumber: 'INV-DAY1-0002',
    santriwatiId: 'santri-04',
    santriId: 'santri-04',
    santriwatiNis: '202401004',
    santriwatiName: 'Nafisah Syahidah Al-Kautsar',
    santriwatiClass: 'Kelas 3 Ulya (Kitab Kuning)',
    santriwatiDormitory: 'Asrama Khadijah Lt. 1 (Kamar 106)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-07',
        sku: 'PRD-BKU-01',
        productName: 'Buku Tulis Santri Bergaris 58 Lembar',
        price: 4500,
        costPrice: 3200,
        quantity: 2,
        subtotal: 9000,
        unit: 'buah'
      },
      {
        productId: 'prod-06',
        sku: 'PRD-PLP-01',
        productName: 'Pulpen Gel Hitam Santri 0.5mm',
        price: 3500,
        costPrice: 2400,
        quantity: 2,
        subtotal: 7000,
        unit: 'pcs'
      }
    ],
    subtotal: 16000,
    totalAmount: 16000,
    paymentMethod: 'rfid_card',
    status: 'completed',
    santriBalanceBefore: 61000,
    santriBalanceAfter: 45000,
    dailyLimitRemaining: 4000,
    notes: 'Perlengkapan ngaji kitab kuning',
    createdAt: getPastDateIso(1, 15, 10)
  },

  // 2 Days Ago
  {
    id: 'trx-day2-001',
    invoiceNumber: 'INV-DAY2-0001',
    santriwatiId: 'santri-01',
    santriId: 'santri-01',
    santriwatiNis: '202401001',
    santriwatiName: 'Aisyah Humaira Putri',
    santriwatiClass: 'Kelas 3 Ulya (Tahfizh)',
    santriwatiDormitory: 'Asrama Khadijah Lt. 2 (Kamar 204)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-01',
        sku: 'PRD-NSB-01',
        productName: 'Nasi Ayam Bakar Madu + Lalapan',
        price: 15000,
        costPrice: 12000,
        quantity: 1,
        subtotal: 15000,
        unit: 'porsi'
      },
      {
        productId: 'prod-04',
        sku: 'PRD-SUSU-02',
        productName: 'Susu Steril Kurma Madu 200ml',
        price: 9500,
        costPrice: 7500,
        quantity: 1,
        subtotal: 9500,
        unit: 'botol'
      }
    ],
    subtotal: 24500,
    totalAmount: 24500,
    paymentMethod: 'rfid_card',
    status: 'completed',
    createdAt: getPastDateIso(2, 12, 10)
  },
  {
    id: 'trx-day2-002',
    invoiceNumber: 'INV-DAY2-0002',
    santriwatiId: 'santri-02',
    santriId: 'santri-02',
    santriwatiNis: '202401002',
    santriwatiName: 'Zahra Maryam Nabila',
    santriwatiClass: 'Kelas 2 Wustha A',
    santriwatiDormitory: 'Asrama Aisyah Lt. 1 (Kamar 102)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-02',
        sku: 'PRD-ROTI-02',
        productName: 'Roti Gandum Isi Cokelat Keju',
        price: 5500,
        costPrice: 4000,
        quantity: 3,
        subtotal: 16500,
        unit: 'pcs'
      },
      {
        productId: 'prod-03',
        sku: 'PRD-MIN-01',
        productName: 'Air Mineral Santri 600ml',
        price: 3000,
        costPrice: 2200,
        quantity: 2,
        subtotal: 6000,
        unit: 'botol'
      }
    ],
    subtotal: 22500,
    totalAmount: 22500,
    paymentMethod: 'rfid_card',
    status: 'completed',
    createdAt: getPastDateIso(2, 17, 40)
  },

  // 3 Days Ago
  {
    id: 'trx-day3-001',
    invoiceNumber: 'INV-DAY3-0001',
    santriwatiId: 'santri-05',
    santriId: 'santri-05',
    santriwatiNis: '202401005',
    santriwatiName: 'Fathimah Az-Zahra Ramadhani',
    santriwatiClass: 'Kelas 2 Wustha B',
    santriwatiDormitory: 'Asrama Aisyah Lt. 2 (Kamar 208)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-08',
        sku: 'PRD-SBN-01',
        productName: 'Sabun Mandi Cair Herbal 250ml',
        price: 14000,
        costPrice: 10500,
        quantity: 1,
        subtotal: 14000,
        unit: 'botol'
      },
      {
        productId: 'prod-03',
        sku: 'PRD-MIN-01',
        productName: 'Air Mineral Santri 600ml',
        price: 3000,
        costPrice: 2200,
        quantity: 2,
        subtotal: 6000,
        unit: 'botol'
      }
    ],
    subtotal: 20000,
    totalAmount: 20000,
    paymentMethod: 'rfid_card',
    status: 'completed',
    createdAt: getPastDateIso(3, 16, 5)
  },
  {
    id: 'trx-day3-002',
    invoiceNumber: 'INV-DAY3-0002',
    santriwatiId: 'santri-03',
    santriId: 'santri-03',
    santriwatiNis: '202401003',
    santriwatiName: 'Khadijah Nur Salsabila',
    santriwatiClass: 'Kelas 1 Ula B',
    santriwatiDormitory: 'Asrama Fatimah Lt. 2 (Kamar 201)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-01',
        sku: 'PRD-NSB-01',
        productName: 'Nasi Ayam Bakar Madu + Lalapan',
        price: 15000,
        costPrice: 12000,
        quantity: 1,
        subtotal: 15000,
        unit: 'porsi'
      },
      {
        productId: 'prod-05',
        sku: 'PRD-BIS-03',
        productName: 'Biskuit Gandum Oat Cereal',
        price: 7000,
        costPrice: 5500,
        quantity: 1,
        subtotal: 7000,
        unit: 'pack'
      }
    ],
    subtotal: 22000,
    totalAmount: 22000,
    paymentMethod: 'rfid_card',
    status: 'completed',
    createdAt: getPastDateIso(3, 11, 45)
  },

  // 4 Days Ago
  {
    id: 'trx-day4-001',
    invoiceNumber: 'INV-DAY4-0001',
    santriwatiId: 'santri-04',
    santriId: 'santri-04',
    santriwatiNis: '202401004',
    santriwatiName: 'Nafisah Syahidah Al-Kautsar',
    santriwatiClass: 'Kelas 3 Ulya (Kitab Kuning)',
    santriwatiDormitory: 'Asrama Khadijah Lt. 1 (Kamar 106)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-01',
        sku: 'PRD-NSB-01',
        productName: 'Nasi Ayam Bakar Madu + Lalapan',
        price: 15000,
        costPrice: 12000,
        quantity: 1,
        subtotal: 15000,
        unit: 'porsi'
      }
    ],
    subtotal: 15000,
    totalAmount: 15000,
    paymentMethod: 'rfid_card',
    status: 'completed',
    createdAt: getPastDateIso(4, 12, 10)
  },

  // 5 Days Ago
  {
    id: 'trx-day5-001',
    invoiceNumber: 'INV-DAY5-0001',
    santriwatiId: 'santri-01',
    santriId: 'santri-01',
    santriwatiNis: '202401001',
    santriwatiName: 'Aisyah Humaira Putri',
    santriwatiClass: 'Kelas 3 Ulya (Tahfizh)',
    santriwatiDormitory: 'Asrama Khadijah Lt. 2 (Kamar 204)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-02',
        sku: 'PRD-ROTI-02',
        productName: 'Roti Gandum Isi Cokelat Keju',
        price: 5500,
        costPrice: 4000,
        quantity: 2,
        subtotal: 11000,
        unit: 'pcs'
      },
      {
        productId: 'prod-04',
        sku: 'PRD-SUSU-02',
        productName: 'Susu Steril Kurma Madu 200ml',
        price: 9500,
        costPrice: 7500,
        quantity: 1,
        subtotal: 9500,
        unit: 'botol'
      },
      {
        productId: 'prod-03',
        sku: 'PRD-MIN-01',
        productName: 'Air Mineral Santri 600ml',
        price: 3000,
        costPrice: 2200,
        quantity: 1,
        subtotal: 3000,
        unit: 'botol'
      }
    ],
    subtotal: 23500,
    totalAmount: 23500,
    paymentMethod: 'rfid_card',
    status: 'completed',
    createdAt: getPastDateIso(5, 7, 50)
  },

  // 6 Days Ago
  {
    id: 'trx-day6-001',
    invoiceNumber: 'INV-DAY6-0001',
    santriwatiId: 'santri-02',
    santriId: 'santri-02',
    santriwatiNis: '202401002',
    santriwatiName: 'Zahra Maryam Nabila',
    santriwatiClass: 'Kelas 2 Wustha A',
    santriwatiDormitory: 'Asrama Aisyah Lt. 1 (Kamar 102)',
    cashierId: 'usr-kasir-01',
    cashierName: 'Siti Nurhaliza (Kasir Kantin)',
    items: [
      {
        productId: 'prod-01',
        sku: 'PRD-NSB-01',
        productName: 'Nasi Ayam Bakar Madu + Lalapan',
        price: 15000,
        costPrice: 12000,
        quantity: 1,
        subtotal: 15000,
        unit: 'porsi'
      },
      {
        productId: 'prod-03',
        sku: 'PRD-MIN-01',
        productName: 'Air Mineral Santri 600ml',
        price: 3000,
        costPrice: 2200,
        quantity: 1,
        subtotal: 3000,
        unit: 'botol'
      }
    ],
    subtotal: 18000,
    totalAmount: 18000,
    paymentMethod: 'rfid_card',
    status: 'completed',
    createdAt: getPastDateIso(6, 12, 40)
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-01',
    timestamp: '2025-02-15T07:30:00.000Z',
    userId: 'usr-admin-01',
    userName: 'Ustadzah Fatimah Azzahra (Admin)',
    userRole: 'admin',
    action: 'LOGIN',
    module: 'AUTH',
    details: 'Berhasil login ke sistem AMANAH Smart Mart'
  },
  {
    id: 'log-02',
    timestamp: '2025-02-15T07:35:00.000Z',
    userId: 'usr-admin-01',
    userName: 'Ustadzah Fatimah Azzahra (Admin)',
    userRole: 'admin',
    action: 'CREATE',
    module: 'SANTRIWATI',
    details: 'Menambahkan data santriwati baru: Aisyah Humaira Putri (NIS: 202401001)'
  },
  {
    id: 'log-03',
    timestamp: '2025-02-15T07:40:00.000Z',
    userId: 'usr-admin-01',
    userName: 'Ustadzah Fatimah Azzahra (Admin)',
    userRole: 'admin',
    action: 'CREATE',
    module: 'PRODUCTS',
    details: 'Menambahkan produk: Nasi Ayam Bakar Madu + Lalapan'
  }
];
