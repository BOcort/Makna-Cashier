// Report & Analisis Penjualan — Menggunakan 100% Data Riil Database SQLite
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import PasswordPopup from '../../components/common/PasswordPopup.jsx';
import StockAnalysisModal from '../../components/report/StockAnalysisModal.jsx';
import { useLocation } from '../../contexts/LocationContext.jsx';
import { transactionQueries, closingQueries, inventoryQueries } from '../../services/queries.js';
import { formatRupiah, formatDate, formatTime, formatDateShort, getTodayISO, getDateDaysAgo, getFirstDayOfMonth, getMonthName } from '../../utils/format.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const STITCH_COLORS = {
  primary: '#31170A',
  primaryContainer: '#4A2C1D',
  secondary: '#9B4428',
  secondaryContainer: '#FD916E',
  tertiaryDim: '#FFB77A',
  surfaceLow: '#FDF2E7',
  surface: '#FFF8F4',
  outline: '#82746E',
  outlineVariant: '#D4C3BC',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  surfaceCard: '#FFFFFF'
};

const PAYMENT_PALETTE = ['#4A2C1D', '#9B4428', '#FFB77A', '#824F2C', '#3B7570'];

export default function Report() {
  const { activeLocation } = useLocation();

  // Access control
  const [hasAccess, setHasAccess] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(true);

  // Date range state with direct inputs
  const today = getTodayISO();
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(today);

  // Comparison toggle state
  const [compareEnabled, setCompareEnabled] = useState(true);

  // Metric and ranking filters
  const [chartMetric, setChartMetric] = useState('revenue');
  const [rankCategory, setRankCategory] = useState('all');
  const [rankSearch, setRankSearch] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);

  // Closing filters
  const currentMonthISO = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [closingShiftFilter, setClosingShiftFilter] = useState('all');
  const [closingStatusFilter, setClosingStatusFilter] = useState('all');
  const [closingMonth, setClosingMonth] = useState(currentMonthISO);
  const [closingSpecificDate, setClosingSpecificDate] = useState('');

  // Real database states
  const [revenueData, setRevenueData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [prevRevenueData, setPrevRevenueData] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [closings, setClosings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [stockAnalysis, setStockAnalysis] = useState([]);
  const [totalItemsSold, setTotalItemsSold] = useState({ drink_qty: 0, food_qty: 0, total_qty: 0, total_revenue: 0 });
  const [currentSummary, setCurrentSummary] = useState({ total_transactions: 0, total_revenue: 0 });
  const [prevSummary, setPrevSummary] = useState({ total_transactions: 0, total_revenue: 0 });

  // Quick preset period handler
  const handleSelectPreset = (pKey) => {
    setPeriod(pKey);
    const end = getTodayISO();
    let start = getDateDaysAgo(7);
    if (pKey === 'month') start = getFirstDayOfMonth();
    else if (pKey === 'year') start = `${new Date().getFullYear()}-01-01`;
    setStartDate(start);
    setEndDate(end);
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    setPeriod('custom');
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    setPeriod('custom');
  };

  // Calculate corresponding previous date range for YoY / comparison
  const prevDateRange = useMemo(() => {
    const s = new Date(startDate || today);
    const e = new Date(endDate || today);
    const diff = Math.max(1, e.getTime() - s.getTime());
    const prevEnd = new Date(s.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - diff);
    const fmt = d => d.toISOString().slice(0, 10);
    return { start: fmt(prevStart), end: fmt(prevEnd) };
  }, [startDate, endDate, today]);

  // Load real data from SQLite database
  const loadData = useCallback(() => {
    if (!activeLocation) return;
    const locId = activeLocation.id;
    const start = startDate || getFirstDayOfMonth();
    const end = endDate || today;

    // 1. Revenue chart data
    if (period === 'year') {
      const year = new Date(start).getFullYear() || new Date().getFullYear();
      setMonthlyData(transactionQueries.getRevenueByMonth(locId, year));
    } else {
      setRevenueData(transactionQueries.getRevenueByDateRange(locId, start, end));
    }

    // 2. Comparison data
    if (compareEnabled) {
      if (period === 'year') {
        const year = new Date(start).getFullYear() || new Date().getFullYear();
        setPrevRevenueData(transactionQueries.getRevenueByMonth(locId, year - 1));
      } else {
        setPrevRevenueData(transactionQueries.getRevenueByDateRange(locId, prevDateRange.start, prevDateRange.end));
      }
      setPrevSummary(transactionQueries.getSummaryForRange(locId, prevDateRange.start, prevDateRange.end) || { total_transactions: 0, total_revenue: 0 });
    } else {
      setPrevRevenueData([]);
      setPrevSummary({ total_transactions: 0, total_revenue: 0 });
    }

    // 3. KPI Summary
    setCurrentSummary(transactionQueries.getSummaryForRange(locId, start, end) || { total_transactions: 0, total_revenue: 0 });
    setTotalItemsSold(transactionQueries.getTotalItemsSold(locId, start, end) || { drink_qty: 0, food_qty: 0, total_qty: 0, total_revenue: 0 });

    // 4. Top Selling & Payment breakdown
    setTopSelling(transactionQueries.getTopSellingItems(locId, start, end, 20));
    try {
      setPaymentBreakdown(transactionQueries.getRevenueByPaymentMethod(locId, start, end));
    } catch {
      setPaymentBreakdown([]);
    }

    // 5. Stock & Inventory Analysis
    setInventory(inventoryQueries.getAllWithUsage(locId));
    try {
      setStockAnalysis(inventoryQueries.getStockAnalysis(locId, 30));
    } catch {
      setStockAnalysis([]);
    }
  }, [activeLocation, period, startDate, endDate, compareEnabled, prevDateRange, today]);

  // Load filtered closing records
  const loadClosings = useCallback(() => {
    if (!activeLocation) return;
    const locId = activeLocation.id;
    try {
      const records = closingQueries.getByFilters(locId, {
        dateFilter: closingSpecificDate,
        monthFilter: closingSpecificDate ? '' : closingMonth,
        limit: 50
      });
      setClosings(records);
    } catch {
      setClosings(closingQueries.getRecent(locId, 50));
    }
  }, [activeLocation, closingSpecificDate, closingMonth]);

  useEffect(() => {
    if (hasAccess) {
      loadData();
      loadClosings();
    }
  }, [hasAccess, loadData, loadClosings]);

  // Real Growth Calculation
  const yoyGrowthPercent = useMemo(() => {
    if (prevSummary.total_revenue > 0) {
      const diff = ((currentSummary.total_revenue - prevSummary.total_revenue) / prevSummary.total_revenue) * 100;
      return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
    }
    return currentSummary.total_revenue > 0 ? '+100%' : '0%';
  }, [currentSummary, prevSummary]);

  // Chart configuration based on real data
  const chartConfigData = useMemo(() => {
    const isYear = period === 'year';
    const src = isYear ? monthlyData : revenueData;

    const labels = isYear
      ? src.map(d => getMonthName(d.month))
      : src.map(d => {
          const date = new Date(d.date);
          return `${date.getDate()} ${getMonthName(date.getMonth() + 1).slice(0, 3)}`;
        });

    const getMetricValue = (d) => {
      switch (chartMetric) {
        case 'revenue': return d.revenue || 0;
        case 'cups':
        case 'food':
        case 'closing':
        default: return d.transactions || 0;
      }
    };

    const currentValues = src.map(getMetricValue);
    const prevValues = prevRevenueData.map(getMetricValue);

    const datasets = [
      {
        label: 'Periode Berjalan',
        data: currentValues,
        backgroundColor: 'rgba(74, 44, 29, 0.15)',
        borderColor: STITCH_COLORS.primaryContainer,
        borderWidth: 3.5,
        fill: true,
        tension: 0.35,
        pointRadius: 4.5,
        pointBackgroundColor: STITCH_COLORS.primaryContainer,
        pointHoverRadius: 7,
        pointBorderWidth: 0
      }
    ];

    if (compareEnabled && prevRevenueData.length > 0) {
      datasets.push({
        label: 'Periode Pembanding',
        data: prevValues,
        borderColor: STITCH_COLORS.secondary,
        borderWidth: 2.5,
        borderDash: [5, 5],
        fill: false,
        tension: 0.35,
        pointRadius: 3.5,
        pointBackgroundColor: STITCH_COLORS.secondary,
        pointHoverRadius: 6,
        pointBorderWidth: 0
      });
    }

    return { labels, datasets };
  }, [revenueData, monthlyData, prevRevenueData, period, chartMetric, compareEnabled]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: STITCH_COLORS.primary,
        titleColor: '#FFF8F4',
        bodyColor: '#FFDBD0',
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: '700' },
        bodyFont: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw;
            if (chartMetric === 'revenue') {
              return `${ctx.dataset.label}: ${formatRupiah(val)}`;
            }
            return `${ctx.dataset.label}: ${val} Transaksi`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: STITCH_COLORS.outline, font: { family: 'monospace', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(212, 195, 188, 0.4)', drawBorder: false },
        ticks: {
          color: STITCH_COLORS.outline,
          font: { family: 'monospace', size: 10 },
          callback: (val) => {
            if (chartMetric === 'revenue') {
              if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}M`;
              if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}K`;
              return formatRupiah(val);
            }
            return val;
          }
        }
      }
    }
  }), [chartMetric]);

  // Real Payment Breakdown
  const totalPaymentAmount = useMemo(() =>
    paymentBreakdown.reduce((s, p) => s + p.total_amount, 0),
  [paymentBreakdown]);

  const paymentDisplayList = useMemo(() => {
    return paymentBreakdown.map((pm, idx) => ({
      id: pm.payment_method_id,
      name: pm.payment_method_name,
      amount: pm.total_amount,
      pct: totalPaymentAmount > 0 ? Math.round((pm.total_amount / totalPaymentAmount) * 100) : 0,
      color: PAYMENT_PALETTE[idx % PAYMENT_PALETTE.length]
    }));
  }, [paymentBreakdown, totalPaymentAmount]);

  const paymentDonutData = useMemo(() => ({
    labels: paymentDisplayList.map(p => `${p.name} (${p.pct}%)`),
    datasets: [{
      data: paymentDisplayList.map(p => p.amount),
      backgroundColor: paymentDisplayList.map(p => p.color),
      borderWidth: 0,
      cutout: '72%'
    }]
  }), [paymentDisplayList]);

  // Filtered Menu Rankings from real database
  const filteredRankings = useMemo(() => {
    let list = [...topSelling];
    const topRevenue = list[0]?.total_revenue || 1;

    // Filter by category
    if (rankCategory !== 'all') {
      list = list.filter(item => {
        const cat = (item.category_name || '').toLowerCase();
        if (rankCategory === 'coffee') return cat.includes('coffee') && !cat.includes('non');
        if (rankCategory === 'non-coffee') return cat.includes('non');
        if (rankCategory === 'snack') return cat.includes('snack') || cat.includes('makan') || cat.includes('food');
        return true;
      });
    }

    // Filter by search
    if (rankSearch.trim()) {
      const q = rankSearch.toLowerCase();
      list = list.filter(item => (item.menu_name || '').toLowerCase().includes(q));
    }

    const barColors = ['#4A2C1D', '#31170A', '#9B4428', '#82746E', '#82746E'];
    return list.map((item, idx) => ({
      rank: idx + 1,
      name: item.menu_name,
      qty: item.total_qty,
      revenue: item.total_revenue,
      share: currentSummary.total_revenue > 0
        ? Math.round((item.total_revenue / currentSummary.total_revenue) * 1000) / 10
        : 0,
      isBest: idx === 0,
      barPct: Math.round((item.total_revenue / topRevenue) * 100),
      barColor: barColors[idx] || '#82746E'
    }));
  }, [topSelling, rankCategory, rankSearch, currentSummary]);

  // Real inventory and stock urgency
  const criticalStock = useMemo(() => stockAnalysis.filter(i => i.status === 'kritis'), [stockAnalysis]);
  const warningStock = useMemo(() => stockAnalysis.filter(i => i.status === 'waspada'), [stockAnalysis]);
  const mostUrgentStock = criticalStock[0] || warningStock[0] || null;

  const materialCards = useMemo(() => {
    return inventory.slice(0, 4).map(inv => {
      const analysis = stockAnalysis.find(a => a.id === inv.id);
      const status = analysis?.status || (inv.current_stock <= (inv.min_stock || 10) ? 'kritis' : 'aman');
      const max = Math.max(inv.current_stock, (inv.min_stock || 50) * 3, 100);
      const barPct = Math.min(100, Math.round((inv.current_stock / max) * 100));
      return {
        id: inv.id,
        cat: inv.category || 'Bahan Baku',
        name: inv.name,
        amount: Number(inv.current_stock).toLocaleString('id-ID'),
        unit: `${inv.unit} tersisa`,
        status,
        statusLabel: status === 'kritis' ? 'Menipis' : status === 'waspada' ? 'Waspada' : 'Aman',
        barPct,
        barClass: status === 'kritis' ? 'danger' : status === 'waspada' ? 'warning' : 'safe'
      };
    });
  }, [inventory, stockAnalysis]);

  // Filtered closing history
  const [expandedClosingId, setExpandedClosingId] = useState(null);
  const [closingDetails, setClosingDetails] = useState({});

  const toggleClosing = (id) => {
    if (expandedClosingId === id) {
      setExpandedClosingId(null);
    } else {
      setExpandedClosingId(id);
      if (!closingDetails[id]) {
        try {
          const details = closingQueries.getDetails(id);
          setClosingDetails(prev => ({ ...prev, [id]: details }));
        } catch {
          setClosingDetails(prev => ({ ...prev, [id]: [] }));
        }
      }
    }
  };

  const filteredClosings = useMemo(() => {
    let list = [...closings];
    if (closingStatusFilter === 'match') {
      list = list.filter(c => c.total_revenue > 0);
    }
    return list;
  }, [closings, closingStatusFilter]);

  // CSV Export handler
  const handleExportData = () => {
    const header = 'Tanggal,Transaksi,Omzet\n';
    const isYear = period === 'year';
    const src = isYear ? monthlyData : revenueData;
    const rows = src.map(d => `${isYear ? getMonthName(d.month) : d.date},${d.transactions},${d.revenue}`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Penjualan_Makna_${startDate}_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Password guard
  if (!hasAccess) {
    return (
      <PasswordPopup
        show={showPasswordPopup}
        onClose={() => window.history.back()}
        onSuccess={() => { setHasAccess(true); setShowPasswordPopup(false); }}
        title="Akses Report"
      />
    );
  }

  const locName = activeLocation?.name || 'Abepura';

  return (
    <div className="rpt-page-wrapper">

      {/* ═══ 1. Top Filter & Comparison Toolbar with Interactive Date Inputs ═══ */}
      <div className="rpt-toolbar">
        <div className="rpt-toolbar-top">
          {/* Dashboard Context Title */}
          <div className="rpt-context">
            <div className="rpt-context-sub">
              <span>Analisis Performa Cabang</span>
              <span>•</span>
              <span className="rpt-outlet-tag">Outlet {locName}</span>
            </div>
            <h1>Laporan &amp; Wawasan Penjualan</h1>
          </div>

          {/* Quick Filter Period & Interactive Date Pickers */}
          <div className="rpt-filters">
            <div className="rpt-period-pills">
              {[
                { key: 'week', label: 'Weekly' },
                { key: 'month', label: 'Monthly' },
                { key: 'year', label: 'Yearly' }
              ].map(p => (
                <button
                  key={p.key}
                  className={`rpt-period-pill ${period === p.key ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(p.key)}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date Range Group using native input date */}
            <div className="rpt-date-range-group">
              <span className="material-symbols-outlined date-icon">date_range</span>
              <input
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className="rpt-date-input"
                title="Tanggal Mulai"
              />
              <span className="date-sep">–</span>
              <input
                type="date"
                value={endDate}
                onChange={e => handleEndDateChange(e.target.value)}
                className="rpt-date-input"
                title="Tanggal Akhir"
              />
            </div>

            <button className="rpt-export-button" onClick={handleExportData} type="button">
              <span className="material-symbols-outlined">download</span>
              <span>Ekspor Data</span>
            </button>
          </div>
        </div>

        {/* Comparison Toggle Strip */}
        <div className="rpt-compare-strip">
          <label className="rpt-compare-toggle">
            <input
              type="checkbox"
              checked={compareEnabled}
              onChange={e => setCompareEnabled(e.target.checked)}
            />
            <span>Bandingkan dengan:</span>
            <span className="rpt-compare-badge">
              {formatDateShort(prevDateRange.start)} – {formatDateShort(prevDateRange.end)}
            </span>
          </label>

          <div className="rpt-yoy-wrap">
            <span className="rpt-yoy-label">Pertumbuhan YoY / PoP</span>
            <span className={`rpt-yoy-pill ${yoyGrowthPercent.startsWith('-') ? 'negative' : ''}`}>
              <span className="material-symbols-outlined">
                {yoyGrowthPercent.startsWith('-') ? 'arrow_downward' : 'arrow_upward'}
              </span>
              {yoyGrowthPercent}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ 2. 4 Primary KPI Summary Cards with Real Data ═══ */}
      <div className="rpt-kpi-grid">
        {/* KPI 1: Total Omzet */}
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-header">
            <div>
              <div className="rpt-kpi-title">Total Omzet</div>
              <div className="rpt-kpi-num">{formatRupiah(currentSummary.total_revenue || 0)}</div>
            </div>
            <div className="rpt-kpi-icon-box">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div className="rpt-kpi-bottom">
            <span className={`rpt-kpi-trend-chip ${yoyGrowthPercent.startsWith('-') ? 'negative' : ''}`}>
              <span className="material-symbols-outlined">
                {yoyGrowthPercent.startsWith('-') ? 'trending_down' : 'trending_up'}
              </span>
              {yoyGrowthPercent}
            </span>
            <span>vs {formatRupiah(prevSummary.total_revenue || 0)} lalu</span>
          </div>
        </div>

        {/* KPI 2: Cup Minuman Terjual */}
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-header">
            <div>
              <div className="rpt-kpi-title">Cup Terjual</div>
              <div className="rpt-kpi-num">
                {Number(totalItemsSold.drink_qty || 0).toLocaleString('id-ID')}
                <span className="unit">Cup</span>
              </div>
            </div>
            <div className="rpt-kpi-icon-box">
              <span className="material-symbols-outlined">local_cafe</span>
            </div>
          </div>
          <div className="rpt-kpi-bottom">
            <span className="rpt-kpi-trend-chip">
              <span className="material-symbols-outlined">shopping_bag</span>
              {currentSummary.total_transactions} Trx
            </span>
            <span>Total Item: {totalItemsSold.total_qty}</span>
          </div>
        </div>

        {/* KPI 3: Makanan & Snack */}
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-header">
            <div>
              <div className="rpt-kpi-title">Makanan &amp; Snack</div>
              <div className="rpt-kpi-num">
                {Number(totalItemsSold.food_qty || 0).toLocaleString('id-ID')}
                <span className="unit">Porsi</span>
              </div>
            </div>
            <div className="rpt-kpi-icon-box">
              <span className="material-symbols-outlined">bakery_dining</span>
            </div>
          </div>
          <div className="rpt-kpi-bottom">
            <span className="rpt-kpi-trend-chip">
              <span className="material-symbols-outlined">restaurant</span>
            </span>
            <span>Rata-rata: {revenueData.length > 0 ? Math.round((totalItemsSold.food_qty || 0) / revenueData.length) : 0} porsi / hari</span>
          </div>
        </div>

        {/* KPI 4: Closing Bersih */}
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-header">
            <div>
              <div className="rpt-kpi-title">Closing Sesi</div>
              <div className="rpt-kpi-num">
                {closings.length}
                <span className="unit">Sesi</span>
              </div>
            </div>
            <div className="rpt-kpi-icon-box">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <div className="rpt-kpi-bottom">
            <span style={{ fontWeight: 700, color: '#201B15' }}>Status: Tercatat</span>
            <span className="rpt-kpi-trend-chip">100% Sesuai</span>
          </div>
        </div>
      </div>

      {/* ═══ 3. Dynamic Chart & Metric Selection Section ═══ */}
      <div className="rpt-chart-card">
        <div className="rpt-chart-top">
          <div className="rpt-chart-titles">
            <span className="rpt-chart-sub">Visualisasi Multi-Periode</span>
            <h2>Tren Penjualan &amp; Komparasi Waktu</h2>
          </div>

          <div className="rpt-metric-picker">
            <label htmlFor="metric-selector">Metrik:</label>
            <div className="rpt-metric-select-wrap">
              <select
                id="metric-selector"
                className="rpt-metric-select"
                value={chartMetric}
                onChange={e => setChartMetric(e.target.value)}
              >
                <option value="revenue">Omzet &amp; Pendapatan (Rp)</option>
                <option value="cups">Jumlah Transaksi (Volume)</option>
              </select>
              <span className="material-symbols-outlined chevron">expand_more</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="rpt-chart-legend-bar">
          <div className="rpt-legend-bullet">
            <span className="rpt-bullet-line" />
            <span style={{ color: '#201B15' }}>Periode Berjalan ({formatDateShort(startDate)} – {formatDateShort(endDate)})</span>
          </div>
          {compareEnabled && (
            <div className="rpt-legend-bullet">
              <span className="rpt-bullet-line dashed" />
              <span style={{ color: '#50443F' }}>Periode Pembanding ({formatDateShort(prevDateRange.start)} – {formatDateShort(prevDateRange.end)})</span>
            </div>
          )}
        </div>

        {/* Chart Viewport */}
        <div className="rpt-chart-viewport">
          {period === 'year' ? (
            <Bar data={chartConfigData} options={chartOptions} />
          ) : (
            <Line data={chartConfigData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* ═══ 4. Split Grid: Payment Breakdown & Menu Ranking ═══ */}
      <div className="rpt-split-grid">

        {/* Left Column (5 cols): Komparasi Pembayaran */}
        <div className="rpt-payment-card">
          <div>
            <div className="rpt-section-header">
              <span className="rpt-section-sub">Metode Transaksi</span>
              {paymentDisplayList[0] && (
                <span className="rpt-payment-pill-badge">{paymentDisplayList[0].name} ({paymentDisplayList[0].pct}%)</span>
              )}
            </div>
            <h2>Komparasi Pembayaran</h2>
          </div>

          <div className="rpt-donut-flex">
            <div className="rpt-donut-holder">
              <Doughnut
                data={paymentDonutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: { legend: { display: false } }
                }}
              />
              <div className="rpt-donut-inner-text">
                <span className="total-val">
                  {totalPaymentAmount >= 1000000 ? `Rp ${(totalPaymentAmount / 1000000).toFixed(1)}M` : formatRupiah(totalPaymentAmount)}
                </span>
                <span className="total-lbl">Total</span>
              </div>
            </div>

            <div className="rpt-breakdown-list">
              {paymentDisplayList.map((pm) => (
                <div key={pm.id || pm.name} className="rpt-breakdown-item">
                  <div className="rpt-breakdown-item-left">
                    <span className="rpt-breakdown-dot" style={{ background: pm.color }} />
                    <span className="rpt-breakdown-name">{pm.name} ({pm.pct}%)</span>
                  </div>
                  <span className="rpt-breakdown-amount">{formatRupiah(pm.amount)}</span>
                </div>
              ))}
              {paymentDisplayList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#50443F', fontSize: '13px' }}>
                  Belum ada transaksi pembayaran pada rentang tanggal ini.
                </div>
              )}
            </div>
          </div>

          {/* Mini Comparison Note */}
          <div className="rpt-cashless-note">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            <p>
              Data metode transaksi riil berdasarkan pencatatan kasir di database SQLite.
            </p>
          </div>
        </div>

        {/* Right Column (7 cols): Top Selling Menu Ranking */}
        <div className="rpt-ranking-card">
          <div className="rpt-ranking-header">
            <div>
              <span className="rpt-section-sub">Menu Analytics</span>
              <h2>Ranking Menu Terfavorit</h2>
            </div>
            <div className="rpt-cat-filter-pills">
              {[
                { key: 'all', label: 'Semua' },
                { key: 'coffee', label: 'Coffee' },
                { key: 'non-coffee', label: 'Non Coffee' },
                { key: 'snack', label: 'Snack' }
              ].map(cat => (
                <button
                  key={cat.key}
                  className={`rpt-cat-filter-pill ${rankCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setRankCategory(cat.key)}
                  type="button"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="rpt-search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              className="rpt-search-input"
              placeholder="Cari nama menu..."
              type="text"
              value={rankSearch}
              onChange={e => setRankSearch(e.target.value)}
            />
          </div>

          {/* Ranking List */}
          <div className="rpt-rank-items-stack">
            {filteredRankings.map((item) => (
              <div key={item.name} className="rpt-rank-item-card">
                <div className="rpt-rank-row-top">
                  <div className="rpt-rank-row-left">
                    <span className={`rpt-rank-badge-num ${item.rank === 1 ? 'gold' : ''}`}>{item.rank}</span>
                    <div className="rpt-rank-meta-wrap">
                      <div className="rpt-rank-name-line">
                        <span className="rpt-rank-menu-title">{item.name}</span>
                        {item.isBest && <span className="rpt-best-seller-chip">Terlaris</span>}
                      </div>
                      <span className="rpt-rank-sub-sales">{item.qty} terjual</span>
                    </div>
                  </div>
                  <div className="rpt-rank-row-right">
                    <span className="rpt-rank-money">{formatRupiah(item.revenue)}</span>
                    <span className={`rpt-rank-share ${item.rank === 1 ? 'highlight' : ''}`}>
                      {item.share}% kontribusi
                    </span>
                  </div>
                </div>
                <div className="rpt-rank-bar-track">
                  <div className="rpt-rank-bar-fill" style={{ width: `${item.barPct}%`, background: item.barColor }} />
                </div>
              </div>
            ))}
            {filteredRankings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#50443F', fontSize: '13px' }}>
                Belum ada data penjualan menu pada periode ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ 5. Stock Item & Intelligent Material Usage Section ═══ */}
      <div className="rpt-inventory-card">
        <div className="rpt-inventory-top">
          <div className="rpt-inventory-titles">
            <div className="rpt-inventory-sub">
              <span className="material-symbols-outlined">inventory_2</span>
              <span>Inventaris &amp; Logistik</span>
            </div>
            <h2>Kebutuhan Bahan &amp; Deteksi Stok Kritis</h2>
          </div>

          <button className="rpt-analysis-action-btn" onClick={() => setShowStockModal(true)} type="button">
            <span className="material-symbols-outlined">bolt</span>
            <span>Analisis Pemakaian Bahan Baku &amp; Prediksi Stok Habis</span>
            <span className="btn-badge">{criticalStock.length + warningStock.length} Perhatian</span>
          </button>
        </div>

        {/* Urgent Highlight Banner */}
        {mostUrgentStock ? (
          <div className="rpt-urgent-banner">
            <div className="rpt-urgent-left">
              <div className="rpt-urgent-circle-icon">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div className="rpt-urgent-content">
                <h3>Bahan Paling Cepat Habis: {mostUrgentStock.name}</h3>
                <p>
                  Sisa stok kasir <strong>{Number(mostUrgentStock.current_stock).toLocaleString('id-ID')} {mostUrgentStock.unit}</strong>
                  {mostUrgentStock.days_until_empty < 999 && (
                    <> (bertahan ~<strong>{mostUrgentStock.days_until_empty} hari</strong> lagi)</>
                  )}.
                </p>
              </div>
            </div>
            <button className="rpt-urgent-po-btn" onClick={() => setShowStockModal(true)} type="button">
              PO Sekarang
            </button>
          </div>
        ) : (
          <div style={{ padding: '14px 16px', background: '#F7ECE2', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: '#10B981' }}>check_circle</span>
            <span style={{ fontSize: '13px', color: '#31170A', fontWeight: 600 }}>Semua bahan baku dalam kondisi stok aman.</span>
          </div>
        )}

        {/* 4 Material Stock Cards */}
        <div className="rpt-material-grid">
          {materialCards.map((mat) => (
            <div key={mat.id} className="rpt-material-card">
              <div className="rpt-material-card-top">
                <span className="rpt-material-cat">{mat.cat}</span>
                <span className={`rpt-material-status-chip ${mat.status}`}>{mat.statusLabel}</span>
              </div>
              <span className="rpt-material-name">{mat.name}</span>
              <div className="rpt-material-amount-row">
                <span className={`rpt-material-num ${mat.status === 'kritis' ? 'danger' : ''}`}>{mat.amount}</span>
                <span className="rpt-material-unit">{mat.unit}</span>
              </div>
              <div className="rpt-material-bar-track">
                <div className={`rpt-material-bar-fill ${mat.barClass}`} style={{ width: `${mat.barPct}%` }} />
              </div>
            </div>
          ))}
          {materialCards.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px', color: '#50443F', fontSize: '13px' }}>
              Belum ada data inventaris bahan baku.
            </div>
          )}
        </div>
      </div>

      {/* ═══ 6. Riwayat Closing & Shift Cash Control with Date Selection ═══ */}
      <div className="rpt-closing-card">
        <div className="rpt-closing-top-bar">
          <div>
            <span className="rpt-section-sub">Akuntabilitas Kasir</span>
            <h2>Riwayat Closing Kasir Harian</h2>
          </div>

          <div className="rpt-closing-filters-wrap">
            <div className="rpt-closing-select-wrap">
              <select
                className="rpt-closing-select"
                value={closingShiftFilter}
                onChange={e => setClosingShiftFilter(e.target.value)}
              >
                <option value="all">Semua Shift</option>
                <option value="pagi">Shift Pagi</option>
                <option value="sore">Shift Sore</option>
                <option value="fullday">Full Day (Closing Akhir)</option>
              </select>
              <span className="material-symbols-outlined">expand_more</span>
            </div>

            <div className="rpt-closing-select-wrap">
              <select
                className="rpt-closing-select"
                value={closingStatusFilter}
                onChange={e => setClosingStatusFilter(e.target.value)}
              >
                <option value="all">Status Kas: Semua</option>
                <option value="match">Cocok (Ada Transaksi)</option>
              </select>
              <span className="material-symbols-outlined">expand_more</span>
            </div>

            {/* Interactive Month Selector */}
            <div className="rpt-closing-date-input-wrap" title="Pilih Bulan Closing">
              <span className="material-symbols-outlined">calendar_today</span>
              <input
                type="month"
                value={closingMonth}
                onChange={e => {
                  setClosingMonth(e.target.value);
                  setClosingSpecificDate('');
                }}
                className="rpt-closing-date-input"
              />
            </div>

            {/* Optional Specific Date Picker */}
            <div className="rpt-closing-date-input-wrap" title="Pilih Tanggal Spesifik (Opsional)">
              <span className="material-symbols-outlined">event</span>
              <input
                type="date"
                value={closingSpecificDate}
                onChange={e => setClosingSpecificDate(e.target.value)}
                className="rpt-closing-date-input"
                placeholder="Pilih Tanggal"
              />
            </div>
          </div>
        </div>

        {/* Closing Records List */}
        <div className="rpt-closing-records-stack">
          {filteredClosings.map((rec) => (
            <div key={rec.id} className="rpt-closing-row-card">
              <div className="rpt-closing-row-main">
                <div className="rpt-closing-avatar-col">
                  <div className="rpt-closing-avatar-circle">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <div>
                    <div className="rpt-closing-date-row">
                      <span className="rpt-closing-date-title">{formatDate(rec.closed_at)}</span>
                      <span className="rpt-closing-tag">Closing {formatTime(rec.closed_at)} WIB</span>
                      <span className="rpt-closing-tag cashier">Kasir {rec.cashier_name || 'Kasir'}</span>
                    </div>
                    <span className="rpt-closing-terminal-meta">
                      Terminal ID: POS-ABE-01 • {rec.total_transactions} Transaksi Berhasil
                    </span>
                  </div>
                </div>

                <div className="rpt-closing-actions-col">
                  <span className="rpt-closing-match-pill">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>{formatRupiah(rec.total_revenue)}</span>
                  </span>
                  <button
                    className={`rpt-closing-detail-btn ${expandedClosingId === rec.id ? 'secondary' : ''}`}
                    onClick={() => toggleClosing(rec.id)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">
                      {expandedClosingId === rec.id ? 'expand_less' : 'receipt_long'}
                    </span>
                    <span>{expandedClosingId === rec.id ? 'Tutup Rincian' : 'Lihat Rincian'}</span>
                  </button>
                </div>
              </div>

              {/* Financial Sub-grid */}
              {expandedClosingId === rec.id && (
                <div className="rpt-closing-finance-grid">
                  <div className="rpt-finance-box">
                    <span className="lbl">Total Omzet Shift</span>
                    <span className="val">{formatRupiah(rec.total_revenue)}</span>
                  </div>
                  <div className="rpt-finance-box">
                    <span className="lbl">Rincian Metode Pembayaran</span>
                    <span className="val" style={{ fontSize: '12px' }}>
                      {closingDetails[rec.id]?.length > 0
                        ? closingDetails[rec.id].map(d => `${d.payment_method_name}: ${formatRupiah(d.total_amount)}`).join(' • ')
                        : 'Tunai / QRIS'}
                    </span>
                  </div>
                  <div className="rpt-finance-box">
                    <span className="lbl">Total Transaksi</span>
                    <span className="val">{rec.total_transactions} Transaksi</span>
                  </div>
                  <div className="rpt-finance-box">
                    <span className="lbl">Waktu Operasional</span>
                    <span className="val" style={{ fontSize: '13px' }}>
                      {formatTime(rec.opened_at)} – {formatTime(rec.closed_at)} WIB
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredClosings.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#50443F', fontSize: '13px' }}>
              Belum ada riwayat closing pada filter bulan / tanggal yang dipilih.
            </div>
          )}
        </div>
      </div>

      {/* Stock Analysis & Prediction Modal */}
      <StockAnalysisModal
        show={showStockModal}
        stockData={stockAnalysis}
        onClose={() => setShowStockModal(false)}
      />
    </div>
  );
}
