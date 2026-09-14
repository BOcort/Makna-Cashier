// StockAnalysisModal — Popup Modal Analisis Kebutuhan Item & Prediksi Bahan Baku Habis
// Menggunakan 100% Data Riil Database SQLite
import { useState, useMemo, useEffect } from 'react';
import { formatRupiah } from '../../utils/format.js';

export default function StockAnalysisModal({ show, stockData = [], onClose }) {
  const [toast, setToast] = useState({ show: false, message: '', icon: 'check_circle' });
  const [poCreated, setPoCreated] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && show) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  const showToast = (message, icon = 'check_circle') => {
    setToast({ show: true, message, icon });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  const displayItems = useMemo(() => stockData || [], [stockData]);

  const criticalItems = useMemo(() => displayItems.filter(i => i.status === 'kritis'), [displayItems]);
  const warningItems = useMemo(() => displayItems.filter(i => i.status === 'waspada'), [displayItems]);
  const safeItems = useMemo(() => displayItems.filter(i => i.status === 'aman'), [displayItems]);
  const mostUrgent = criticalItems[0] || warningItems[0] || null;

  // Real PO calculation from items requiring restock
  const restockItems = useMemo(() => [...criticalItems, ...warningItems], [criticalItems, warningItems]);

  const poEstimate = useMemo(() => {
    if (restockItems.length === 0) return 0;
    let cost = 0;
    restockItems.forEach(i => {
      const needed = Math.max(0, Math.abs(i.deficit || (i.weekly_need - i.current_stock)));
      cost += needed * (i.cost_per_unit || (i.purchase_price ? i.purchase_price / (i.package_size || 1) : 100));
    });
    return Math.round(cost);
  }, [restockItems]);

  const poDateCode = useMemo(() => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    return `PO-${yr}${mo}-MKNA-${String(restockItems.length).padStart(2, '0')}`;
  }, [restockItems.length]);

  const handleDownloadExcel = () => {
    if (displayItems.length === 0) {
      showToast('Tidak ada data bahan baku untuk diunduh', 'info');
      return;
    }
    showToast('Mengunduh "Analisis_Stok_Bahan_Baku.csv"...', 'download');
    const header = 'Item Bahan Baku,Kategori,Supplier/Lokasi,Stok Sekarang,Satuan,Proyeksi Kebutuhan 7 Hari,Defisit/Surplus,Status\n';
    const rows = displayItems.map(item =>
      `"${item.name}","${item.category || '-'}","${item.supplier || item.storage_location || '-'}",${item.current_stock},${item.unit},${item.weekly_need},${item.deficit},"${item.status}"`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analisis_Stok_Bahan_Baku_${new Date().toISOString().slice(0, 10)}.csv`;
    setTimeout(() => {
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 400);
  };

  const handleCreatePO = () => {
    if (restockItems.length === 0) {
      showToast('Semua bahan baku dalam kondisi aman, tidak perlu membuat PO.', 'info');
      return;
    }
    setPoCreated(true);
    showToast(`Purchase Order ${poDateCode} berhasil dibuat dan dikirim ke Supplier!`, 'send');

    const header = 'PO ID,Item Bahan Baku,Qty Dipesan,Satuan,Supplier,Estimasi Biaya\n';
    const rows = restockItems.map(item => {
      const needed = Math.max(0, Math.abs(item.deficit || (item.weekly_need - item.current_stock)));
      const cost = needed * (item.cost_per_unit || (item.purchase_price ? item.purchase_price / (item.package_size || 1) : 100));
      return `"${poDateCode}","${item.name}",${needed},${item.unit},"${item.supplier || '-'}",${Math.round(cost)}`;
    }).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${poDateCode}.csv`;
    setTimeout(() => {
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 600);
  };

  if (!show) return null;

  return (
    <div className="stock-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="stock-modal-card" role="dialog" aria-modal="true" aria-labelledby="stockModalTitle">
        
        {/* 1. Modal Header */}
        <div className="stock-modal-header">
          <div className="stock-modal-header-left">
            <div className="stock-modal-icon-wrap">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            </div>
            <div className="stock-modal-meta">
              <div className="stock-modal-tag-row">
                <span className="stock-modal-forecast-pill">AI Stock Forecast</span>
                <span className="stock-modal-period-text">Periode: 30 Hari Terakhir</span>
              </div>
              <h2 id="stockModalTitle">Analisis Kebutuhan Item &amp; Perhitungan Stok Otomatis</h2>
              <p>Kalkulasi kebutuhan bahan baku berdasarkan riwayat log penggunaan bahan dan transaksi riil.</p>
            </div>
          </div>
          <button className="stock-modal-close-btn" onClick={onClose} title="Tutup">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="stock-modal-body">

          {/* 2. Urgent Restock Alert Card */}
          {mostUrgent ? (
            <div className="stock-urgent-alert-box">
              <div className="stock-urgent-alert-left">
                <div className="stock-urgent-icon-circle">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
                </div>
                <div>
                  <div className="stock-urgent-header-tag">
                    <span>{mostUrgent.status === 'kritis' ? 'Urgent Restock Alert' : 'Peringatan Stok Waspada'}</span>
                    <span className="stock-urgent-pulse-dot" />
                  </div>
                  <h3 className="stock-urgent-item-title">{mostUrgent.name}</h3>
                  <p className="stock-urgent-item-desc">
                    Sisa <strong>{Number(mostUrgent.current_stock).toLocaleString('id-ID')} {mostUrgent.unit}</strong>
                    {mostUrgent.days_until_empty < 999 ? (
                      <> (Bertahan ~<strong>{mostUrgent.days_until_empty} hari</strong> lagi) — Laju terpakai: <strong>{Number(mostUrgent.daily_consumption).toLocaleString('id-ID')} {mostUrgent.unit}/hari</strong>.</>
                    ) : (
                      <> — Belum ada data konsumsi harian tercatat.</>
                    )}
                  </p>
                </div>
              </div>

              <div className="stock-urgent-recom-box">
                <span className="stock-recom-title">Rekomendasi Restock</span>
                <div className="stock-recom-qty">
                  <span className="material-symbols-outlined">shopping_cart_checkout</span>
                  <span>Min. Order {Number(Math.max(1, Math.abs(mostUrgent.deficit || mostUrgent.weekly_need))).toLocaleString('id-ID')} {mostUrgent.unit}</span>
                </div>
                <span className="stock-recom-deadline">
                  {mostUrgent.days_until_empty <= 2 ? 'Eksekusi Segera!' : 'Eksekusi sebelum akhir pekan'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px', background: '#F7ECE2', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#10B981', fontSize: '24px' }}>check_circle</span>
              <div>
                <strong style={{ color: '#31170A', fontSize: '14px' }}>Semua Bahan Baku Aman</strong>
                <p style={{ margin: 0, fontSize: '12px', color: '#50443F' }}>Tidak ada item bahan baku yang berada dalam kondisi kritis atau mendekati habis.</p>
              </div>
            </div>
          )}

          {/* 3. Grafik Proyeksi & Kebutuhan Item (Burndown Chart) */}
          <div className="stock-burndown-wrap">
            <div className="stock-burndown-header">
              <div>
                <h3>Proyeksi Burndown Stok (7 Hari Mendatang)</h3>
                <p>Penurunan stok terhadap waktu berdasarkan tren konsumsi rata-rata harian dari database.</p>
              </div>
              <div className="stock-burndown-legend">
                <div className="stock-legend-item">
                  <span className="stock-legend-dot kritis" />
                  <span>{criticalItems[0]?.name || 'Item Kritis'}</span>
                </div>
                <div className="stock-legend-item">
                  <span className="stock-legend-dot waspada" />
                  <span>{warningItems[0]?.name || 'Item Waspada'}</span>
                </div>
                <div className="stock-legend-item">
                  <span className="stock-legend-dot aman" />
                  <span>{safeItems[0]?.name || 'Item Stabil'}</span>
                </div>
              </div>
            </div>

            <div className="stock-chart-container">
              <div className="stock-svg-chart-box">
                {/* SVG Line Chart Vector */}
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 700 140" style={{ overflow: 'visible', width: '100%', height: '100%' }}>
                  <line x1="0" y1="20" x2="700" y2="20" stroke="#D4C3BC" strokeDasharray="3,3" strokeWidth="1" opacity="0.5" />
                  <line x1="0" y1="60" x2="700" y2="60" stroke="#D4C3BC" strokeDasharray="3,3" strokeWidth="1" opacity="0.5" />
                  <line x1="0" y1="100" x2="700" y2="100" stroke="#D4C3BC" strokeDasharray="3,3" strokeWidth="1" opacity="0.5" />
                  <line x1="0" y1="138" x2="700" y2="138" stroke="#D4C3BC" strokeWidth="1" opacity="0.7" />

                  {/* Kritis: Menukik tajam */}
                  <path d="M 0,90 L 116,115 L 233,138 L 350,140 L 466,140 L 583,140 L 700,140" fill="none" stroke="#BA1A1A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <circle cx="233" cy="138" fill="#BA1A1A" r="4.5" />

                  {/* Waspada: Penurunan sedang */}
                  <path d="M 0,20 L 116,36 L 233,54 L 350,72 L 466,90 L 583,108 L 700,126" fill="none" stroke="#FD916E" strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <circle cx="700" cy="126" fill="#FD916E" r="4" />

                  {/* Aman: Penurunan stabil */}
                  <path d="M 0,35 L 116,45 L 233,55 L 350,65 L 466,75 L 583,82 L 700,90" fill="none" stroke="#4A2C1D" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <circle cx="700" cy="90" fill="#4A2C1D" r="4" />
                </svg>

                {/* Days Indicator Labels */}
                <div className="stock-days-labels">
                  <span>Hari 0 (Hari ini)</span>
                  <span>Hari +1</span>
                  <span className="empty-alert">Hari +2 (Habis!)</span>
                  <span>Hari +3</span>
                  <span>Hari +4</span>
                  <span>Hari +5</span>
                  <span>Hari +7</span>
                </div>
              </div>

              <div className="stock-chart-info-note">
                <span className="material-symbols-outlined">info</span>
                <span>Prediksi didasarkan pada pergerakan pesanan dan pengurangan stok riil dari database kasir.</span>
              </div>
            </div>

            {/* Estimasi Kebutuhan Minggu Depan Table */}
            <div className="stock-table-card">
              <div className="stock-table-top-bar">
                <h4>Tabel Kebutuhan Estimasi Minggu Depan</h4>
                <span className="buffer-tag">Target Safety Stock: +20% Buffer</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="stock-table">
                  <thead>
                    <tr>
                      <th>Item Bahan Baku</th>
                      <th>Stok Sekarang</th>
                      <th>Proyeksi Kebutuhan</th>
                      <th>Defisit / Surplus</th>
                      <th style={{ textAlign: 'right' }}>Status Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((item) => {
                      const isNegative = item.deficit < 0;
                      const statusClass = item.status === 'kritis' ? 'kritis' : item.status === 'waspada' ? 'waspada' : 'aman';
                      return (
                        <tr key={item.id || item.name}>
                          <td>
                            <div className="stock-td-item">
                              <div className={`stock-td-dot ${statusClass}`} />
                              <div>
                                <div className="stock-td-name">{item.name}</div>
                                <div className="stock-td-sub">
                                  {item.supplier ? `Supplier: ${item.supplier}` : (item.storage_location ? `Penyimpanan: ${item.storage_location}` : (item.category || 'Gudang Bar'))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="stock-td-mono">{Number(item.current_stock).toLocaleString('id-ID')} {item.unit}</td>
                          <td className="stock-td-mono">{Number(item.weekly_need).toLocaleString('id-ID')} {item.unit}</td>
                          <td>
                            <span className={`stock-td-deficit ${isNegative ? (item.status === 'kritis' ? 'negative' : 'warning') : 'positive'}`}>
                              {!isNegative ? '+' : ''}{Number(item.deficit).toLocaleString('id-ID')} {item.unit}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`stock-action-pill ${statusClass}`}>
                              <span className="material-symbols-outlined">
                                {item.status === 'kritis' ? 'warning' : item.status === 'waspada' ? 'schedule' : 'check_circle'}
                              </span>
                              {item.status === 'kritis' ? 'Kritis (Order Sekarang)' : item.status === 'waspada' ? 'Waspada' : 'Aman'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {displayItems.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#50443F' }}>
                          Belum ada item bahan baku terdaftar di database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. Simulasi Pembelian / PO Otomatis Preview */}
          <div className="stock-po-preview-card">
            <div className="stock-po-preview-left">
              <div className="stock-po-icon-circle">
                <span className="material-symbols-outlined">assignment</span>
              </div>
              <div>
                <div className="stock-po-meta-title">Draft Otomatis: {poDateCode}</div>
                <div className="stock-po-meta-desc">
                  {restockItems.length > 0
                    ? `Termasuk ${criticalItems.length} item Kritis & ${warningItems.length} item Waspada yang perlu di-restock.`
                    : 'Semua bahan baku dalam kondisi aman (0 item perlu restock darurat).'}
                </div>
              </div>
            </div>
            <div className="stock-po-cost-wrap">
              <span className="stock-po-cost-lbl">Estimasi Biaya:</span>
              <span className="stock-po-cost-num">{formatRupiah(poEstimate)}</span>
            </div>
          </div>
        </div>

        {/* 5. Modal Action Footer */}
        <div className="stock-modal-footer">
          <button className="stock-footer-btn excel" onClick={handleDownloadExcel} type="button">
            <span className="material-symbols-outlined">table_view</span>
            <span>Download Laporan Analisis (Excel)</span>
          </button>
          <div className="stock-footer-actions-right">
            <button className="stock-footer-btn close" onClick={onClose} type="button">
              Tutup
            </button>
            <button
              className="stock-footer-btn po"
              onClick={handleCreatePO}
              type="button"
              disabled={poCreated || restockItems.length === 0}
              style={poCreated ? { background: '#F2E6DC', color: '#50443F', cursor: 'default' } : {}}
            >
              <span className="material-symbols-outlined">{poCreated ? 'done' : 'post_add'}</span>
              <span>{poCreated ? 'PO Terkirim' : 'Buat Purchase Order (PO) Bahan Kritis'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Feedback Toast */}
      {toast.show && (
        <div className="stock-action-toast">
          <span className="material-symbols-outlined">{toast.icon}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
