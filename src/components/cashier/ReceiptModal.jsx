// Receipt Modal — 100% Visual Consistency with Stitch POS Kasir Popup
import { useEffect, useRef } from 'react';
import { formatRupiah, formatDateTime } from '../../utils/format.js';

export default function ReceiptModal({
  show,
  onClose,
  transactionData,
  activeLocation,
  cashierName = 'Rian'
}) {
  const receiptRef = useRef(null);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show || !transactionData) return null;

  const {
    items = [],
    totalAmount = 0,
    paidAmount = 0,
    changeAmount = 0,
    paymentMethodName = 'Tunai / Cash',
    orderType = 'dine_in',
    tableNumber = '04',
    orderNumber = 'MK-0829',
    createdAt = new Date().toISOString()
  } = transactionData;

  const safeTotal = Number(totalAmount) || 0;
  const safePaid = Number(paidAmount) || safeTotal;
  const safeChange = Number(changeAmount) || Math.max(0, safePaid - safeTotal);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const textItems = items
      .map(it => `• ${it.menuName} (${it.sizeName || 'Reg'}) x${it.quantity} = ${formatRupiah(it.subtotal)}`)
      .join('%0A');

    const msg = `*STRUK PEMBAYARAN MAKNA COFFEE*%0A` +
      `Cabang: ${activeLocation?.name || 'Makna Coffee - Abepura'}%0A` +
      `No. Order: #${orderNumber}%0A` +
      `Waktu: ${formatDateTime(createdAt)}%0A` +
      `Kasir: ${cashierName}%0A` +
      `Layanan: ${orderType === 'dine_in' ? `Dine In (Meja ${tableNumber})` : 'Take Away'}%0A%0A` +
      `*Detail Pesanan:*%0A${textItems}%0A%0A` +
      `*Total Tagihan:* ${formatRupiah(safeTotal)}%0A` +
      `*Metode Pembayaran:* ${paymentMethodName}%0A` +
      `*Uang Diterima:* ${formatRupiah(safePaid)}%0A` +
      `*Kembalian:* ${formatRupiah(safeChange)}%0A%0A` +
      `_Terima kasih atas kunjungan Anda di Makna Coffee!_`;

    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('receipt-modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div
      className="receipt-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="receipt-dialog">
        {/* ── Modal Header Banner ── */}
        <div className="receipt-top-banner">
          <div className="receipt-top-left">
            <div className="receipt-success-badge">
              <svg width="20" height="20" style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="receipt-top-title">Transaksi Berhasil!</h3>
              <p className="receipt-top-subtitle">Struk #{orderNumber} telah tercatat di sistem</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="receipt-close-btn"
            aria-label="Tutup"
          >
            <svg width="18" height="18" style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable Receipt Paper Canvas ── */}
        <div className="receipt-body-canvas hide-scrollbar">
          <div ref={receiptRef} className="receipt-paper">
            {/* Cafe Logo & Header */}
            <div className="receipt-brand-header">
              <h2 className="receipt-brand-title">MAKNA COFFEE</h2>
              <p className="receipt-brand-sub">
                Outlet {activeLocation?.name?.toUpperCase() || 'ABEPURA'} • JAYAPURA
              </p>
              <p className="receipt-brand-contact">
                Telp: {activeLocation?.phone || '+62 812-4829-1092'} • WiFi: MaknaCoffee_Free
              </p>
            </div>

            <div className="receipt-divider" />

            {/* Order Meta Information */}
            <div className="receipt-meta-rows">
              <div className="receipt-meta-row">
                <span className="receipt-meta-label">No. Order:</span>
                <span className="receipt-meta-val font-bold">#{orderNumber}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="receipt-meta-label">Tanggal &amp; Waktu:</span>
                <span className="receipt-meta-val">{formatDateTime(createdAt)}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="receipt-meta-label">Kasir:</span>
                <span className="receipt-meta-val">{cashierName}</span>
              </div>
              <div className="receipt-meta-row">
                <span className="receipt-meta-label">Tipe Layanan:</span>
                <span className="receipt-meta-val font-semibold">
                  {orderType === 'dine_in' ? `Dine In (Meja ${tableNumber})` : 'Take Away (Bungkus)'}
                </span>
              </div>
            </div>

            <div className="receipt-divider" />

            {/* Items Purchased List */}
            <div className="receipt-items-section">
              <div className="receipt-items-header">
                <span>ITEM MENU</span>
                <span>SUBTOTAL</span>
              </div>

              {items.map((it, idx) => (
                <div key={idx} className="receipt-item-entry">
                  <div className="receipt-item-main">
                    <span className="receipt-item-name">{it.menuName}</span>
                    <span className="receipt-item-subtotal">{formatRupiah(it.subtotal)}</span>
                  </div>
                  <div className="receipt-item-details">
                    <span>
                      {it.quantity}x @{formatRupiah(it.unitPrice)} • {it.sizeName || 'Regular'}
                      {it.iceLevel && ` • ${it.iceLevel === 'normal' ? 'Normal Ice' : it.iceLevel === 'less' ? 'Less Ice' : 'No Ice'}`}
                    </span>
                  </div>
                  {it.notes && (
                    <div className="receipt-item-note">Catatan: "{it.notes}"</div>
                  )}
                </div>
              ))}
            </div>

            <div className="receipt-divider" />

            {/* Financial Summary */}
            <div className="receipt-totals-section">
              <div className="receipt-total-row">
                <span>Subtotal ({items.reduce((sum, it) => sum + (it.quantity || 1), 0)} Item):</span>
                <span>{formatRupiah(safeTotal)}</span>
              </div>
              <div className="receipt-total-row">
                <span>Pajak Resto &amp; PB1 (10%):</span>
                <span>Termasuk</span>
              </div>
              <div className="receipt-grand-total">
                <span>TOTAL BAYAR:</span>
                <span>{formatRupiah(safeTotal)}</span>
              </div>

              <div className="receipt-payment-info">
                <div className="receipt-total-row">
                  <span>Metode Pembayaran:</span>
                  <span className="font-bold">{paymentMethodName}</span>
                </div>
                <div className="receipt-total-row">
                  <span>Uang Diterima:</span>
                  <span>{formatRupiah(safePaid)}</span>
                </div>
                <div className="receipt-total-row receipt-change-highlight">
                  <span>Kembalian:</span>
                  <span className="receipt-change-val">{formatRupiah(safeChange)}</span>
                </div>
              </div>
            </div>

            <div className="receipt-divider" />

            {/* Footer Thank You & Barcode */}
            <div className="receipt-brand-footer">
              <p className="receipt-footer-slogan">*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***</p>
              <p className="receipt-footer-sub">Makna Kopi, Makna Rasa Sejati</p>
              <div className="receipt-barcode-wrap">
                <svg width="180" height="36" viewBox="0 0 180 36" fill="none" style={{ maxWidth: '100%', height: '32px' }}>
                  <rect x="10" y="4" width="3" height="28" fill="#44403c" />
                  <rect x="16" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="21" y="4" width="4" height="28" fill="#44403c" />
                  <rect x="28" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="33" y="4" width="5" height="28" fill="#44403c" />
                  <rect x="41" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="46" y="4" width="3" height="28" fill="#44403c" />
                  <rect x="52" y="4" width="4" height="28" fill="#44403c" />
                  <rect x="59" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="64" y="4" width="5" height="28" fill="#44403c" />
                  <rect x="72" y="4" width="3" height="28" fill="#44403c" />
                  <rect x="78" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="83" y="4" width="4" height="28" fill="#44403c" />
                  <rect x="90" y="4" width="3" height="28" fill="#44403c" />
                  <rect x="96" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="101" y="4" width="5" height="28" fill="#44403c" />
                  <rect x="109" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="114" y="4" width="4" height="28" fill="#44403c" />
                  <rect x="121" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="126" y="4" width="3" height="28" fill="#44403c" />
                  <rect x="132" y="4" width="5" height="28" fill="#44403c" />
                  <rect x="140" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="145" y="4" width="4" height="28" fill="#44403c" />
                  <rect x="152" y="4" width="2" height="28" fill="#44403c" />
                  <rect x="157" y="4" width="3" height="28" fill="#44403c" />
                  <rect x="163" y="4" width="4" height="28" fill="#44403c" />
                </svg>
                <div className="receipt-barcode-num">#{orderNumber}-POS01</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer Action Buttons ── */}
        <footer className="receipt-footer-controls">
          <button
            type="button"
            onClick={handlePrint}
            className="receipt-btn-print"
          >
            <svg width="16" height="16" style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Cetak Struk</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="receipt-btn-wa"
          >
            <svg width="16" height="16" style={{ width: '16px', height: '16px', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Share WA</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="receipt-btn-done"
          >
            <span>Selesai</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
