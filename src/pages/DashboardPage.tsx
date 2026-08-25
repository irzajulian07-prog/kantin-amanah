import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users2,
  Package,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  CreditCard,
  CheckCircle2,
  Calendar,
  BarChart3,
  Flame,
  ArrowRight,
  Clock,
  CircleDollarSign,
  FileSpreadsheet,
  Layers,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatsCard } from '../components/common/StatsCard';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  const { user, role, canEditMasterData } = useAuth();
  const { santriwati, products, categories, transactions, topups, auditLogs, settings } = useData();
  const navigate = useNavigate();
  const [chartViewMode, setChartViewMode] = useState<'omzet' | 'transaksi' | 'combined'>('combined');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const todayStr = new Date().toDateString();

  // 1. Live Metrics Calculation directly from Firestore/DataContext
  const activeSantriwatiCount = useMemo(() => {
    return santriwati.filter((s) => s.status === 'active').length;
  }, [santriwati]);

  const totalSantriBalance = useMemo(() => {
    return santriwati.reduce((sum, s) => sum + (s.balance || 0), 0);
  }, [santriwati]);

  const todayCompletedTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.status === 'completed' && new Date(t.createdAt).toDateString() === todayStr
    );
  }, [transactions, todayStr]);

  const todayTransactionsCount = todayCompletedTransactions.length;

  const todayRevenue = useMemo(() => {
    return todayCompletedTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  }, [todayCompletedTransactions]);

  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock);
  }, [products]);

  const todayTopups = useMemo(() => {
    return topups.filter((t) => new Date(t.createdAt).toDateString() === todayStr);
  }, [topups, todayStr]);

  const todayApprovedTopupsAmount = useMemo(() => {
    return todayTopups
      .filter((t) => t.status === 'approved' || t.status === 'success')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [todayTopups]);

  const pendingTopupCount = useMemo(() => {
    return topups.filter((t) => t.status === 'pending').length;
  }, [topups]);

  // 2. Top Selling Products (Produk Terlaris) computed directly from completed transactions
  const topSellingProducts = useMemo(() => {
    const productStatsMap: Record<
      string,
      {
        productId: string;
        name: string;
        sku?: string;
        quantity: number;
        totalRevenue: number;
        currentStock: number;
        unit?: string;
        photoURL?: string;
      }
    > = {};

    transactions
      .filter((t) => t.status === 'completed')
      .forEach((trx) => {
        trx.items?.forEach((item) => {
          if (!productStatsMap[item.productId]) {
            const matchedProduct = products.find((p) => p.id === item.productId);
            productStatsMap[item.productId] = {
              productId: item.productId,
              name: item.productName || matchedProduct?.name || 'Produk Kantin',
              sku: item.sku || matchedProduct?.sku || '-',
              quantity: 0,
              totalRevenue: 0,
              currentStock: matchedProduct?.stock || 0,
              unit: item.unit || matchedProduct?.unit || 'pcs',
              photoURL: matchedProduct?.photoURL
            };
          }
          productStatsMap[item.productId].quantity += item.quantity || 0;
          productStatsMap[item.productId].totalRevenue += item.subtotal || item.price * (item.quantity || 0);
        });
      });

    return Object.values(productStatsMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [transactions, products]);

  // 3. 7-Day Transaction Chart Data for Recharts
  const last7DaysChartData = useMemo(() => {
    const daysArray = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const dateKey = targetDate.toISOString().slice(0, 10);
      const targetDateStr = targetDate.toDateString();

      const dayTrx = transactions.filter(
        (t) => t.status === 'completed' && new Date(t.createdAt).toDateString() === targetDateStr
      );

      const dayOmzet = dayTrx.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const dayTrxCount = dayTrx.length;
      const dayTopups = topups.filter(
        (t) =>
          (t.status === 'approved' || t.status === 'success') &&
          new Date(t.createdAt).toDateString() === targetDateStr
      );
      const dayTopupAmount = dayTopups.reduce((sum, t) => sum + (t.amount || 0), 0);

      daysArray.push({
        date: dateKey,
        label: i === 0 ? 'Hari Ini' : `${dayNames[targetDate.getDay()]} (${targetDate.getDate()}/${targetDate.getMonth() + 1})`,
        fullDate: targetDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }),
        omzet: dayOmzet,
        transaksi: dayTrxCount,
        topup: dayTopupAmount
      });
    }
    return daysArray;
  }, [transactions, topups]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[170px]">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{data.fullDate}</span>
          </p>
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-slate-400">Omzet Kantin:</span>
            <span className="font-bold">{formatIDR(data.omzet)}</span>
          </div>
          <div className="flex justify-between items-center text-blue-400">
            <span className="text-slate-400">Jumlah Transaksi:</span>
            <span className="font-bold">{data.transaksi} Transaksi</span>
          </div>
          {data.topup > 0 && (
            <div className="flex justify-between items-center text-amber-400 pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Top Up Saldo:</span>
              <span className="font-bold">{formatIDR(data.topup)}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Integrated Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {settings.pesantrenName || 'Pondok Pesantren Darul Amanah'}
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-300 capitalize">
                Role: <span className="text-emerald-400 uppercase font-bold">{role}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ahlan wa Sahlan, {user?.displayName || 'Petugas'}!
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Dashboard Real-time AMANAH Smart Mart. Seluruh metrik omzet, peredaran saldo santriwati, top up,
              dan mutasi inventori dihitung langsung dari data Firestore aktif.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              id="btn-quick-pos"
              onClick={() => navigate('/kasir')}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Buka Kasir POS RFID</span>
            </button>
            <button
              id="btn-quick-topup"
              onClick={() => navigate('/topup')}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/50 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Top Up Saldo</span>
              {pendingTopupCount > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-extrabold">
                  {pendingTopupCount}
                </span>
              )}
            </button>
            <button
              id="btn-quick-reports"
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950/50 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Laporan & Rekap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Required Real-Time Firestore Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Omzet Hari Ini */}
        <StatsCard
          id="stat-omzet-today"
          title="Omzet Hari Ini"
          value={formatIDR(todayRevenue)}
          subtitle={`${todayTransactionsCount} Transaksi Kasir Hari Ini`}
          icon={Receipt}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          onClick={() => navigate('/kasir')}
          trend={{ label: 'Kasir POS RFID', isPositive: true }}
        />

        {/* 2. Santriwati Aktif */}
        <StatsCard
          id="stat-santriwati-aktif"
          title="Santriwati Aktif"
          value={activeSantriwatiCount}
          subtitle={`Dari total ${santriwati.length} santriwati`}
          icon={Users2}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          onClick={() => navigate('/santriwati')}
          trend={{ label: 'Kartu RFID Aktif', isPositive: true }}
        />

        {/* 3. Total Saldo Beredar */}
        <StatsCard
          id="stat-saldo-beredar"
          title="Total Saldo Beredar"
          value={formatIDR(totalSantriBalance)}
          subtitle="Deposit Santriwati di Kantin"
          icon={CircleDollarSign}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          onClick={() => navigate('/topup')}
          trend={{ label: 'Kas Dompet Digital', isPositive: true }}
        />

        {/* 4. Stok Menipis */}
        <StatsCard
          id="stat-stok-menipis"
          title="Stok Menipis"
          value={lowStockItems.length}
          subtitle={lowStockItems.length > 0 ? 'Perlu Restok / Order Ulang' : 'Semua Stok Aman'}
          icon={AlertTriangle}
          iconColor={lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}
          iconBg={lowStockItems.length > 0 ? 'bg-rose-50' : 'bg-emerald-50'}
          onClick={() => navigate('/inventory')}
          trend={{
            label: lowStockItems.length > 0 ? 'Perlu Restok Segera' : 'Stok Optimal',
            isPositive: lowStockItems.length === 0
          }}
        />

        {/* 5. Top Up Hari Ini */}
        <StatsCard
          id="stat-topup-today"
          title="Top Up Hari Ini"
          value={formatIDR(todayApprovedTopupsAmount)}
          subtitle={`${todayTopups.length} Pengajuan (${todayTopups.filter(t => t.status === 'pending').length} Pending)`}
          icon={Wallet}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          onClick={() => navigate('/topup')}
          trend={{ label: 'QRIS / Bank / Tunai', isPositive: true }}
        />

        {/* 6. Transaksi Hari Ini */}
        <StatsCard
          id="stat-transaksi-today"
          title="Transaksi Hari Ini"
          value={`${todayTransactionsCount} Trx`}
          subtitle={`Rata-rata: ${todayTransactionsCount > 0 ? formatIDR(todayRevenue / todayTransactionsCount) : 'Rp 0'}`}
          icon={ShoppingBag}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50"
          onClick={() => navigate('/reports')}
          trend={{ label: 'Hari Ini', isPositive: true }}
        />

        {/* 7. Katalog Produk */}
        <StatsCard
          id="stat-total-products"
          title="Katalog Produk"
          value={products.length}
          subtitle={`${categories.length} Kategori Kantin`}
          icon={Package}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          onClick={() => navigate('/products')}
          trend={{ label: 'Siap Dijual', isPositive: true }}
        />

        {/* 8. Modul Laporan Cepat */}
        <StatsCard
          id="stat-quick-reports"
          title="Laporan & Ekspor"
          value="8 Modul"
          subtitle="Excel & PDF Real-time"
          icon={FileSpreadsheet}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          onClick={() => navigate('/reports')}
          trend={{ label: 'Buka Rekapitulasi', isPositive: true }}
        />
      </div>

      {/* 7-Day Interactive Transaction Graph Section (Recharts) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Grafik Transaksi 7 Hari Terakhir</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tren omzet harian kantin dan volume transaksi santriwati terhitung otomatis dari Firestore
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setChartViewMode('combined')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartViewMode === 'combined'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('omzet')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartViewMode === 'omzet'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Omzet (IDR)
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('transaksi')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartViewMode === 'transaksi'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Volume Transaksi
              </button>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <span>Detail Laporan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chart Rendering */}
        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartViewMode === 'omzet' ? (
              <AreaChart data={last7DaysChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="omzetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  name="Omzet (IDR)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#omzetGradient)"
                />
              </AreaChart>
            ) : (
              <BarChart data={last7DaysChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                />
                {chartViewMode === 'combined' && (
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {(chartViewMode === 'combined' || chartViewMode === 'omzet') && (
                  <Bar
                    yAxisId="left"
                    dataKey="omzet"
                    name="Omzet (IDR)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                )}
                {(chartViewMode === 'combined' || chartViewMode === 'transaksi') && (
                  <Bar
                    yAxisId={chartViewMode === 'combined' ? 'right' : 'left'}
                    dataKey="transaksi"
                    name="Jumlah Transaksi"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={28}
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Produk Terlaris & Peringatan Stok Menipis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Produk Terlaris (Top Selling Products) - 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Produk Terlaris Santriwati</h3>
                  <p className="text-xs text-slate-500">Peringkat produk berdasarkan akumulasi volume penjualan</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/reports')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Lihat Laporan</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {topSellingProducts.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-50 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">Belum ada transaksi tercatat</p>
                  <p className="text-xs text-slate-400 mt-0.5">Produk terlaris akan otomatis terhitung saat kasir memproses transaksi.</p>
                </div>
              ) : (
                topSellingProducts.map((prod, idx) => (
                  <div key={prod.productId} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
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
                      </div>
                      <img
                        src={prod.photoURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{prod.name}</p>
                        <p className="text-xs text-slate-500">
                          SKU: {prod.sku} • Sisa Stok: <span className="font-semibold text-slate-700">{prod.currentStock} {prod.unit}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-emerald-700">
                        {prod.quantity} <span className="text-xs font-semibold text-slate-600">{prod.unit} terjual</span>
                      </p>
                      <p className="text-xs font-medium text-slate-400">{formatIDR(prod.totalRevenue)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dihitung secara realtime dari koleksi transaksi</span>
            <button
              onClick={() => navigate('/kasir')}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <span>Transaksi Baru</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Peringatan Stok Menipis - 5 cols */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Peringatan Stok Menipis</h3>
                  <p className="text-xs text-slate-500">Item yang berada di bawah ambang batas minimum</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/inventory')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <span>Restok</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {lowStockItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-90" />
                  <p className="text-sm font-semibold text-slate-800">Alhamdulillah! Semua Stok Aman</p>
                  <p className="text-xs text-slate-400 mt-0.5">Tidak ada produk yang berada di bawah minimum stok.</p>
                </div>
              ) : (
                lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.categoryName} • Min: {item.minStock} {item.unit}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        Sisa: {item.stock} {item.unit}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {lowStockItems.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => navigate('/inventory')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                <span>Buat Penerimaan Barang Baru</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Transaksi Terakhir & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transaksi Terkini - 8 cols */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-700" />
              <h3 className="text-base font-bold text-slate-900">Transaksi Kantin Terkini</h3>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Semua Laporan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Santriwati</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Metode</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pb-3 text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-900">{trx.invoiceNumber}</td>
                    <td className="py-3">
                      <p className="font-semibold text-slate-800">{trx.santriwatiName}</p>
                      <p className="text-[10px] text-slate-400">NIS: {trx.santriwatiNis}</p>
                    </td>
                    <td className="py-3">
                      <span className="text-slate-700 font-medium">
                        {trx.items?.map((i) => `${i.productName} (${i.quantity})`).join(', ') || '-'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        {trx.paymentMethod === 'rfid_card' ? 'RFID Santri' : trx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-right font-extrabold text-slate-900">{formatIDR(trx.totalAmount)}</td>
                    <td className="py-3 text-right text-[11px] text-slate-400">
                      {new Date(trx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Activity - 4 cols */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Clock className="w-5 h-5 text-slate-600" />
              <h3 className="text-base font-bold text-slate-900">Aktivitas Sistem</h3>
            </div>

            <div className="mt-4 space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-indigo-500 pl-3 py-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-indigo-700 uppercase">{log.module}</span>
                    <span>
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-medium text-slate-800 mt-0.5">{log.details}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Oleh: {log.userName}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Audit Trail Keamanan Terpusat</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Realtime</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
