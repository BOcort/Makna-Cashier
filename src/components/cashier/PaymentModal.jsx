// Payment Modal with Cash, QRIS, and Transfer Bank support
import { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '../../utils/format.js';

export default function PaymentModal({
  show,
  onClose,
  onConfirm,
  totalAmount,
  paymentMethods = [],
  activeLocation
}) {
  const [activeTab, setActiveTab] = useState('cash'); // 'cash' | 'qris' | 'transfer'
  const [paidAmount, setPaidAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [error, setError] = useState('');
  const cashInputRef = useRef(null);

  // Generate an order / QR reference code
  const qrisRefCode = useMemo(() => {
    const timestamp = Date.now().toString().slice(-6);
    return `MKN-QRIS-${timestamp}`;
  }, [show]);

  // Find payment method record from DB for currently active tab
  const activePaymentMethod = useMemo(() => {
    if (activeTab === 'cash') {
      return paymentMethods.find(p => p.type === 'cash' || p.name.toLowerCase().includes('cash') || p.name.toLowerCase().includes('tunai')) || paymentMethods[0];
    }
    if (activeTab === 'qris') {
      return paymentMethods.find(p => p.name.toLowerCase().includes('qris')) || paymentMethods.find(p => p.type === 'digital') || paymentMethods[1] || paymentMethods[0];
    }
    if (activeTab === 'transfer') {
      return paymentMethods.find(p => p.name.toLowerCase().includes('transfer')) || paymentMethods.find(p => p.type === 'digital') || paymentMethods[2] || paymentMethods[0];
    }
    return paymentMethods[0];
  }, [activeTab, paymentMethods]);

  const paidNum = parseInt(paidAmount, 10) || 0;
  const changeAmount = paidNum - totalAmount;

  // Reset when opened
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
      setActiveTab('cash');
      setPaidAmount('');
      setReferenceId('');
      setError('');
      setTimeout(() => {
        cashInputRef.current?.focus();
      }, 150);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;

  // Quick cash chips based on total
  const quickCashOptions = useMemo(() => {
    const options = [totalAmount];
    const standardPills = [50000, 70000, 100000, 150000, 200000];
    standardPills.forEach(p => {
      if (p >= totalAmount && !options.includes(p)) {
        options.push(p);
      }
    });
    return options.slice(0, 4);
  }, [totalAmount]);

  const handleConfirm = () => {
    if (activeTab === 'cash') {
      if (!paidAmount || paidNum <= 0) {
        setError('Silakan masukkan jumlah uang yang diterima.');
        return;
      }
      if (paidNum < totalAmount) {
        setError(`Uang pembayaran kurang ${formatRupiah(totalAmount - paidNum)}.`);
        return;
      }
      onConfirm({
        paidAmount: paidNum,
        changeAmount: Math.max(0, changeAmount),
        paymentMethodId: activePaymentMethod?.id || 1,
        paymentId: ''
      });
    } else if (activeTab === 'qris') {
      onConfirm({
        paidAmount: totalAmount,
        changeAmount: 0,
        paymentMethodId: activePaymentMethod?.id || 2,
        paymentId: referenceId.trim() || qrisRefCode
      });
    } else if (activeTab === 'transfer') {
      onConfirm({
        paidAmount: totalAmount,
        changeAmount: 0,
        paymentMethodId: activePaymentMethod?.id || 3,
        paymentId: referenceId.trim() || `TRF-${Date.now().toString().slice(-6)}`
      });
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('payment-modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="payment-modal-backdrop" onClick={handleBackdropClick}>
      <div className="payment-modal-card" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="payment-modal-header">
          <div>
            <span className="payment-modal-tag">Checkout Kasir</span>
            <h3 className="payment-modal-title">Pembayaran Pesanan</h3>
          </div>
          <button
            type="button"
            className="payment-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Total Highlight Banner */}
        <div className="payment-total-banner">
          <div>
            <span className="payment-total-caption">Total Tagihan Final</span>
            <div className="payment-total-amount">{formatRupiah(totalAmount)}</div>
          </div>
          <div className="payment-total-branch">
            <span className="payment-branch-badge">{activeLocation?.name || 'Abepura'}</span>
            <span className="payment-terminal-label">Terminal POS-01</span>
          </div>
        </div>

        {/* Payment Tabs */}
        <div className="payment-modal-body">
          <label className="payment-section-label">Pilih Metode Pembayaran</label>
          <div className="payment-tab-row">
            <button
              type="button"
              className={`payment-tab-btn ${activeTab === 'cash' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('cash');
                setError('');
              }}
            >
              <span className="material-symbols-outlined payment-tab-icon">payments</span>
              <span className="payment-tab-text">Cash (Tunai)</span>
            </button>

            <button
              type="button"
              className={`payment-tab-btn ${activeTab === 'qris' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('qris');
                setError('');
              }}
            >
              <span className="material-symbols-outlined payment-tab-icon">qr_code_scanner</span>
              <span className="payment-tab-text">QRIS Dinamis</span>
            </button>

            <button
              type="button"
              className={`payment-tab-btn ${activeTab === 'transfer' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('transfer');
                setError('');
              }}
            >
              <span className="material-symbols-outlined payment-tab-icon">account_balance</span>
              <span className="payment-tab-text">Transfer Bank</span>
            </button>
          </div>

          {/* TAB 1: CASH */}
          {activeTab === 'cash' && (
            <div className="payment-tab-content">
              <div className="payment-input-group">
                <label className="payment-field-label">Nominal Uang Diterima</label>
                <div className="payment-currency-input-wrap">
                  <span className="payment-currency-prefix">Rp</span>
                  <input
                    ref={cashInputRef}
                    type="number"
                    className="payment-currency-input"
                    placeholder="0"
                    value={paidAmount}
                    onChange={(e) => {
                      setPaidAmount(e.target.value);
                      setError('');
                    }}
                  />
                </div>
              </div>

              {/* Quick Cash Chips */}
              <div className="payment-chips-row">
                {quickCashOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`payment-chip ${paidNum === opt ? 'active' : ''}`}
                    onClick={() => {
                      setPaidAmount(String(opt));
                      setError('');
                    }}
                  >
                    {opt === totalAmount ? 'Uang Pas' : formatRupiah(opt)}
                  </button>
                ))}
              </div>

              {/* Change Box */}
              {paidNum > 0 && (
                <div className={`payment-change-card ${changeAmount >= 0 ? 'valid' : 'invalid'}`}>
                  <div className="payment-change-left">
                    <span className="material-symbols-outlined payment-change-icon">
                      {changeAmount >= 0 ? 'check_circle' : 'warning'}
                    </span>
                    <span className="payment-change-label">
                      {changeAmount >= 0 ? 'Kembalian Konsumen' : 'Uang Kurang'}
                    </span>
                  </div>
                  <span className="payment-change-val">
                    {formatRupiah(Math.abs(changeAmount))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QRIS */}
          {activeTab === 'qris' && (
            <div className="payment-tab-content qris-content">
              <div className="qris-card">
                <div className="qris-header">
                  <span className="qris-brand">QRIS MAKNA COFFEE</span>
                  <div className="flex items-center gap-1 text-amber-800">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span className="text-[10px] font-bold">Official</span>
                  </div>
                </div>

                <div className="qris-qr-container">
                  <QRCodeSVG
                    value={`00020101021126580014ID.LINKAJA.WWW011893600911002234055204581253033605802ID5912MAKNA COFFEE6008JAYAPURA62200716${qrisRefCode}6304`}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <span className="qris-nmid">NMID: ID1020048291039</span>
              </div>

              <div className="qris-info">
                <span className="qris-ref-label">Kode Referensi QRIS</span>
                <p className="qris-ref-val">{qrisRefCode}</p>
                <div className="qris-pulse-status">
                  <span className="qris-pulse-dot"></span>
                  <span>Menunggu konfirmasi scan pelanggan...</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSFER */}
          {activeTab === 'transfer' && (
            <div className="payment-tab-content">
              <div className="transfer-bank-card">
                <div className="transfer-bank-header">
                  <div className="transfer-bank-title">
                    <span className="material-symbols-outlined text-[22px] text-amber-900">account_balance</span>
                    <strong>Bank Mandiri Bisnis</strong>
                  </div>
                  <span className="transfer-bank-badge">Auto-Check</span>
                </div>
                <div className="transfer-bank-body">
                  <span className="transfer-bank-label">Nomor Rekening Makna:</span>
                  <p className="transfer-bank-acc">154-00-9821402-1</p>
                  <span className="transfer-bank-owner">a.n. PT Makna Kopi Abepura</span>
                </div>
              </div>

              <div className="payment-input-group" style={{ marginTop: '12px' }}>
                <label className="payment-field-label">
                  No. Referensi / 4 Digit Terakhir Rekening Konsumen
                </label>
                <input
                  type="text"
                  className="payment-text-input"
                  placeholder="Contoh: REF-9831 atau 4210"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                />
              </div>
            </div>
          )}

          {error && <div className="payment-error-box">{error}</div>}
        </div>

        {/* Footer Actions */}
        <div className="payment-modal-footer">
          <button
            type="button"
            className="payment-cancel-btn"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className="payment-submit-btn"
            onClick={handleConfirm}
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Konfirmasi & Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
}
