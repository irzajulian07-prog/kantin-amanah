# AMANAH Smart Mart - Security Specification & RBAC Matrix

## 1. Role-Based Access Control (RBAC) Matrix

| Modul / Menu | Route | Admin | Supervisor | Kasir | Deskripsi Izin & Larangan |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Dashboard** | `/` | ✅ Full | ✅ Full | ❌ Blocked | Metrik analitik, omzet, grafik Recharts, saldo beredar |
| **Kasir POS RFID** | `/kasir` | ✅ Full | ❌ Blocked | ✅ Full | Scan kartu RFID, otentikasi PIN 6-digit, checkout transaksi |
| **Top Up Saldo** | `/topup` | ✅ Full | ❌ Blocked | ❌ Blocked | Verifikasi bukti bayar transfer/QRIS, Approval/Rejection saldo |
| **Santriwati** | `/santriwati` | ✅ Full | ✅ Full | 👁️ Read-Only | Kasir hanya membaca NIS, RFID, saldo, limit (tidak bisa edit/hapus) |
| **Inventori & Stok** | `/inventory` | ✅ Full | ✅ Full | ❌ Blocked | Penerimaan barang supplier, stok opname fisik, selisih stok |
| **Laporan & Rekap** | `/reports` | ✅ Full | ✅ Full | ❌ Blocked | Laporan 8 modul, filter custom tanggal, ekspor Excel & PDF |
| **Master Produk** | `/products` | ✅ Full | ✅ Full | ❌ Blocked | Kasir dilarang mengubah harga jual, harga modal, atau katalog |
| **Kategori & Supplier**| `/categories`, `/suppliers` | ✅ Full | ✅ Full | ❌ Blocked | Manajemen kategori mart dan data kontak mitra supplier |
| **Audit Log** | `/audit-logs` | ✅ Full | ✅ Full | ❌ Blocked | Live stream audit, filter insiden keamanan, ekspor log |
| **Pengguna & Role** | `/users` | ✅ Full | ❌ Blocked | ❌ Blocked | Khusus Super Admin: pembuatan akun staf, reset role |

---

## 2. Hardened Security Invariants & Protections

1. **Anti Double-Transaction (RFID & Checkout Protection)**:
   - Client session debouncing & cooldown pada input RFID scanner.
   - Idempotency transaction signature: `${santriId}_${itemsDigest}_${totalAmount}`.
   - Deduplikasi otomatis jika sinyal scan RFID diterima berulang dalam jendela 6 detik.

2. **Otentikasi PIN 6-Digit & Lockout Otomatis**:
   - Algoritma hashing SHA-256 tersalin per santriwati.
   - Maksimal 3 kali toleransi salah PIN.
   - Kunci kartu otomatis selama 15 menit jika 3 kali salah memasukkan PIN (`pinLockedUntil`).
   - Audit log instan: `PIN_FAILED`, `PIN_LOCKED`, `ACCOUNT_LOCKED`.

3. **Integritas Data Saldo & Stok**:
   - Saldo santriwati tidak boleh bernilai negatif (`balance >= 0`).
   - Limit harian santriwati diverifikasi terhadap agregasi transaksi hari berjalan (`usedToday + total <= dailyLimit`).
   - Santri nonaktif (`status !== 'active'`) langsung diblokir di pintu pertama POS.
   - Stok produk tidak boleh bernilai negatif (`stock >= 0`).
   - Transaksi diproses dalam Firestore `writeBatch` atomik untuk menjamin konsistensi saldo dan pengurangan stok.

4. **Firestore Security Rules Hardening**:
   - Dilarang keras menggunakan `allow read, write: if true;`.
   - Audit logs berstatus *Append-Only* (`allow update, delete: if false`).
   - Kasir dibatasi hanya dapat memperbarui saldo dan stok yang terikat pada item transaksi valid.
