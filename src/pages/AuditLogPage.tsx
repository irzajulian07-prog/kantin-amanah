import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Clock,
  User,
  Radio,
  Lock,
  Unlock,
  CreditCard,
  Wallet,
  Package,
  Layers,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { AuditLog } from '../types';
import { Modal } from '../components/common/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type FilterCategory = 'ALL' | 'AUTH' | 'SECURITY' | 'POS' | 'TOPUP' | 'INVENTORY' | 'MASTER';

export const AuditLogPage: React.FC = () => {
  const { auditLogs, settings } = useData();
  const { role } = useAuth();
  const { showNotification } = useNotification();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Filter Categories Mapping
  const categoryActionMap: Record<FilterCategory, string[]> = {
    ALL: [],
    AUTH: ['LOGIN', 'LOGOUT'],
    SECURITY: ['PIN_FAILED', 'PIN_LOCKED', 'ACCOUNT_LOCKED', 'PIN_VERIFIED', 'RESET_PIN', 'RFID_SCAN'],
    POS: ['TRANSACTION', 'RFID_SCAN', 'PIN_VERIFIED'],
    TOPUP: ['TOPUP_REQUEST', 'TOPUP_APPROVE', 'TOPUP_REJECT'],
    INVENTORY: ['STOCK_RECEIPT', 'STOCK_OPNAME', 'STOCK_ADJUST'],
    MASTER: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE']
  };

  // Date Filter Helper
  const isWithinDateRange = (timestamp: string, range: 'today' | '7days' | '30days' | 'all') => {
    if (range === 'all') return true;
    const logDate = new Date(timestamp);
    const now = new Date();

    if (range === 'today') {
      return logDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
    }
    if (range === '7days') {
      const diffMs = now.getTime() - logDate.getTime();
      return diffMs <= 7 * 24 * 60 * 60 * 1000;
    }
    if (range === '30days') {
      const diffMs = now.getTime() - logDate.getTime();
      return diffMs <= 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const allowedActions = categoryActionMap[selectedCategory];
        if (!allowedActions.includes(log.action)) return false;
      }

      // Specific Action filter
      if (selectedAction !== 'ALL' && log.action !== selectedAction) {
        return false;
      }

      // Date Range filter
      if (!isWithinDateRange(log.timestamp, dateRange)) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchText =
          (log.details && log.details.toLowerCase().includes(q)) ||
          (log.userName && log.userName.toLowerCase().includes(q)) ||
          (log.userRole && log.userRole.toLowerCase().includes(q)) ||
          (log.action && log.action.toLowerCase().includes(q)) ||
          (log.module && log.module.toLowerCase().includes(q)) ||
          (log.id && log.id.toLowerCase().includes(q));
        if (!matchText) return false;
      }

      return true;
    });
  }, [auditLogs, selectedCategory, selectedAction, dateRange, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = auditLogs.filter((l) => l.timestamp.slice(0, 10) === todayStr).length;
    const securityAlerts = auditLogs.filter(
      (l) => l.action === 'PIN_FAILED' || l.action === 'PIN_LOCKED' || l.action === 'ACCOUNT_LOCKED'
    ).length;
    const transactionsCount = auditLogs.filter((l) => l.action === 'TRANSACTION').length;
    const topupsCount = auditLogs.filter(
      (l) => l.action === 'TOPUP_REQUEST' || l.action === 'TOPUP_APPROVE' || l.action === 'TOPUP_REJECT'
    ).length;

    return { total, todayCount, securityAlerts, transactionsCount, topupsCount };
  }, [auditLogs]);

  // Action Visual Helpers
  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'LOGIN':
        return {
          label: 'User Login',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <User className="w-3 h-3 text-emerald-600" />
        };
      case 'LOGOUT':
        return {
          label: 'User Logout',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Clock className="w-3 h-3 text-slate-500" />
        };
      case 'RFID_SCAN':
        return {
          label: 'RFID Scan',
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          icon: <Radio className="w-3 h-3 text-cyan-600" />
        };
      case 'PIN_VERIFIED':
        return {
          label: 'PIN Sukses',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: <CheckCircle2 className="w-3 h-3 text-teal-600" />
        };
      case 'PIN_FAILED':
        return {
          label: 'PIN Gagal',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertTriangle className="w-3 h-3 text-amber-600" />
        };
      case 'PIN_LOCKED':
      case 'ACCOUNT_LOCKED':
        return {
          label: 'Kartu Terkunci',
          bg: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
          icon: <Lock className="w-3 h-3 text-rose-600" />
        };
      case 'RESET_PIN':
        return {
          label: 'Buka Kunci PIN',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <Unlock className="w-3 h-3 text-indigo-600" />
        };
      case 'TRANSACTION':
        return {
          label: 'Transaksi POS',
          bg: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
          icon: <CreditCard className="w-3 h-3 text-blue-600" />
        };
      case 'TOPUP_REQUEST':
        return {
          label: 'Top Up Diajukan',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Wallet className="w-3 h-3 text-amber-600" />
        };
      case 'TOPUP_APPROVE':
        return {
          label: 'Top Up Disetujui',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        };
      case 'TOPUP_REJECT':
        return {
          label: 'Top Up Ditolak',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className="w-3 h-3 text-rose-600" />
        };
      case 'STOCK_RECEIPT':
        return {
          label: 'Penerimaan Stok',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Package className="w-3 h-3 text-purple-600" />
        };
      case 'STOCK_OPNAME':
      case 'STOCK_ADJUST':
        return {
          label: 'Stok Opname',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: <Layers className="w-3 h-3 text-sky-600" />
        };
      case 'CREATE':
        return {
          label: 'Tambah Data',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        };
      case 'UPDATE':
      case 'STATUS_CHANGE':
        return {
          label: 'Update Data',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <RefreshCw className="w-3 h-3 text-blue-600" />
        };
      case 'DELETE':
        return {
          label: 'Hapus Data',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className="w-3 h-3 text-rose-600" />
        };
      default:
        return {
          label: action,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Info className="w-3 h-3 text-slate-500" />
        };
    }
  };

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'supervisor':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'kasir':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const exportData = filteredLogs.map((log, index) => ({
        No: index + 1,
        'Waktu & Tanggal': new Date(log.timestamp).toLocaleString('id-ID'),
        Aksi: log.action,
        Modul: log.module,
        'Nama Pengguna': log.userName,
        Role: log.userRole.toUpperCase(),
        'Rincian Aktivitas': log.details,
        'ID Log': log.id
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');
      const filename = `Audit_Logs_AMANAH_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);

      showNotification('success', 'Ekspor Excel Berhasil', `File ${filename} berhasil diunduh.`);
    } catch (e: any) {
      showNotification('error', 'Gagal Ekspor', e?.message || 'Terjadi kesalahan saat mengekspor ke Excel.');
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('landscape');

      doc.setFontSize(16);
      doc.text(settings.pesantrenName || 'PONDOK PESANTREN AMANAH', 14, 15);
      doc.setFontSize(12);
      doc.text('Laporan Rekam Audit Keamanan & Aktivitas Sistem (Audit Log)', 14, 23);
      doc.setFontSize(9);
      doc.text(
        `Waktu Cetak: ${new Date().toLocaleString('id-ID')} | Total Data: ${filteredLogs.length} Entri | Dicetak Oleh: ${role.toUpperCase()}`,
        14,
        29
      );

      const tableRows = filteredLogs.map((log, idx) => [
        idx + 1,
        new Date(log.timestamp).toLocaleString('id-ID', {
          dateStyle: 'short',
          timeStyle: 'medium'
        }),
        log.action,
        log.module,
        `${log.userName} (${log.userRole})`,
        log.details
      ]);

      autoTable(doc, {
        head: [['No', 'Waktu', 'Aksi', 'Modul', 'User & Role', 'Rincian Aktivitas']],
        body: tableRows,
        startY: 34,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { cellWidth: 28 },
          3: { cellWidth: 22 },
          4: { cellWidth: 40 },
          5: { cellWidth: 'auto' }
        }
      });

      const filename = `Audit_Logs_AMANAH_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      showNotification('success', 'Ekspor PDF Berhasil', `Dokumen PDF ${filename} berhasil diunduh.`);
    } catch (e: any) {
      showNotification('error', 'Gagal Ekspor PDF', e?.message || 'Terjadi kesalahan saat mengekspor ke PDF.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Log & Keamanan Sistem</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Stream
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan rekam jejak Login, RFID, PIN Gagal, Kartu Terkunci, Transaksi POS, Top Up, dan Perubahan Stok
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-excel-audit"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>
          <button
            id="export-pdf-audit"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Log Tercatat</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.todayCount} tercatat hari ini</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Peringatan Keamanan</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">{stats.securityAlerts}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">PIN gagal & kartu terkunci</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Aktivitas Transaksi</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.transactionsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pembelian kantin berhasil</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Aktivitas Top Up</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">{stats.topupsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pengajuan, approval & rejection</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Kategori:
          </span>
          {[
            { id: 'ALL', label: 'Semua Kategori' },
            { id: 'SECURITY', label: 'Keamanan & PIN' },
            { id: 'POS', label: 'Kasir & RFID' },
            { id: 'TOPUP', label: 'Top Up Saldo' },
            { id: 'INVENTORY', label: 'Inventori & Stok' },
            { id: 'AUTH', label: 'Autentikasi User' },
            { id: 'MASTER', label: 'Master Data' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id as FilterCategory);
                setSelectedAction('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search and Secondary Selectors */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-audit-log-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari user, santri, rincian aktivitas, atau ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-3.5 px-5">Waktu & Tanggal</th>
                <th className="py-3.5 px-5">Aksi Keamanan</th>
                <th className="py-3.5 px-5">Modul</th>
                <th className="py-3.5 px-5">Pengguna / Eksekutor</th>
                <th className="py-3.5 px-5">Rincian Aktivitas</th>
                <th className="py-3.5 px-5 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada rekam audit yang sesuai filter</p>
                    <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau rentang tanggal.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const isSecurityAlert =
                    log.action === 'PIN_FAILED' || log.action === 'PIN_LOCKED' || log.action === 'ACCOUNT_LOCKED';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSecurityAlert ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(log.timestamp).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {log.module}
                        </span>
                      </td>

                      {/* User & Role */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{log.userName}</span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getRoleBadge(
                              log.userRole
                            )}`}
                          >
                            {log.userRole}
                          </span>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-5">
                        <p className="text-slate-700 line-clamp-2 max-w-xl font-normal leading-relaxed">
                          {log.details}
                        </p>
                      </td>

                      {/* Detail View Button */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Entri Log"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Modal Detail Audit Log */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Rekam Audit Aktivitas"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-semibold text-slate-500">ID Log Transaksi</span>
                <span className="text-xs font-mono font-bold text-slate-800">{selectedLog.id}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-semibold text-slate-500">Waktu & Tanggal Lengkap</span>
                <span className="text-xs font-mono text-slate-800">
                  {new Date(selectedLog.timestamp).toLocaleString('id-ID', {
                    dateStyle: 'full',
                    timeStyle: 'long'
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-semibold text-slate-500">Aksi & Modul</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{selectedLog.action}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 rounded text-slate-700">
                    {selectedLog.module}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-xs font-semibold text-slate-500">Pelaksana / User</span>
                <span className="text-xs font-semibold text-slate-800">
                  {selectedLog.userName} ({selectedLog.userRole.toUpperCase()})
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">Rincian Narasi Peristiwa:</span>
                <p className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
