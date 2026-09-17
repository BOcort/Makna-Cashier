// Payment Modal — 100% Exact Visual Match to Stitch POS Kasir Popup Pembayaran
import { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '../../utils/format.js';

export default function PaymentModal({
  show,
  onClose,
  onConfirm,
  totalAmount = 0,
  paymentMethods = [],
  activeLocation,
  cart = [],
  cartTotalCount = 0,
  cashierName = 'Rian'
}) {
  const [activeTab, setActiveTab] = useState('cash'); // 'cash' | 'qris' | 'debit'
  const [paidAmount, setPaidAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [autoPrint, setAutoPrint] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState('');
  const cashInputRef = useRef(null);

  // Dynamic order / receipt reference
  const orderNumber = useMemo(() => {
    const timestamp = Date.now().toString().slice(-4);
    return `MK-${timestamp}`;
  }, [show]);

  const qrisRefCode = useMemo(() => {
    const timestamp = Date.now().toString().slice(-6);
    return `MKN-QRIS-${timestamp}`;
  }, [show]);

  // Safe active payment method lookup from DB
  const activePaymentMethod = useMemo(() => {
    const safeMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
    if (activeTab === 'cash') {
      return (
        safeMethods.find(p => p?.type === 'cash' || (p?.name && p.name.toLowerCase().includes('cash')) || (p?.name && p.name.toLowerCase().includes('tunai'))) ||
        safeMethods[0] ||
        { id: 1, name: 'Tunai / Cash', type: 'cash' }
      );
    }
    if (activeTab === 'qris') {
      return (
        safeMethods.find(p => (p?.name && p.name.toLowerCase().includes('qris')) || p?.type === 'digital') ||
        safeMethods[1] ||
        { id: 2, name: 'QRIS', type: 'digital' }
      );
    }
    if (activeTab === 'debit') {
      return (
        safeMethods.find(p => (p?.name && (p.name.toLowerCase().includes('debit') || p.name.toLowerCase().includes('transfer') || p.name.toLowerCase().includes('edc')))) ||
        safeMethods[2] ||
        { id: 3, name: 'Debit Card', type: 'transfer' }
      );
    }
    return safeMethods[0] || { id: 1, name: 'Tunai / Cash', type: 'cash' };
  }, [activeTab, paymentMethods]);

  // Parse numeric paid amount
  const paidNum = useMemo(() => {
    if (!paidAmount) return 0;
    const cleanStr = String(paidAmount).replace(/[^0-9]/g, '');
    return parseInt(cleanStr, 10) || 0;
  }, [paidAmount]);

  const safeTotal = Number(totalAmount) || 0;
  const changeAmount = paidNum - safeTotal;

  // Reset when opened
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      setActiveTab('cash');
      setPaidAmount(safeTotal > 0 ? String(safeTotal) : '');
      setReferenceId('');
      setError('');
      setTimeout(() => {
        cashInputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show, safeTotal]);

  // Smart quick cash chips (Uang Pas, 50k, 100k, 150k, 200k)
  const quickCashOptions = useMemo(() => {
    const options = [safeTotal];
    const standardPills = [50000, 70000, 100000, 150000, 200000, 300000];

    standardPills.forEach(p => {
      if (p >= safeTotal && !options.includes(p)) {
        options.push(p);
      }
    });

    if (options.length < 4 && safeTotal > 0) {
      const next50k = Math.ceil(safeTotal / 50000) * 50000;
      if (!options.includes(next50k) && next50k > safeTotal) options.push(next50k);
      const next100k = Math.ceil(safeTotal / 100000) * 100000;
      if (!options.includes(next100k) && next100k > safeTotal) options.push(next100k);
    }

    return options.slice(0, 4);
  }, [safeTotal]);

  if (!show) return null;

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('pm-backdrop')) {
      onClose();
    }
  };

  const handleCashInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setPaidAmount(val);
    setError('');
  };

  const handleConfirm = () => {
    if (activeTab === 'cash') {
      if (!paidAmount || paidNum <= 0) {
        setError('Silakan masukkan jumlah uang yang diterima.');
        return;
      }
      if (paidNum < safeTotal) {
        setError(`Uang pembayaran kurang ${formatRupiah(safeTotal - paidNum)}.`);
        return;
      }
      onConfirm({
        paidAmount: paidNum,
        changeAmount: Math.max(0, changeAmount),
        paymentMethodId: activePaymentMethod?.id || 1,
        paymentMethodName: activePaymentMethod?.name || 'Tunai / Cash',
        paymentId: orderNumber,
        autoPrint,
        sendWhatsApp,
        customerPhone: customerPhone.trim(),
        orderType: 'dine_in',
        tableNumber: '04',
        orderNumber
      });
    } else if (activeTab === 'qris') {
      onConfirm({
        paidAmount: safeTotal,
        changeAmount: 0,
        paymentMethodId: activePaymentMethod?.id || 2,
        paymentMethodName: 'QRIS',
        paymentId: referenceId.trim() || qrisRefCode,
        autoPrint,
        sendWhatsApp,
        customerPhone: customerPhone.trim(),
        orderType: 'dine_in',
        tableNumber: '04',
        orderNumber
      });
    } else if (activeTab === 'debit') {
      onConfirm({
        paidAmount: safeTotal,
        changeAmount: 0,
        paymentMethodId: activePaymentMethod?.id || 3,
        paymentMethodName: 'Debit Card',
        paymentId: referenceId.trim() || `DEB-${Date.now().toString().slice(-6)}`,
        autoPrint,
        sendWhatsApp,
        customerPhone: customerPhone.trim(),
        orderType: 'dine_in',
        tableNumber: '04',
        orderNumber
      });
    }
  };

  const totalItemsCount = cartTotalCount || (Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0);

  return (
    <div
      className="pm-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-payment-title"
    >
      <div className="pm-dialog">
        {/* ── Modal Header ── */}
        <header className="pm-header">
          <div>
            <h2 className="pm-title" id="modal-payment-title">
              Pembayaran Pesanan
            </h2>
            <p className="pm-meta">
              <span className="pm-badge-order">
                #{orderNumber}
              </span>
              <span>•</span>
              <span style={{ color: '#57534e' }}>Meja 04 (Dine In)</span>
              <span>•</span>
              <span style={{ color: '#a8a29e' }}>Kasir: {cashierName}</span>
            </p>
          </div>

          {/* Close Button */}
          <button
            aria-label="Tutup Modal"
            onClick={onClose}
            className="pm-close-btn"
            type="button"
          >
            <svg width="20" height="20" style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </header>

        {/* ── Modal Body Content ── */}
        <div className="pm-body hide-scrollbar">
          {/* Total Tagihan Banner Box */}
          <section className="pm-total-banner" data-purpose="total-bill-display">
            <span className="pm-total-tag">
              Total Tagihan
            </span>
            <div className="pm-total-val">
              {formatRupiah(safeTotal)}
            </div>
            <p className="pm-total-sub">
              Termasuk PPN &amp; Biaya Layanan ({totalItemsCount} Item)
            </p>
          </section>

          {/* Payment Method Segmented Tabs */}
          <section data-purpose="payment-methods">
            <label className="pm-tabs-label">
              Metode Pembayaran
            </label>
            <div className="pm-tabs-grid">
              {/* Cash / Tunai */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('cash');
                  setError('');
                }}
                className={`pm-tab-btn ${activeTab === 'cash' ? 'active' : ''}`}
              >
                <svg width="16" height="16" style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="12" rx="2" width="20" x="2" y="6" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
                <span>Tunai / Cash</span>
              </button>

              {/* QRIS */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('qris');
                  setError('');
                }}
                className={`pm-tab-btn ${activeTab === 'qris' ? 'active' : ''}`}
              >
                <svg width="16" height="16" style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3zM18 18h3v3h-3z" />
                </svg>
                <span>QRIS</span>
              </button>

              {/* Transfer / Debit */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('debit');
                  setError('');
                }}
                className={`pm-tab-btn ${activeTab === 'debit' ? 'active' : ''}`}
              >
                <svg width="16" height="16" style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="14" rx="2" width="20" x="2" y="5" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
                <span>Debit Card</span>
              </button>
            </div>
          </section>

          {/* ── TAB 1: CASH DETAILS & QUICK SELECTION ── */}
          {activeTab === 'cash' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} data-purpose="cash-calculation-section">
              {/* Input Uang Diterima */}
              <div>
                <label className="pm-input-label" htmlFor="cash-received">
                  Jumlah Uang Diterima (Rp)
                </label>
                <div className="pm-currency-box">
                  <div className="pm-currency-prefix">
                    <span>Rp</span>
                  </div>
                  <input
                    ref={cashInputRef}
                    id="cash-received"
                    name="cash-received"
                    type="text"
                    inputMode="numeric"
                    className="pm-currency-input"
                    placeholder="0"
                    value={paidNum > 0 ? Number(paidNum).toLocaleString('id-ID') : ''}
                    onChange={handleCashInputChange}
                  />
                </div>
              </div>

              {/* Quick Cash Chips */}
              <div>
                <span className="pm-chips-label">
                  Pecahan Cepat
                </span>
                <div className="pm-chips-grid">
                  {quickCashOptions.map((opt, idx) => {
                    const isSelected = paidNum === opt;
                    const isUangPas = opt === safeTotal;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPaidAmount(String(opt));
                          setError('');
                        }}
                        className={`pm-chip-btn ${isSelected ? 'active' : ''}`}
                      >
                        {isUangPas ? 'Uang Pas' : Number(opt).toLocaleString('id-ID')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kembalian Summary Card */}
              {paidNum > 0 && (
                <div className={`pm-change-card ${changeAmount >= 0 ? 'valid' : 'invalid'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="pm-change-icon-wrap">
                      <svg width="18" height="18" style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        {changeAmount >= 0 ? (
                          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <p className="pm-change-tag">
                        {changeAmount >= 0 ? 'Uang Kembalian' : 'Uang Kurang'}
                      </p>
                      <p className="pm-change-sub">
                        {changeAmount >= 0 ? 'Wajib diberikan ke pelanggan' : `Kurang ${formatRupiah(Math.abs(changeAmount))}`}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="pm-change-val">
                      {formatRupiah(Math.abs(changeAmount))}
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── TAB 2: QRIS DINAMIS ── */}
          {activeTab === 'qris' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center' }}>
              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e7e5e4', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '11px', fontWeight: 800, color: '#4A2C1D' }}>
                  <span>QRIS MAKNA COFFEE</span>
                  <span style={{ color: '#8A4F32', background: '#FDF8F5', padding: '2px 8px', borderRadius: '999px', border: '1px solid #EBD5C6', fontSize: '10px' }}>
                    Official Verified
                  </span>
                </div>

                <div style={{ padding: '8px', background: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '12px' }}>
                  <QRCodeSVG
                    value={`00020101021126580014ID.LINKAJA.WWW011893600911002234055204581253033605802ID5912MAKNA COFFEE6008JAYAPURA62200716${qrisRefCode}6304`}
                    size={150}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <span style={{ fontSize: '11px', color: '#78716c', fontFamily: 'monospace' }}>
                  NMID: ID1020048291039 • {activeLocation?.name || 'Abepura'}
                </span>
              </div>

              <div style={{ background: '#FDF8F5', padding: '12px', borderRadius: '12px', border: '1px solid #EBD5C6' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>
                  Kode Referensi QRIS:
                </span>
                <p style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 800, color: '#4A2C1D', margin: '2px 0 6px' }}>
                  {qrisRefCode}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#57534e', fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  <span>Menunggu konfirmasi scan pelanggan...</span>
                </div>
              </div>
            </section>
          )}

          {/* ── TAB 3: DEBIT CARD / EDC ── */}
          {activeTab === 'debit' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '16px', borderRadius: '16px', background: '#FDF8F5', border: '1px solid #EBD5C6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '13px', color: '#4A2C1D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect height="14" rx="2" width="20" x="2" y="5" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                    Bank Mandiri Bisnis / EDC
                  </strong>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#ffffff', border: '1px solid #a7f3d0', color: '#047857', fontSize: '10px', fontWeight: 700 }}>
                    Auto-Check
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#78716c' }}>
                  <div>Nomor Rekening Makna:</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, color: '#4A2C1D' }}>154-00-9821402-1</div>
                  <div style={{ fontSize: '11px', color: '#57534e' }}>a.n. PT Makna Kopi Abepura</div>
                </div>
              </div>

              <div>
                <label className="pm-input-label" htmlFor="card-ref">
                  No. Kartu / 4 Digit Terakhir / No. Ref EDC
                </label>
                <input
                  id="card-ref"
                  type="text"
                  className="pm-currency-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="Contoh: 4210 atau REF-8891"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                />
              </div>
            </section>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '12px', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Toggle Switch Options */}
          <section className="pm-toggles" data-purpose="toggle-options">
            <div className="pm-toggle-row">
              <label className="pm-toggle-label" htmlFor="auto-print">
                <svg width="16" height="16" style={{ width: '16px', height: '16px', flexShrink: 0, color: '#78716c' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Cetak Struk Fisik Otomatis</span>
              </label>
              <input
                id="auto-print"
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
                className="pm-checkbox"
              />
            </div>

            <div className="pm-toggle-row">
              <label className="pm-toggle-label" htmlFor="wa-receipt">
                <svg width="16" height="16" style={{ width: '16px', height: '16px', flexShrink: 0, color: '#78716c' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Kirim Struk WhatsApp Pelanggan</span>
              </label>
              <input
                id="wa-receipt"
                type="checkbox"
                checked={sendWhatsApp}
                onChange={(e) => setSendWhatsApp(e.target.checked)}
                className="pm-checkbox"
              />
            </div>

            {sendWhatsApp && (
              <div style={{ paddingTop: '4px' }}>
                <input
                  type="tel"
                  placeholder="Nomor WA (contoh: 081234567890)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pm-currency-input"
                  style={{ paddingLeft: '14px', fontSize: '13px' }}
                />
              </div>
            )}
          </section>
        </div>

        {/* ── Modal Footer Action Buttons ── */}
        <footer className="pm-footer">
          {/* Button Batal */}
          <button
            type="button"
            onClick={onClose}
            className="pm-btn-cancel"
          >
            Batal
          </button>

          {/* Button Konfirmasi & Cetak */}
          <button
            type="button"
            onClick={handleConfirm}
            className="pm-btn-confirm"
          >
            <svg width="18" height="18" style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Konfirmasi &amp; Cetak Struk</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
