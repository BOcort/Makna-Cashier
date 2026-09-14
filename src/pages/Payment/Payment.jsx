// Payment Methods & Cashier Channels Dashboard
// 100% Visual Consistency with Report Page, Real Database Queries & Materials 3 Design
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from '../../contexts/LocationContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { paymentQueries, transactionQueries } from '../../services/queries.js';
import { formatRupiah, formatDate, formatTime, getTodayISO, getFirstDayOfMonth, getDateDaysAgo } from '../../utils/format.js';

const CHANNEL_COLORS = {
  cash: '#059669',
  digital: '#2563EB',
  qris: '#2563EB',
  transfer: '#9333EA',
  edc: '#C2410C',
  debit: '#C2410C',
  other: '#4A2C1D'
};

export default function Payment() {
  const toast = useToast();
  const { activeLocation } = useLocation();

  // Date filters
  const today = getTodayISO();
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(today);

  // Real Database state
  const [methods, setMethods] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    avgPerTrx: 0,
    breakdown: [],
    dominantMethod: null,
    activeChannelsCount: 0,
    totalChannelsCount: 0
  });
  const [settlementLogs, setSettlementLogs] = useState([]);
  const [prevSummary, setPrevSummary] = useState({ total_transactions: 0, total_revenue: 0 });

  // Inline add state
  const [inlineName, setInlineName] = useState('');
  const [inlineType, setInlineType] = useState('digital');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    type: 'digital',
    badge: '',
    description: '',
    cash_limit: 2000000,
    mdr_rate: '0%',
    account_number: '',
    terminal_id: ''
  });

  // Specialized modals
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configMethod, setConfigMethod] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrMethod, setQrMethod] = useState(null);

  // Period Preset Selector
  const handleSelectPreset = (pKey) => {
    setPeriod(pKey);
    const end = getTodayISO();
    let start = getDateDaysAgo(30);
    if (pKey === 'all') start = '2024-01-01';
    else if (pKey === 'month') start = getFirstDayOfMonth();
    else if (pKey === 'year') start = `${new Date().getFullYear()}-01-01`;
    setStartDate(start);
    setEndDate(end);
  };

  // Calculate previous date range for YoY / PoP growth
  const prevDateRange = useMemo(() => {
    const s = new Date(startDate || today);
    const e = new Date(endDate || today);
    const diff = Math.max(1, e.getTime() - s.getTime());
    const prevEnd = new Date(s.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - diff);
    const fmt = d => d.toISOString().slice(0, 10);
    return { start: fmt(prevStart), end: fmt(prevEnd) };
  }, [startDate, endDate, today]);

  // Load real data from SQLite
  const loadData = useCallback(() => {
    const locId = activeLocation?.id || 1;
    const start = startDate || getFirstDayOfMonth();
    const end = endDate || today;

    // 1. Payment Methods
    const allMethods = paymentQueries.getAll();
    setMethods(allMethods);

    // 2. Payment Analytics & Breakdown
    const stats = paymentQueries.getPaymentAnalytics(locId, start, end);
    setAnalytics(stats);

    // 3. Previous period summary for growth
    const prev = transactionQueries.getSummaryForRange(locId, prevDateRange.start, prevDateRange.end);
    setPrevSummary(prev || { total_transactions: 0, total_revenue: 0 });

    // 4. Settlement logs from real closing records
    const logs = paymentQueries.getSettlementLogs(locId, 20);
    setSettlementLogs(logs);
  }, [activeLocation, startDate, endDate, today, prevDateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // YoY Growth
  const trxGrowthPercent = useMemo(() => {
    if (prevSummary.total_transactions > 0) {
      const diff = ((analytics.totalTransactions - prevSummary.total_transactions) / prevSummary.total_transactions) * 100;
      return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
    }
    return analytics.totalTransactions > 0 ? '+100%' : '0%';
  }, [analytics.totalTransactions, prevSummary.total_transactions]);

  // Handle Toggle Active
  const handleToggle = (method) => {
    paymentQueries.toggleActive(method.id, !method.is_active);
    loadData();
    toast.success(`Saluran ${method.name} ${!method.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
  };

  // Handle Delete
  const handleDelete = (method) => {
    if (['Cash', 'QRIS'].includes(method.name)) {
      toast.warning(`Saluran standar "${method.name}" tidak dapat dihapus, hanya dapat dinonaktifkan.`);
      return;
    }
    if (!confirm(`Hapus saluran pembayaran "${method.name}"?`)) return;
    paymentQueries.delete(method.id);
    loadData();
    toast.success(`Saluran "${method.name}" berhasil dihapus`);
  };

  // Handle Inline Add
  const handleInlineAdd = () => {
    if (!inlineName.trim()) {
      toast.warning('Masukkan nama saluran baru');
      return;
    }
    try {
      let badge = '';
      let desc = '';
      if (inlineType === 'cash') {
        badge = 'Utama';
        desc = 'Batas laci: Rp 2.000.000 • Tanpa MDR';
      } else if (inlineType === 'digital' || inlineType === 'qris') {
        badge = 'Auto Settlement';
        desc = 'MDR: 0% (Usaha Mikro) • Bank Indonesia';
      } else if (inlineType === 'transfer') {
        badge = 'Bank Transfer';
        desc = 'Notifikasi instan via webhook kasir';
      } else if (inlineType === 'edc' || inlineType === 'debit') {
        badge = 'Mesin EDC';
        desc = 'MDR: 0.15% • Terminal Kasir';
      } else {
        badge = 'Saluran Kasir';
        desc = 'Metode pembayaran terdaftar';
      }

      paymentQueries.create(inlineName.trim(), inlineType, {
        badge,
        description: desc
      });
      setInlineName('');
      setInlineType('digital');
      loadData();
      toast.success(`Saluran "${inlineName.trim()}" berhasil ditambahkan`);
    } catch {
      toast.error('Nama saluran pembayaran sudah ada');
    }
  };

  // Open Edit Modal
  const openEdit = (method) => {
    setEditingMethod(method);
    setFormState({
      name: method.name || '',
      type: method.type || 'digital',
      badge: method.badge || '',
      description: method.description || '',
      cash_limit: method.cash_limit || 2000000,
      mdr_rate: method.mdr_rate || '0%',
      account_number: method.account_number || '',
      terminal_id: method.terminal_id || ''
    });
    setShowEditModal(true);
  };

  // Open Config Modal
  const openConfig = (method) => {
    setConfigMethod(method);
    setFormState({
      name: method.name || '',
      type: method.type || 'digital',
      badge: method.badge || '',
      description: method.description || '',
      cash_limit: method.cash_limit || 2000000,
      mdr_rate: method.mdr_rate || '0%',
      account_number: method.account_number || '',
      terminal_id: method.terminal_id || ''
    });
    setShowConfigModal(true);
  };

  // Open QR Standee Print Modal
  const openQRModal = (method) => {
    setQrMethod(method);
    setShowQRModal(true);
  };

  // Save Edit
  const handleSaveEdit = () => {
    if (!formState.name.trim()) {
      toast.warning('Nama saluran wajib diisi');
      return;
    }
    if (editingMethod) {
      paymentQueries.update(editingMethod.id, formState.name.trim(), formState.type, formState);
      setShowEditModal(false);
      loadData();
      toast.success('Informasi saluran pembayaran berhasil disimpan');
    } else {
      paymentQueries.create(formState.name.trim(), formState.type, formState);
      setShowAddModal(false);
      loadData();
      toast.success('Saluran pembayaran baru berhasil dibuat');
    }
  };

  // Save Config
  const handleSaveConfig = () => {
    if (!configMethod) return;
    let newDesc = configMethod.description;
    if (configMethod.type === 'cash') {
      newDesc = `Batas laci: ${formatRupiah(formState.cash_limit || 2000000)} • Tanpa MDR`;
    } else if (configMethod.type === 'transfer') {
      newDesc = `Rekening: ${formState.account_number || 'BCA 1290884910'} • Notifikasi instan`;
    } else if (configMethod.type === 'edc' || configMethod.type === 'debit') {
      newDesc = `MDR: ${formState.mdr_rate || '0.15%'} • Terminal: ${formState.terminal_id || 'EDC-ABP-088'}`;
    }

    paymentQueries.update(configMethod.id, configMethod.name, configMethod.type, {
      ...formState,
      description: newDesc
    });
    setShowConfigModal(false);
    loadData();
    toast.success('Konfigurasi parameter saluran diperbarui');
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    const header = 'Saluran Pembayaran,Tipe,Status,Total Transaksi,Total Omzet,Keterangan\n';
    const rows = methods.map(m => {
      const match = analytics.breakdown.find(b => b.payment_method_id === m.id || b.payment_method_name === m.name);
      return `"${m.name}","${m.type}","${m.is_active ? 'Aktif' : 'Nonaktif'}",${match?.transaction_count || 0},${match?.total_amount || 0},"${m.description || ''}"`;
    }).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Metode_Pembayaran_Makna_${startDate}_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Laporan saluran pembayaran berhasil diunduh');
  };

  const locName = activeLocation?.name || 'Abepura';

  // Donut SVG Calculation
  const donutData = useMemo(() => {
    const list = analytics.breakdown.length > 0
      ? analytics.breakdown
      : methods.map(m => ({ payment_method_name: m.name, pct: 0, total_amount: 0, transaction_count: 0 }));

    let offset = 0;
    const slices = list.map((item, idx) => {
      const p = item.pct || 0;
      const color = CHANNEL_COLORS[(item.payment_method_name || '').toLowerCase()] || Object.values(CHANNEL_COLORS)[idx % 5];
      const slice = {
        ...item,
        color,
        dashArray: `${p} ${100 - p}`,
        dashOffset: -offset
      };
      offset += p;
      return slice;
    });

    return slices;
  }, [analytics.breakdown, methods]);

  return (
    <div className="pay-page-wrapper">

      {/* ═══ 1. Top Bar Header & Controls ═══ */}
      <div className="pay-toolbar">
        <div className="pay-toolbar-top">
          <div className="pay-context">
            <div className="pay-context-sub">
              <span className="material-symbols-outlined">tune</span>
              <span>KONFIGURASI SISTEM &amp; KEUANGAN • </span>
              <span className="pay-outlet-tag">OUTLET {locName.toUpperCase()}</span>
            </div>
            <h1>Metode Pembayaran &amp; Saluran Kasir</h1>
          </div>

          <div className="pay-filters">
            {/* Quick Period Pills */}
            <div className="pay-period-pills">
              {[
                { key: 'all', label: 'Semua' },
                { key: 'month', label: 'Bulan Ini' },
                { key: 'year', label: 'Tahun Ini' }
              ].map(p => (
                <button
                  key={p.key}
                  className={`pay-period-pill ${period === p.key ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(p.key)}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Date Range Native Input Group */}
            <div className="pay-date-range-group">
              <span className="material-symbols-outlined date-icon">calendar_month</span>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setPeriod('custom'); }}
                className="pay-date-input"
                title="Tanggal Mulai"
              />
              <span className="date-sep">–</span>
              <input
                type="date"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setPeriod('custom'); }}
                className="pay-date-input"
                title="Tanggal Akhir"
              />
            </div>

            {/* Export CSV Button */}
            <button className="pay-export-button" onClick={handleExportCSV} type="button">
              <span className="material-symbols-outlined">file_download</span>
              <span>Ekspor Data</span>
            </button>

            {/* Add Channel Modal Trigger */}
            <button
              className="pay-add-btn-main"
              onClick={() => {
                setEditingMethod(null);
                setFormState({
                  name: '',
                  type: 'digital',
                  badge: 'Auto Settlement',
                  description: '',
                  cash_limit: 2000000,
                  mdr_rate: '0%',
                  account_number: '',
                  terminal_id: ''
                });
                setShowAddModal(true);
              }}
              type="button"
            >
              <span className="material-symbols-outlined">add</span>
              <span>Tambah Metode</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 2. KPI Summary Grid (4 Cards - Exact Stitch Design) ═══ */}
      <div className="pay-kpi-grid">
        {/* Card 1: Total Transaksi Kasir */}
        <div className="pay-kpi-card">
          <div className="pay-kpi-header">
            <div>
              <div className="pay-kpi-title">Total Transaksi Kasir</div>
              <div className="pay-kpi-num">
                {analytics.totalTransactions.toLocaleString('id-ID')}
                <span className="unit">Trx</span>
              </div>
            </div>
            <div className="pay-kpi-icon-box espresso">
              <span className="material-symbols-outlined">point_of_sale</span>
            </div>
          </div>
          <div className="pay-kpi-bottom">
            <span className={`pay-trend-chip ${trxGrowthPercent.startsWith('-') ? 'negative' : ''}`}>
              <span className="material-symbols-outlined">
                {trxGrowthPercent.startsWith('-') ? 'trending_down' : 'trending_up'}
              </span>
              {trxGrowthPercent} vs lalu
            </span>
            <span>{analytics.totalTransactions > 0 ? 'Terekam di sistem' : 'Belum ada transaksi'}</span>
          </div>
        </div>

        {/* Card 2: Volume Omzet Terproses */}
        <div className="pay-kpi-card">
          <div className="pay-kpi-header">
            <div>
              <div className="pay-kpi-title">Volume Omzet Terproses</div>
              <div className="pay-kpi-num">{formatRupiah(analytics.totalRevenue)}</div>
            </div>
            <div className="pay-kpi-icon-box emerald">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div className="pay-kpi-bottom">
            <span>Rata-rata {formatRupiah(analytics.avgPerTrx)}/trx</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>100% Kliring</span>
          </div>
        </div>

        {/* Card 3: Metode Terpopuler */}
        <div className="pay-kpi-card">
          <div className="pay-kpi-header">
            <div>
              <div className="pay-kpi-title">Metode Terpopuler</div>
              <div className="pay-kpi-num" style={{ fontSize: '20px' }}>
                {analytics.dominantMethod?.payment_method_name || 'QRIS'}
                <span className="unit" style={{ color: '#2563EB', fontWeight: 800 }}>
                  ({analytics.dominantMethod?.pct || 0}%)
                </span>
              </div>
            </div>
            <div className="pay-kpi-icon-box blue">
              <span className="material-symbols-outlined">qr_code_2</span>
            </div>
          </div>
          <div className="pay-kpi-bottom">
            <span>{analytics.dominantMethod?.transaction_count || 0} transaksi</span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '11px', fontWeight: 800 }}>
              Dominan
            </span>
          </div>
        </div>

        {/* Card 4: Status Saluran Kasir */}
        <div className="pay-kpi-card">
          <div className="pay-kpi-header">
            <div>
              <div className="pay-kpi-title">Status Saluran Kasir</div>
              <div className="pay-kpi-num">
                {analytics.activeChannelsCount}
                <span className="unit">Saluran</span>
              </div>
            </div>
            <div className="pay-kpi-icon-box amber">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <div className="pay-kpi-bottom">
            <span className="pay-status-ready">
              <span className="pay-pulse-dot" />
              100% Siap Operasional
            </span>
            <span>{analytics.totalChannelsCount} Terdaftar</span>
          </div>
        </div>
      </div>

      {/* ═══ 3. Split Grid (7 cols Left + 5 cols Right) ═══ */}
      <div className="pay-split-grid">

        {/* Left Column (7 cols): Daftar Saluran Pembayaran Aktif */}
        <div className="pay-channels-card">
          <div className="pay-channels-header">
            <div className="pay-channels-header-left">
              <div className="pay-channels-icon-wrap">
                <span className="material-symbols-outlined">wallet</span>
              </div>
              <div className="pay-channels-header-titles">
                <h2>Daftar Saluran Pembayaran Aktif</h2>
                <p>Metode aktif langsung tampil di layar mesin kasir</p>
              </div>
            </div>
            <span className="pay-channels-active-badge">
              <span className="pay-pulse-dot" />
              {analytics.activeChannelsCount} Saluran Aktif
            </span>
          </div>

          <div className="pay-channels-list">
            {methods.map((method) => {
              const typeClass = (method.type || 'other').toLowerCase();
              return (
                <article key={method.id} className={`pay-channel-item ${!method.is_active ? 'inactive' : ''}`}>
                  <div className="pay-channel-item-left">
                    <div className={`pay-channel-icon-box ${typeClass}`}>
                      <span className="material-symbols-outlined">
                        {typeClass === 'cash' ? 'local_atm' :
                         typeClass === 'digital' || typeClass === 'qris' ? 'qr_code_2' :
                         typeClass === 'transfer' ? 'account_balance' :
                         typeClass === 'edc' || typeClass === 'debit' ? 'credit_card' : 'payments'}
                      </span>
                    </div>

                    <div className="pay-channel-info">
                      <div className="pay-channel-name-row">
                        <span className="pay-channel-name">{method.name}</span>
                        {method.badge && (
                          <span className={`pay-channel-badge ${typeClass}`}>
                            {method.badge}
                          </span>
                        )}
                        {!method.is_active && (
                          <span className="pay-channel-badge inactive">Nonaktif</span>
                        )}
                      </div>
                      <span className="pay-channel-desc">
                        {method.description}
                      </span>
                    </div>
                  </div>

                  <div className="pay-channel-actions">
                    {/* Action 1: Specialized Config Button */}
                    {typeClass === 'cash' && (
                      <button
                        className="pay-action-btn"
                        onClick={() => openConfig(method)}
                        title="Konfigurasi Batas Laci Kasir"
                        type="button"
                      >
                        <span className="material-symbols-outlined">settings</span>
                      </button>
                    )}

                    {(typeClass === 'digital' || typeClass === 'qris') && (
                      <button
                        className="pay-action-btn"
                        onClick={() => openQRModal(method)}
                        title="Cetak QR Standee Kasir"
                        type="button"
                      >
                        <span className="material-symbols-outlined">print</span>
                      </button>
                    )}

                    {typeClass === 'transfer' && (
                      <button
                        className="pay-action-btn"
                        onClick={() => openConfig(method)}
                        title="Atur Rekening VA"
                        type="button"
                      >
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                      </button>
                    )}

                    {(typeClass === 'edc' || typeClass === 'debit') && (
                      <button
                        className="pay-action-btn"
                        onClick={() => openConfig(method)}
                        title="Atur Mesin & Terminal ID"
                        type="button"
                      >
                        <span className="material-symbols-outlined">pin</span>
                      </button>
                    )}

                    {/* Action 2: Edit Modal */}
                    <button
                      className="pay-action-btn"
                      onClick={() => openEdit(method)}
                      title="Edit Saluran"
                      type="button"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>

                    {/* Action 3: Active Status Toggle Switch */}
                    <button
                      className={`pay-toggle-btn ${method.is_active ? 'active' : 'inactive'}`}
                      onClick={() => handleToggle(method)}
                      title={method.is_active ? 'Klik untuk menonaktifkan' : 'Klik untuk mengaktifkan'}
                      type="button"
                    >
                      <span className="pay-toggle-indicator" />
                    </button>

                    {/* Action 4: Delete for custom methods */}
                    {!['Cash', 'QRIS'].includes(method.name) && (
                      <button
                        className="pay-action-btn"
                        onClick={() => handleDelete(method)}
                        title="Hapus Saluran"
                        type="button"
                        style={{ color: '#BA1A1A' }}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Inline Add Form */}
          <div className="pay-inline-add-box">
            <form
              className="pay-inline-form"
              onSubmit={(e) => { e.preventDefault(); handleInlineAdd(); }}
            >
              <input
                className="pay-inline-input"
                placeholder="Nama saluran baru (mis. ShopeePay, EDC BCA 02, OVO)..."
                type="text"
                value={inlineName}
                onChange={e => setInlineName(e.target.value)}
              />
              <select
                className="pay-inline-select"
                value={inlineType}
                onChange={e => setInlineType(e.target.value)}
              >
                <option value="digital">Digital / E-Wallet / QRIS</option>
                <option value="cash">Tunai / Cash</option>
                <option value="debit">Debit / Mesin EDC</option>
                <option value="transfer">Transfer Bank / VA</option>
                <option value="other">Lainnya</option>
              </select>
              <button className="pay-inline-submit-btn" type="submit">
                <span className="material-symbols-outlined">add</span>
                <span>Tambah Saluran</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (5 cols): Donut Chart & Komparasi Saluran */}
        <div className="pay-analytics-card">
          <div className="pay-analytics-header">
            <div>
              <h3>Komparasi Penggunaan Saluran</h3>
              <p>Distribusi metode transaksi kasir periode ini</p>
            </div>
            <span className="pay-analytics-total-badge">
              Total {analytics.totalTransactions} Trx
            </span>
          </div>

          <div className="pay-donut-flex">
            {/* SVG Donut Chart with center label */}
            <div className="pay-donut-holder">
              <svg className="w-full h-full" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#FDF2E7"
                  strokeWidth="4"
                />
                {donutData.map((slice, idx) => (
                  <path
                    key={slice.payment_method_name || idx}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={slice.color}
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    strokeLinecap="round"
                    strokeWidth="4.2"
                  />
                ))}
              </svg>

              <div className="pay-donut-inner-text">
                <span className="dominant-lbl">Dominan</span>
                <span className="dominant-pct">
                  {analytics.dominantMethod?.pct || 0}%
                </span>
                <span className="dominant-name">
                  {analytics.dominantMethod?.payment_method_name || 'QRIS'}
                </span>
              </div>
            </div>

            {/* Stack of Channels Progress Bars */}
            <div className="pay-bars-stack">
              {donutData.map((channel) => (
                <div key={channel.payment_method_name} className="pay-bar-item">
                  <div className="pay-bar-meta-row">
                    <span className="pay-bar-name-wrap">
                      <span className="pay-bar-dot" style={{ background: channel.color }} />
                      {channel.payment_method_name}
                    </span>
                    <span className="pay-bar-stats">
                      {channel.pct}% <span className="trx-count">({channel.transaction_count} trx)</span>
                    </span>
                  </div>
                  <div className="pay-bar-track">
                    <div
                      className="pay-bar-fill"
                      style={{ width: `${channel.pct}%`, background: channel.color }}
                    />
                  </div>
                  <div className="pay-bar-bottom-note">
                    <span>{formatRupiah(channel.total_amount)}</span>
                    <span>
                      {(channel.payment_method_name || '').toLowerCase().includes('qris')
                        ? 'Terverifikasi otomatis'
                        : (channel.payment_method_name || '').toLowerCase().includes('cash')
                        ? 'Fisik di kasir'
                        : (channel.payment_method_name || '').toLowerCase().includes('edc')
                        ? 'Mesin EDC 01'
                        : 'Transfer Bank'}
                    </span>
                  </div>
                </div>
              ))}
              {donutData.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#8C786A', fontSize: '12px' }}>
                  Belum ada transaksi pembayaran pada rentang tanggal ini.
                </div>
              )}
            </div>
          </div>

          {/* Cashier Operational Insight Callout */}
          <div className="pay-insight-callout">
            <span className="material-symbols-outlined">lightbulb</span>
            <p>
              <strong>Insight Kasir:</strong> Pembayaran cashless via{' '}
              <strong>{analytics.dominantMethod?.payment_method_name || 'QRIS'}</strong> mendominasi{' '}
              <strong>{analytics.dominantMethod?.pct || 0}%</strong> transaksi kasir. Rekomendasi: Pastikan koneksi EDC dan cetak QR standee kasir tetap prima.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ 4. Riwayat Settlement & Rekonsiliasi Saluran ═══ */}
      <div className="pay-settlement-card">
        <div className="pay-settlement-header">
          <div className="pay-settlement-header-left">
            <div className="pay-settlement-icon-wrap">
              <span className="material-symbols-outlined">history</span>
            </div>
            <div className="pay-settlement-header-titles">
              <h3>Riwayat Settlement &amp; Rekonsiliasi Saluran</h3>
              <p>Sinkronisasi otomatis harian dengan rekening bank penampung &amp; brankas kasir</p>
            </div>
          </div>
          <button
            className="pay-settlement-link-btn"
            onClick={() => {
              if (settlementLogs.length > 0) {
                toast.info(`Terdapat ${settlementLogs.length} pencatatan rekonsiliasi dan settlement terkini.`);
              } else {
                toast.info('Belum ada data rekonsiliasi settlement baru.');
              }
            }}
            type="button"
          >
            <span>Lihat Semua Log</span>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
          </button>
        </div>

        <div className="pay-settlement-list">
          {settlementLogs.map((log) => (
            <div key={log.id} className="pay-settlement-item">
              <div className="pay-settlement-item-left">
                <div className={`pay-settlement-avatar ${log.type}`}>
                  <span className="material-symbols-outlined">
                    {log.type === 'qris' ? 'qr_code_2' : log.type === 'cash' ? 'point_of_sale' : 'credit_card'}
                  </span>
                </div>
                <div className="pay-settlement-meta">
                  <div className="pay-settlement-title-row">
                    <span className="pay-settlement-title">{log.title}</span>
                    <span className={`pay-settlement-badge ${log.badgeClass}`}>{log.badge}</span>
                  </div>
                  <span className="pay-settlement-sub">
                    {formatDate(log.date)} • {formatTime(log.date)} WIT • {log.subtitle}
                  </span>
                </div>
              </div>

              <div className="pay-settlement-item-right">
                <span className="pay-settlement-amount">{formatRupiah(log.amount)}</span>
                <span className="pay-settlement-note">{log.note}</span>
              </div>
            </div>
          ))}

          {settlementLogs.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#8C786A', fontSize: '13px' }}>
              Belum ada riwayat settlement atau rekonsiliasi kasir yang tercatat pada sistem.
            </div>
          )}
        </div>
      </div>

      {/* ═══ 5. Edit / Add Channel Modal ═══ */}
      {(showAddModal || showEditModal) && (
        <div
          className="pay-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setShowEditModal(false); } }}
        >
          <div className="pay-modal-card" role="dialog" aria-modal="true">
            <div className="pay-modal-header">
              <h2>{editingMethod ? `Edit Saluran: ${editingMethod.name}` : 'Tambah Saluran Pembayaran Baru'}</h2>
              <button
                className="pay-modal-close-btn"
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="pay-modal-body">
              <div className="pay-form-group">
                <label className="pay-form-label">Nama Saluran Pembayaran</label>
                <input
                  className="pay-form-input"
                  placeholder="Contoh: QRIS Makna, GoPay, BCA EDC, dll."
                  type="text"
                  value={formState.name}
                  onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="pay-form-group">
                <label className="pay-form-label">Tipe Saluran</label>
                <select
                  className="pay-form-select"
                  value={formState.type}
                  onChange={e => setFormState(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="digital">Digital / E-Wallet / QRIS</option>
                  <option value="cash">Tunai / Cash</option>
                  <option value="debit">Kartu Debit / Mesin EDC</option>
                  <option value="transfer">Transfer Bank / Virtual Account</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div className="pay-form-group">
                <label className="pay-form-label">Badge Label (Opsional)</label>
                <input
                  className="pay-form-input"
                  placeholder="Contoh: Utama, Auto Settlement, BCA & Mandiri, dll."
                  type="text"
                  value={formState.badge}
                  onChange={e => setFormState(prev => ({ ...prev, badge: e.target.value }))}
                />
              </div>

              <div className="pay-form-group">
                <label className="pay-form-label">Keterangan / Parameter Saluran</label>
                <input
                  className="pay-form-input"
                  placeholder="Contoh: MDR 0% Usaha Mikro / Batas laci Rp 2.000.000"
                  type="text"
                  value={formState.description}
                  onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="pay-modal-footer">
              <button
                className="pay-btn-secondary"
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                type="button"
              >
                Batal
              </button>
              <button
                className="pay-btn-primary"
                onClick={handleSaveEdit}
                type="button"
              >
                Simpan Saluran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 6. Configuration Modal (Cash Limit / VA Bank / EDC Terminal) ═══ */}
      {showConfigModal && configMethod && (
        <div
          className="pay-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfigModal(false); }}
        >
          <div className="pay-modal-card" role="dialog" aria-modal="true">
            <div className="pay-modal-header">
              <h2>Konfigurasi Parameter: {configMethod.name}</h2>
              <button
                className="pay-modal-close-btn"
                onClick={() => setShowConfigModal(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="pay-modal-body">
              {configMethod.type === 'cash' && (
                <div className="pay-form-group">
                  <label className="pay-form-label">Batas Maksimal Kas di Laci (Cash Limit)</label>
                  <input
                    className="pay-form-input"
                    type="number"
                    value={formState.cash_limit}
                    onChange={e => setFormState(prev => ({ ...prev, cash_limit: Number(e.target.value) }))}
                  />
                  <span style={{ fontSize: '11px', color: '#8C786A', marginTop: '4px' }}>
                    Jika uang tunai di laci kasir melebihi nominal ini, kasir akan diingatkan untuk setoran ke brankas.
                  </span>
                </div>
              )}

              {configMethod.type === 'transfer' && (
                <div className="pay-form-group">
                  <label className="pay-form-label">Nomor Rekening / Akun Penampung</label>
                  <input
                    className="pay-form-input"
                    placeholder="Contoh: BCA 1290884910 a/n Makna Coffee"
                    type="text"
                    value={formState.account_number}
                    onChange={e => setFormState(prev => ({ ...prev, account_number: e.target.value }))}
                  />
                </div>
              )}

              {(configMethod.type === 'edc' || configMethod.type === 'debit') && (
                <>
                  <div className="pay-form-group">
                    <label className="pay-form-label">Tarif MDR (Merchant Discount Rate)</label>
                    <input
                      className="pay-form-input"
                      placeholder="Contoh: 0.15%"
                      type="text"
                      value={formState.mdr_rate}
                      onChange={e => setFormState(prev => ({ ...prev, mdr_rate: e.target.value }))}
                    />
                  </div>
                  <div className="pay-form-group">
                    <label className="pay-form-label">Terminal ID Mesin EDC</label>
                    <input
                      className="pay-form-input"
                      placeholder="Contoh: EDC-ABP-088"
                      type="text"
                      value={formState.terminal_id}
                      onChange={e => setFormState(prev => ({ ...prev, terminal_id: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pay-modal-footer">
              <button
                className="pay-btn-secondary"
                onClick={() => setShowConfigModal(false)}
                type="button"
              >
                Batal
              </button>
              <button
                className="pay-btn-primary"
                onClick={handleSaveConfig}
                type="button"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 7. QRIS Standee Preview Modal ═══ */}
      {showQRModal && qrMethod && (
        <div
          className="pay-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setShowQRModal(false); }}
        >
          <div className="pay-modal-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div className="pay-modal-header">
              <h2>QRIS Standee Kasir Makna Coffee</h2>
              <button className="pay-modal-close-btn" onClick={() => setShowQRModal(false)} type="button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="pay-modal-body" style={{ alignItems: 'center' }}>
              <div style={{
                background: '#FFFFFF',
                padding: '20px',
                borderRadius: '16px',
                border: '2px solid #2563EB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#2563EB', fontSize: '28px' }}>qr_code_2</span>
                  <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '16px', color: '#1E3A8A' }}>
                    QRIS • Standar Pembayaran Nasional
                  </span>
                </div>
                <div style={{
                  width: '180px',
                  height: '180px',
                  background: '#F0F4FF',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed #2563EB'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '140px', color: '#1E40AF' }}>qr_code_2</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#31170A' }}>
                  Makna Coffee — Outlet {locName}
                </div>
                <span style={{ fontSize: '11px', color: '#50443F' }}>
                  NMID: ID1020088920199 • Diterbitkan oleh Bank Indonesia
                </span>
              </div>
            </div>

            <div className="pay-modal-footer" style={{ justifyContent: 'center' }}>
              <button
                className="pay-btn-primary"
                onClick={() => {
                  window.print();
                }}
                type="button"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="material-symbols-outlined">print</span>
                <span>Cetak Standee QR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
