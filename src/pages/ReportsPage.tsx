import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  Receipt,
  TrendingUp,
  Wallet,
  Package,
  Flame,
  Truck,
  ClipboardList,
  CircleDollarSign,
  Users2,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  RefreshCw,
  Clock,
  Printer
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { exportToExcel, exportToPdf, ExportColumn } from '../utils/exportUtils';
import { Badge } from '../components/common/Badge';

export type ReportType =
  | 'transactions'
  | 'turnover'
  | 'balance'
  | 'topup'
  | 'top_products'
  | 'stock'
  | 'stock_receipts'
  | 'stock_opname';

export type DateFilterType = 'today' | 'weekly' | 'monthly' | 'custom';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    transactions,
    topups,
    products,
    santriwati,
    stockReceipts,
    stockAdjustments,
    categories,
    suppliers,
    settings
  } = useData();
  const { showNotification } = useNotification();

  const [activeReport, setActiveReport] = useState<ReportType>('transactions');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Default custom date range: 7 days ago to today
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // 1. Calculate Date Range Bounds
  const { startBound, endBound, periodLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let label = '';

    if (dateFilter === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      label = `Hari Ini (${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`;
    } else if (dateFilter === 'weekly') {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      label = `7 Hari Terakhir (${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    } else if (dateFilter === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      label = `Bulan Ini (${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`;
    } else {
      // Custom
      start = new Date(customStartDate + 'T00:00:00');
      end = new Date(customEndDate + 'T23:59:59');
      label = `Kustom (${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    }

    return { startBound: start, endBound: end, periodLabel: label };
  }, [dateFilter, customStartDate, customEndDate]);

  // Helper date checker
  const isWithinPeriod = (dateIsoStr: string) => {
    const d = new Date(dateIsoStr);
    return d >= startBound && d <= endBound;
  };

  // 2. Computed Live Reports Data directly from Firestore collections

  // A. Laporan Transaksi
  const transactionReportData = useMemo(() => {
    return transactions
      .filter((t) => isWithinPeriod(t.createdAt))
      .filter((t) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.invoiceNumber.toLowerCase().includes(q) ||
          t.santriwatiName.toLowerCase().includes(q) ||
          t.santriwatiNis.toLowerCase().includes(q) ||
          t.cashierName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, startBound, endBound, searchQuery]);

  // B. Laporan Omzet & Keuntungan
  const turnoverReportData = useMemo(() => {
    // Group transactions by date
    const dailyMap: Record<
      string,
      {
        date: string;
        dateFormatted: string;
        transactionCount: number;
        itemsSoldCount: number;
        totalRevenue: number;
        totalCost: number;
        grossProfit: number;
        marginPercent: number;
      }
    > = {};

    transactions
      .filter((t) => t.status === 'completed' && isWithinPeriod(t.createdAt))
      .forEach((trx) => {
        const dateKey = trx.createdAt.slice(0, 10);
        if (!dailyMap[dateKey]) {
          const d = new Date(trx.createdAt);
          dailyMap[dateKey] = {
            date: dateKey,
            dateFormatted: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
            transactionCount: 0,
            itemsSoldCount: 0,
            totalRevenue: 0,
            totalCost: 0,
            grossProfit: 0,
            marginPercent: 0
          };
        }

        dailyMap[dateKey].transactionCount += 1;
        trx.items?.forEach((item) => {
          const qty = item.quantity || 0;
          const price = item.price || 0;
          const cost = item.costPrice || 0;
          dailyMap[dateKey].itemsSoldCount += qty;
          dailyMap[dateKey].totalRevenue += price * qty;
          dailyMap[dateKey].totalCost += cost * qty;
        });
      });

    return Object.values(dailyMap)
      .map((entry) => {
        const grossProfit = entry.totalRevenue - entry.totalCost;
        const marginPercent = entry.totalRevenue > 0 ? (grossProfit / entry.totalRevenue) * 100 : 0;
        return {
          ...entry,
          grossProfit,
          marginPercent: Math.round(marginPercent * 10) / 10
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startBound, endBound]);

  // C. Laporan Saldo Santriwati
  const balanceReportData = useMemo(() => {
    return santriwati
      .map((s) => {
        // Calculate spend in current period
        const periodTrx = transactions.filter(
          (t) => t.santriwatiId === s.id && t.status === 'completed' && isWithinPeriod(t.createdAt)
        );
        const totalPeriodSpend = periodTrx.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const totalPeriodTrx = periodTrx.length;

        return {
          ...s,
          totalPeriodSpend,
          totalPeriodTrx
        };
      })
      .filter((s) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          s.classRoom.toLowerCase().includes(q) ||
          s.dormitory.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.balance - a.balance);
  }, [santriwati, transactions, startBound, endBound, searchQuery]);

  // D. Laporan Top Up
  const topupReportData = useMemo(() => {
    return topups
      .filter((t) => isWithinPeriod(t.createdAt))
      .filter((t) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.topupNumber.toLowerCase().includes(q) ||
          t.santriName.toLowerCase().includes(q) ||
          (t.santriNis && t.santriNis.toLowerCase().includes(q)) ||
          t.paymentMethod.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [topups, startBound, endBound, searchQuery]);

  // E. Laporan Produk Terlaris
  const topProductsReportData = useMemo(() => {
    const map: Record<
      string,
      {
        productId: string;
        sku: string;
        productName: string;
        categoryName: string;
        totalSold: number;
        totalOmzet: number;
        currentStock: number;
        unit: string;
        price: number;
        costPrice: number;
        grossProfit: number;
      }
    > = {};

    transactions
      .filter((t) => t.status === 'completed' && isWithinPeriod(t.createdAt))
      .forEach((trx) => {
        trx.items?.forEach((item) => {
          if (!map[item.productId]) {
            const p = products.find((prod) => prod.id === item.productId);
            map[item.productId] = {
              productId: item.productId,
              sku: item.sku || p?.sku || '-',
              productName: item.productName || p?.name || 'Produk Kantin',
              categoryName: p?.categoryName || 'Umum',
              totalSold: 0,
              totalOmzet: 0,
              currentStock: p?.stock || 0,
              unit: item.unit || p?.unit || 'pcs',
              price: item.price || p?.sellingPrice || 0,
              costPrice: item.costPrice || p?.costPrice || 0,
              grossProfit: 0
            };
          }

          const qty = item.quantity || 0;
          const revenue = item.subtotal || item.price * qty;
          const cost = (item.costPrice || 0) * qty;

          map[item.productId].totalSold += qty;
          map[item.productId].totalOmzet += revenue;
          map[item.productId].grossProfit += revenue - cost;
        });
      });

    return Object.values(map)
      .filter((item) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.productName.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.categoryName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.totalSold - a.totalSold);
  }, [transactions, products, startBound, endBound, searchQuery]);

  // F. Laporan Stok & Nilai Inventori
  const stockReportData = useMemo(() => {
    return products
      .map((p) => {
        const inventoryValue = p.stock * p.costPrice;
        const potentialRevenue = p.stock * p.sellingPrice;
        const stockStatus =
          p.stock <= 0 ? 'Habis' : p.stock <= p.minStock ? 'Menipis' : 'Aman';
        return {
          ...p,
          inventoryValue,
          potentialRevenue,
          stockStatus
        };
      })
      .filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.stock - b.stock);
  }, [products, searchQuery]);

  // G. Laporan Penerimaan Barang
  const stockReceiptsReportData = useMemo(() => {
    return stockReceipts
      .filter((r) => isWithinPeriod(r.receivedDate || r.createdAt))
      .filter((r) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          r.receiptNumber.toLowerCase().includes(q) ||
          r.supplierName.toLowerCase().includes(q) ||
          r.receivedByName.toLowerCase().includes(q) ||
          (r.invoiceOrDoNumber && r.invoiceOrDoNumber.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.receivedDate || b.createdAt).getTime() - new Date(a.receivedDate || a.createdAt).getTime());
  }, [stockReceipts, startBound, endBound, searchQuery]);

  // H. Laporan Opname & Penyesuaian Stok
  const stockOpnameReportData = useMemo(() => {
    return stockAdjustments
      .filter((adj) => isWithinPeriod(adj.createdAt))
      .filter((adj) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          adj.adjustmentNumber.toLowerCase().includes(q) ||
          adj.productName.toLowerCase().includes(q) ||
          (adj.sku && adj.sku.toLowerCase().includes(q)) ||
          adj.reason.toLowerCase().includes(q) ||
          adj.adjustedByName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stockAdjustments, startBound, endBound, searchQuery]);

  // 3. Export Configurations per Tab
  const handleExport = (format: 'excel' | 'pdf') => {
    const timestampStr = new Date().toISOString().slice(0, 10);
    const pesantren = settings.pesantrenName || 'PONDOK PESANTREN DARUL AMANAH – SMART MART';

    try {
      if (activeReport === 'transactions') {
        const columns: ExportColumn[] = [
          { header: 'No. Invoice', dataKey: 'invoiceNumber' },
          { header: 'Waktu', dataKey: 'waktu' },
          { header: 'Nama Santriwati', dataKey: 'santriwatiName' },
          { header: 'NIS', dataKey: 'santriwatiNis' },
          { header: 'Item Pembelian', dataKey: 'itemsList' },
          { header: 'Total Nominal', dataKey: 'totalFormatted' },
          { header: 'Metode', dataKey: 'paymentMethod' },
          { header: 'Kasir', dataKey: 'cashierName' }
        ];

        const exportData = transactionReportData.map((t) => ({
          ...t,
          waktu: new Date(t.createdAt).toLocaleString('id-ID'),
          itemsList: t.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ') || '-',
          totalFormatted: formatIDR(t.totalAmount)
        }));

        const totalNominal = transactionReportData.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const summary = [
          { label: 'Total Transaksi', value: `${transactionReportData.length} Transaksi` },
          { label: 'Total Omzet', value: formatIDR(totalNominal) }
        ];

        if (format === 'excel') {
          exportToExcel({
            fileName: `Laporan_Transaksi_${timestampStr}`,
            sheetName: 'Transaksi',
            title: 'Laporan Transaksi Kasir POS',
            periodLabel,
            columns,
            data: exportData,
            summaryRows: summary
          });
        } else {
          exportToPdf({
            title: 'LAPORAN TRANSAKSI KASIR KANTIN',
            subtitle: 'Rekapitulasi Penjualan & Transaksi Santriwati',
            periodLabel,
            columns,
            data: exportData,
            fileName: `Laporan_Transaksi_${timestampStr}`,
            summaryRows: summary,
            pesantrenName: pesantren
          });
        }
      } else if (activeReport === 'turnover') {
        const columns: ExportColumn[] = [
          { header: 'Tanggal', dataKey: 'dateFormatted' },
          { header: 'Jml Transaksi', dataKey: 'transactionCount' },
          { header: 'Item Terjual', dataKey: 'itemsSoldCount' },
          { header: 'Total Omzet (Penjualan)', dataKey: 'omzetFormatted' },
          { header: 'Total HPP (Modal)', dataKey: 'hppFormatted' },
          { header: 'Laba Kotor', dataKey: 'profitFormatted' },
          { header: 'Margin %', dataKey: 'marginFormatted' }
        ];

        const exportData = turnoverReportData.map((r) => ({
          ...r,
          omzetFormatted: formatIDR(r.totalRevenue),
          hppFormatted: formatIDR(r.totalCost),
          profitFormatted: formatIDR(r.grossProfit),
          marginFormatted: `${r.marginPercent}%`
        }));

        const totalOmzet = turnoverReportData.reduce((sum, r) => sum + r.totalRevenue, 0);
        const totalProfit = turnoverReportData.reduce((sum, r) => sum + r.grossProfit, 0);
        const summary = [
          { label: 'Total Omzet Periode', value: formatIDR(totalOmzet) },
          { label: 'Estimasi Laba Kotor', value: formatIDR(totalProfit) }
        ];

        if (format === 'excel') {
          exportToExcel({
            fileName: `Laporan_Omzet_${timestampStr}`,
            sheetName: 'Omzet',
            title: 'Laporan Omzet & Keuntungan Kantin',
            periodLabel,
            columns,
            data: exportData,
            summaryRows: summary
          });
        } else {
          exportToPdf({
            title: 'LAPORAN OMZET & LABA KANTIN',
            subtitle: 'Rekap Pendapatan, HPP, dan Margin Usaha',
            periodLabel,
            columns,
            data: exportData,
            fileName: `Laporan_Omzet_${timestampStr}`,
            summaryRows: summary,
            pesantrenName: pesantren
          });
        }
      } else if (activeReport === 'balance') {
        const columns: ExportColumn[] = [
          { header: 'NIS', dataKey: 'nis' },
          { header: 'Nama Santriwati', dataKey: 'name' },
          { header: 'Kelas', dataKey: 'classRoom' },
          { header: 'Asrama', dataKey: 'dormitory' },
          { header: 'Saldo Saat Ini', dataKey: 'balanceFormatted' },
          { header: 'Limit Harian', dataKey: 'limitFormatted' },
          { header: 'Belanja di Periode Ini', dataKey: 'spendFormatted' },
          { header: 'Status', dataKey: 'status' }
        ];

        const exportData = balanceReportData.map((s) => ({
          ...s,
          balanceFormatted: formatIDR(s.balance),
          limitFormatted: formatIDR(s.dailyLimit),
          spendFormatted: formatIDR(s.totalPeriodSpend)
        }));

        const totalSaldo = balanceReportData.reduce((sum, s) => sum + s.balance, 0);
        const summary = [
          { label: 'Total Santriwati', value: `${balanceReportData.length} Orang` },
          { label: 'Total Saldo Beredar', value: formatIDR(totalSaldo) }
        ];

        if (format === 'excel') {
          exportToExcel({
            fileName: `Laporan_Saldo_Santriwati_${timestampStr}`,
            sheetName: 'Saldo Santriwati',
            title: 'Laporan Saldo & Mutasi Belanja Santriwati',
            periodLabel,
            columns,
            data: exportData,
            summaryRows: summary
          });
        } else {
          exportToPdf({
            title: 'LAPORAN SALDO SANTRIWATI',
            subtitle: 'Data Simpanan Deposit & Mutasi Belanja Kantin',
            periodLabel,
            columns,
            data: exportData,
            fileName: `Laporan_Saldo_Santriwati_${timestampStr}`,
            summaryRows: summary,
            pesantrenName: pesantren
          });
        }
      } else if (activeReport === 'topup') {
        const columns: ExportColumn[] = [
          { header: 'No. Topup', dataKey: 'topupNumber' },
          { header: 'Waktu Pengajuan', dataKey: 'waktu' },
          { header: 'Santriwati', dataKey: 'santriName' },
          { header: 'NIS', dataKey: 'santriNis' },
          { header: 'Nominal', dataKey: 'nominalFormatted' },
          { header: 'Metode', dataKey: 'paymentMethod' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Petugas Approver', dataKey: 'approvedByName' }
        ];

        const exportData = topupReportData.map((t) => ({
          ...t,
          waktu: new Date(t.createdAt).toLocaleString('id-ID'),
          nominalFormatted: formatIDR(t.amount),
          approvedByName: t.approvedByName || '-'
        }));

        const totalApproved = topupReportData
          .filter((t) => t.status === 'approved' || t.status === 'success')
          .reduce((sum, t) => sum + t.amount, 0);
        const summary = [
          { label: 'Total Pengajuan', value: `${topupReportData.length} Dokumen` },
          { label: 'Total Topup Disetujui', value: formatIDR(totalApproved) }
        ];

        if (format === 'excel') {
          exportToExcel({
            fileName: `Laporan_TopUp_${timestampStr}`,
            sheetName: 'Top Up',
            title: 'Laporan Riwayat Top Up Saldo',
            periodLabel,
            columns,
            data: exportData,
            summaryRows: summary
          });
        } else {
          exportToPdf({
            title: 'LAPORAN RIWAYAT TOP UP SALDO',
            subtitle: 'Rekapitulasi Top Up QRIS, Transfer, dan Tunai',
            periodLabel,
            columns,
            data: exportData,
            fileName: `Laporan_TopUp_${timestampStr}`,
            summaryRows: summary,
            pesantrenName: pesantren
          });
        }
      } else if (activeReport === 'top_products') {
        const columns: ExportColumn[] = [
          { header: 'Peringkat', dataKey: 'rank' },
          { header: 'SKU', dataKey: 'sku' },
          { header: 'Nama Produk', dataKey: 'productName' },
          { header: 'Kategori', dataKey: 'categoryName' },
          { header: 'Qty Terjual', dataKey: 'soldFormatted' },
          { header: 'Total Omzet', dataKey: 'omzetFormatted' },
          { header: 'Estimasi Laba', dataKey: 'profitFormatted' },
          { header: 'Sisa Stok', dataKey: 'stockFormatted' }
        ];

        const exportData = topProductsReportData.map((p, idx) => ({
          ...p,
          rank: `#${idx + 1}`,
          soldFormatted: `${p.totalSold} ${p.unit}`,
          omzetFormatted: formatIDR(p.totalOmzet),
          profitFormatted: formatIDR(p.grossProfit),
          stockFormatted: `${p.currentStock} ${p.unit}`
        }));

        const totalUnits = topProductsReportData.reduce((sum, p) => sum + p.totalSold, 0);
        const totalOmzet = topProductsReportData.reduce((sum, p) => sum + p.totalOmzet, 0);
        const summary = [
          { label: 'Total Item Terjual', value: `${totalUnits} Unit` },
          { label: 'Total Omzet Produk', value: formatIDR(totalOmzet) }
        ];

        if (format === 'excel') {
          exportToExcel({
            fileName: `Laporan_Produk_Terlaris_${timestampStr}`,
            sheetName: 'Produk Terlaris',
            title: 'Laporan Peringkat Penjualan Produk',
            periodLabel,
            columns,
            data: exportData,
            summaryRows: summary
          });
        } else {
          exportToPdf({
            title: 'LAPORAN PRODUK TERLARIS SANTRIWATI',
            subtitle: 'Analisis Ranking Produk & Kontribusi Omzet',
            periodLabel,
            columns,
            data: exportData,
            fileName: `Laporan_Produk_Terlaris_${timestampStr}`,
            summaryRows: summary,
            pesantrenName: pesantren
          });
        }
      } else if (activeReport === 'stock') {
        const columns: ExportColumn[] = [
          { header: 'SKU', dataKey: 'sku' },
          { header: 'Barcode', dataKey: 'barcode' },
          { header: 'Nama Produk', dataKey: 'name' },
          { header: 'Kategori', dataKey: 'categoryName' },
          { header: 'Harga Beli (HPP)', dataKey: 'costFormatted' },
          { header: 'Harga Jual', dataKey: 'priceFormatted' },
          { header: 'Stok', dataKey: 'stockFormatted' },
          { header: 'Status Stok', dataKey: 'stockStatus' },
          { header: 'Nilai Aset (HPP)', dataKey: 'valueFormatted' }
        ];

        const exportData = stockReportData.map((p) => ({
          ...p,
          costFormatted: formatIDR(p.costPrice),
          priceFormatted: formatIDR(p.sellingPrice),
          stockFormatted: `${p.stock} ${p.unit}`,
          valueFormatted: formatIDR(p.inventoryValue)
        }));

        const totalInventoryValue = stockReportData.reduce((sum, p) => sum + p.inventoryValue, 0);
        const lowStockCount = stockReportData.filter((p) => p.stock <= p.minStock).length;
        const summary = [
          { label: 'Total Katalog SKU', value: `${stockReportData.length} Produk` },
          { label: 'Total Nilai Inventori', value: formatIDR(totalInventoryValue) },
          { label: 'Stok Menipis', value: `${lowStockCount} Produk` }
        ];

        if (format === 'excel') {
          exportToExcel({
            fileName: `Laporan_Stok_Inventori_${timestampStr}`,
            sheetName: 'Stok Barang',
            title: 'Laporan Stok & Nilai Aset Inventori',
            periodLabel: 'Kondisi Saat Ini (Real-time)',
            columns,
            data: exportData,
            summaryRows: summary
          });
        } else {
          exportToPdf({
            title: 'LAPORAN STATUS STOK & VALUASI INVENTORI',
            subtitle: 'Daftar Barang, Minimum Stok, dan Nilai HPP',
            periodLabel: 'Kondisi Real-time',
            columns,
            data: exportData,
            fileName: `Laporan_Stok_Inventori_${timestampStr}`,
            summaryRows: summary,
            pesantrenName: pesantren
          });
        }
      } else if (activeReport === 'stock_receipts') {
        const columns: ExportColumn[] = [
          { header: 'No. Dokumen', dataKey: 'receiptNumber' },
          { header: 'Tgl Terima', dataKey: 'receivedDate' },
          { header: 'Supplier Mitra', dataKey: 'supplierName' },
          { header: 'No. Faktur/DO', dataKey: 'invoiceOrDoNumber' },
          { header: 'Penerima', dataKey: 'receivedByName' },
          { header: 'Rincian Barang', dataKey: 'itemsList' },
          { header: 'Total Biaya', dataKey: 'totalCostFormatted' }
        ];

        const exportData = stockReceiptsReportData.map((r) => ({
          ...r,
          itemsList: r.items?.map((i) => `${i.productName} (${i.quantity} ${i.unit || 'pcs'})`).join(', ') || '-',
          totalCostFormatted: formatIDR(r.totalCost)
        }));

        const totalCost = stockReceiptsReportData.reduce((sum, r) => sum + r.totalCost, 0);
        const summary = [
          { label: 'Total Penerimaan', value: `${stockReceiptsReportData.length} Dokumen` },
          { label: 'Total Belanja Restok', value: formatIDR(totalCost) }
        ];

        if (format === 'excel') {
          exportToExcel({
            fileName: `Laporan_Penerimaan_Barang_${timestampStr}`,
            sheetName: 'Penerimaan Barang',
            title: 'Laporan Penerimaan Barang Supplier',
            periodLabel,
            columns,
            data: exportData,
            summaryRows: summary
          });
        } else {
          exportToPdf({
            title: 'LAPORAN PENERIMAAN BARANG SUPPLIER',
            subtitle: 'Riwayat Inward Stock & Pengiriman Distributor',
            periodLabel,
            columns,
            data: exportData,
            fileName: `Laporan_Penerimaan_Barang_${timestampStr}`,
            summaryRows: summary,
            pesantrenName: pesantren
          });
        }
      } else if (activeReport === 'stock_opname') {
        const columns: ExportColumn[] = [
          { header: 'No. Opname', dataKey: 'adjustmentNumber' },
          { header: 'Waktu', dataKey: 'waktu' },
          { header: 'Nama Produk', dataKey: 'productName' },
          { header: 'Stok Sistem', dataKey: 'systemStock' },
          { header: 'Stok Fisik', dataKey: 'physicalStock' },
          { header: 'Selisih Unit', dataKey: 'diffFormatted' },
          { header: 'Nilai Selisih', dataKey: 'valDiffFormatted' },
          { header: 'Jenis Opname', dataKey: 'adjustmentType' },
          { header: 'Alasan', dataKey: 'reason' },
          { header: 'Petugas', dataKey: 'adjustedByName' }
        ];

        const exportData = stockOpnameReportData.map((adj) => ({
          ...adj,
          waktu: new Date(adj.createdAt).toLocaleString('id-ID'),
          diffFormatted: adj.difference > 0 ? `+${adj.difference}` : String(adj.difference),
          valDiffFormatted: formatIDR(adj.totalValueDifference)
        }));

        const totalDiffVal = stockOpnameReportData.reduce((sum, adj) => sum + adj.totalValueDifference, 0);
        const summary = [
          { label: 'Total Dokumen Opname', value: `${stockOpnameReportData.length} Audit` },
          { label: 'Total Nilai Selisih', value: formatIDR(totalDiffVal) }
        ];

        if (format === 'excel') {
          exportToExcel({
            fileName: `Laporan_Stok_Opname_${timestampStr}`,
            sheetName: 'Stok Opname',
            title: 'Laporan Penyesuaian & Opname Stok',
            periodLabel,
            columns,
            data: exportData,
            summaryRows: summary
          });
        } else {
          exportToPdf({
            title: 'LAPORAN STOK OPNAME & AUDIT FISIK',
            subtitle: 'Rekapitulasi Selisih Fisik vs Sistem & Adjustment',
            periodLabel,
            columns,
            data: exportData,
            fileName: `Laporan_Stok_Opname_${timestampStr}`,
            summaryRows: summary,
            pesantrenName: pesantren
          });
        }
      }

      showNotification('success', `Berhasil mengekspor Laporan dalam format ${format.toUpperCase()}`);
    } catch (err: any) {
      console.error('Export error:', err);
      showNotification('error', `Gagal mengekspor laporan: ${err.message || 'Terjadi kesalahan'}`);
    }
  };

  // Report navigation tabs configuration
  const reportTabs: Array<{ id: ReportType; label: string; icon: React.FC<any>; count: number }> = [
    { id: 'transactions', label: '1. Transaksi', icon: Receipt, count: transactionReportData.length },
    { id: 'turnover', label: '2. Omzet & Laba', icon: TrendingUp, count: turnoverReportData.length },
    { id: 'balance', label: '3. Saldo Santri', icon: Users2, count: balanceReportData.length },
    { id: 'topup', label: '4. Top Up', icon: Wallet, count: topupReportData.length },
    { id: 'top_products', label: '5. Produk Terlaris', icon: Flame, count: topProductsReportData.length },
    { id: 'stock', label: '6. Stok Barang', icon: Package, count: stockReportData.length },
    { id: 'stock_receipts', label: '7. Penerimaan Barang', icon: Truck, count: stockReceiptsReportData.length },
    { id: 'stock_opname', label: '8. Stok Opname', icon: ClipboardList, count: stockOpnameReportData.length }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Pusat Rekapitulasi & Akuntansi
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-300">Live Firestore Single Source of Truth</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Modul Laporan AMANAH Smart Mart
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Seluruh rekapitulasi transaksi, omzet, peredaran saldo, top up, produk terlaris, status stok,
              penerimaan barang, dan opname dihitung secara dinamis dan dapat diekspor langsung ke Excel & PDF.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="btn-export-excel"
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
            <button
              id="btn-export-pdf"
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-950/50 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Ekspor PDF (.pdf)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Filter Bar: Period & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Period Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Periode:</span>
            </span>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilter === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              7 Hari Terakhir (Mingguan)
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilter === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bulan Ini (Bulanan)
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilter === 'custom'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Custom Tanggal
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kata kunci data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Custom Date Pickers (Shown if custom filter is active) */}
        {dateFilter === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600">Rentang Tanggal:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-[11px] text-slate-400 italic">Filter berlaku pada seluruh tabel di bawah.</span>
          </div>
        )}
      </div>

      {/* 8 Report Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Report Content Body based on activeReport */}

      {/* 1. Laporan Transaksi */}
      {activeReport === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Sub Header & Summary Card */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span>Laporan Transaksi Kasir POS RFID</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Periode: <span className="font-semibold text-slate-700">{periodLabel}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Transaksi</p>
                <p className="text-sm font-extrabold text-slate-900">{transactionReportData.length} Trx</p>
              </div>
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Omzet</p>
                <p className="text-sm font-extrabold text-emerald-600">
                  {formatIDR(transactionReportData.reduce((sum, t) => sum + (t.totalAmount || 0), 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No.</th>
                  <th className="py-3.5 px-4">Invoice</th>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Santriwati</th>
                  <th className="py-3.5 px-4">Detail Items</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4 text-right">Total Belanja</th>
                  <th className="py-3.5 px-4">Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactionReportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada data transaksi pada periode ini
                    </td>
                  </tr>
                ) : (
                  transactionReportData.map((trx, idx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{trx.invoiceNumber}</td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(trx.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{trx.santriwatiName}</p>
                        <p className="text-[11px] text-slate-400">NIS: {trx.santriwatiNis}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-slate-700">
                          {trx.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ') || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                          {trx.paymentMethod === 'rfid_card' ? 'RFID Santri' : trx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatIDR(trx.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{trx.cashierName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Laporan Omzet & Laba */}
      {activeReport === 'turnover' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span>Laporan Rekapitulasi Omzet, HPP, & Laba Kotor</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dihitung dari data transaksi riil penjualan produk vs HPP supplier
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Omzet</p>
                <p className="text-sm font-extrabold text-emerald-600">
                  {formatIDR(turnoverReportData.reduce((sum, r) => sum + r.totalRevenue, 0))}
                </p>
              </div>
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total HPP Modal</p>
                <p className="text-sm font-extrabold text-slate-700">
                  {formatIDR(turnoverReportData.reduce((sum, r) => sum + r.totalCost, 0))}
                </p>
              </div>
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Laba Kotor</p>
                <p className="text-sm font-extrabold text-indigo-600">
                  {formatIDR(turnoverReportData.reduce((sum, r) => sum + r.grossProfit, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4 text-center">Volume Trx</th>
                  <th className="py-3.5 px-4 text-center">Item Terjual</th>
                  <th className="py-3.5 px-4 text-right">Total Omzet (Penjualan)</th>
                  <th className="py-3.5 px-4 text-right">Total Modal (HPP)</th>
                  <th className="py-3.5 px-4 text-right">Laba Kotor Kantin</th>
                  <th className="py-3.5 px-4 text-center">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {turnoverReportData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada data omzet pada rentang tanggal ini
                    </td>
                  </tr>
                ) : (
                  turnoverReportData.map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{row.dateFormatted}</td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">{row.transactionCount}</td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">{row.itemsSoldCount} pcs</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                        {formatIDR(row.totalRevenue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-600">
                        {formatIDR(row.totalCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-indigo-600">
                        {formatIDR(row.grossProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {row.marginPercent}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Laporan Saldo Santriwati */}
      {activeReport === 'balance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users2 className="w-5 h-5 text-blue-600" />
                <span>Laporan Saldo & Mutasi Belanja Santriwati</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Peredaran deposit saldo santriwati dan total belanja di periode ini
              </p>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Saldo Beredar</p>
              <p className="text-sm font-extrabold text-indigo-600">
                {formatIDR(balanceReportData.reduce((sum, s) => sum + s.balance, 0))}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No.</th>
                  <th className="py-3.5 px-4">NIS</th>
                  <th className="py-3.5 px-4">Nama Santriwati</th>
                  <th className="py-3.5 px-4">Kelas & Asrama</th>
                  <th className="py-3.5 px-4 text-right">Saldo Saat Ini</th>
                  <th className="py-3.5 px-4 text-right">Limit Harian</th>
                  <th className="py-3.5 px-4 text-right">Belanja Periode Ini</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balanceReportData.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{s.nis}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <p>{s.classRoom}</p>
                      <p className="text-[10px] text-slate-400">{s.dormitory}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                      {formatIDR(s.balance)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      {formatIDR(s.dailyLimit)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-indigo-600">
                      {formatIDR(s.totalPeriodSpend)} ({s.totalPeriodTrx} Trx)
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={s.status === 'active' ? 'success' : 'neutral'}>
                        {s.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Laporan Top Up */}
      {activeReport === 'topup' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-600" />
                <span>Laporan Riwayat Top Up Saldo Santriwati</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengajuan setoran saldo melalui QRIS, Transfer Bank, dan Tunai
              </p>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Top Up Masuk</p>
              <p className="text-sm font-extrabold text-emerald-600">
                {formatIDR(
                  topupReportData
                    .filter((t) => t.status === 'approved' || t.status === 'success')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No. Top Up</th>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Santriwati</th>
                  <th className="py-3.5 px-4 text-right">Nominal</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Petugas Approver</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topupReportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada riwayat top up pada rentang periode ini
                    </td>
                  </tr>
                ) : (
                  topupReportData.map((top) => (
                    <tr key={top.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{top.topupNumber}</td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(top.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{top.santriName}</p>
                        <p className="text-[11px] text-slate-400">NIS: {top.santriNis || '-'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatIDR(top.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {top.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            top.status === 'approved' || top.status === 'success'
                              ? 'success'
                              : top.status === 'pending'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {top.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{top.approvedByName || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">{top.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Laporan Produk Terlaris */}
      {activeReport === 'top_products' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-600" />
                <span>Laporan Peringkat Produk Terlaris Santriwati</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar produk dengan volume penjualan dan perolehan omzet tertinggi
              </p>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Item Terjual</p>
              <p className="text-sm font-extrabold text-slate-900">
                {topProductsReportData.reduce((sum, p) => sum + p.totalSold, 0)} Unit
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Peringkat</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Nama Produk</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 text-center">Volume Terjual</th>
                  <th className="py-3.5 px-4 text-right">Total Omzet</th>
                  <th className="py-3.5 px-4 text-right">Estimasi Laba</th>
                  <th className="py-3.5 px-4 text-center">Sisa Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProductsReportData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Belum ada penjualan produk pada rentang tanggal ini
                    </td>
                  </tr>
                ) : (
                  topProductsReportData.map((item, idx) => (
                    <tr key={item.productId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-amber-900/10 text-amber-900'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{item.sku}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.productName}</td>
                      <td className="py-3.5 px-4 text-slate-500">{item.categoryName}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">{formatIDR(item.price)}</td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                        {item.totalSold} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                        {formatIDR(item.totalOmzet)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-600">
                        {formatIDR(item.grossProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                        {item.currentStock} {item.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Laporan Stok Barang & Valuasi */}
      {activeReport === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <span>Laporan Status Stok & Valuasi Inventori</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kondisi stok realtime, batas minimum peringatan, dan total nilai aset barang
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Nilai Stok (HPP)</p>
                <p className="text-sm font-extrabold text-purple-600">
                  {formatIDR(stockReportData.reduce((sum, p) => sum + p.inventoryValue, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Barcode</th>
                  <th className="py-3.5 px-4">Nama Produk</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-right">HPP (Modal)</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                  <th className="py-3.5 px-4 text-center">Min. Stok</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Nilai Aset Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockReportData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.sku}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.barcode}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{p.categoryName}</td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">{formatIDR(p.costPrice)}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800">{formatIDR(p.sellingPrice)}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                      {p.stock} {p.unit}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                      {p.minStock} {p.unit}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          p.stockStatus === 'Aman'
                            ? 'success'
                            : p.stockStatus === 'Menipis'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {p.stockStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-purple-700">
                      {formatIDR(p.inventoryValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Laporan Penerimaan Barang */}
      {activeReport === 'stock_receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>Laporan Penerimaan Barang Supplier (Restok)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Surat jalan, pengiriman distributor, dan mutasi barang masuk
              </p>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Biaya Belanja</p>
              <p className="text-sm font-extrabold text-slate-900">
                {formatIDR(stockReceiptsReportData.reduce((sum, r) => sum + r.totalCost, 0))}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No. Penerimaan</th>
                  <th className="py-3.5 px-4">Tanggal Terima</th>
                  <th className="py-3.5 px-4">Supplier Mitra</th>
                  <th className="py-3.5 px-4">No. Surat Jalan / Faktur</th>
                  <th className="py-3.5 px-4">Barang Diterima</th>
                  <th className="py-3.5 px-4">Penerima</th>
                  <th className="py-3.5 px-4 text-right">Total Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockReceiptsReportData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada dokumen penerimaan barang pada periode ini
                    </td>
                  </tr>
                ) : (
                  stockReceiptsReportData.map((rcv) => (
                    <tr key={rcv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{rcv.receiptNumber}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{rcv.receivedDate}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{rcv.supplierName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{rcv.invoiceOrDoNumber || '-'}</td>
                      <td className="py-3.5 px-4 max-w-xs text-slate-700">
                        {rcv.items?.map((i) => `${i.productName} (${i.quantity} ${i.unit || 'pcs'})`).join(', ') || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{rcv.receivedByName}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatIDR(rcv.totalCost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Laporan Stok Opname */}
      {activeReport === 'stock_opname' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <span>Laporan Riwayat Stok Opname & Audit Fisik</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencocokan stok sistem dengan fisik di rak, selisih barang, dan alasan penyesuaian
              </p>
            </div>

            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Penyesuaian</p>
              <p className="text-sm font-extrabold text-indigo-600">
                {stockOpnameReportData.length} Catatan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No. Opname</th>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Produk</th>
                  <th className="py-3.5 px-4 text-center">Stok Sistem</th>
                  <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                  <th className="py-3.5 px-4 text-center">Selisih</th>
                  <th className="py-3.5 px-4 text-right">Nilai Selisih</th>
                  <th className="py-3.5 px-4">Jenis & Alasan</th>
                  <th className="py-3.5 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockOpnameReportData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Tidak ada catatan stok opname pada rentang tanggal ini
                    </td>
                  </tr>
                ) : (
                  stockOpnameReportData.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{adj.adjustmentNumber}</td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(adj.createdAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{adj.productName}</p>
                        <p className="text-[11px] text-slate-400">SKU: {adj.sku || '-'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{adj.systemStock}</td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">{adj.physicalStock}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-extrabold ${
                            adj.difference > 0
                              ? 'text-emerald-600'
                              : adj.difference < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {adj.difference > 0 ? `+${adj.difference}` : adj.difference}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatIDR(adj.totalValueDifference)}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 capitalize">{adj.adjustmentType || 'Penyesuaian'}</p>
                        <p className="text-[11px] text-slate-500">{adj.reason}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{adj.adjustedByName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
