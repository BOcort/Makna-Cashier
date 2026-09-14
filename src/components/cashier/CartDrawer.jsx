// Right Slide-in Cart Drawer for Kasir
import { useEffect } from 'react';
import { formatRupiah } from '../../utils/format.js';

export default function CartDrawer({
  show,
  cart,
  activeLocation,
  onClose,
  onUpdateQty,
  onDeleteItem,
  onProceedPayment
}) {
  // Lock body scroll when open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('cart-drawer-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="cart-drawer-backdrop" onClick={handleBackdropClick}>
      <div className="cart-drawer-panel" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-header-left">
            <div className="cart-drawer-icon-box">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            </div>
            <div>
              <h3 className="cart-drawer-title">Keranjang Pesanan</h3>
              <div className="cart-drawer-meta">
                <span className="cart-drawer-status-dot"></span>
                <span>{activeLocation?.name || 'Makna Coffee'} • {totalItemCount} Item</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="cart-drawer-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Item List */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <span className="material-symbols-outlined text-6xl text-amber-800/40 mb-3">shopping_bag</span>
              <p className="cart-empty-title">Keranjang Anda Masih Kosong</p>
              <p className="cart-empty-subtitle">Pilih menu kopi atau makanan favorit untuk menambah pesanan.</p>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-card">
                  {/* Thumbnail */}
                  <div className="cart-item-img-wrap">
                    {item.imageData ? (
                      <img
                        src={item.imageData}
                        alt={item.menuName}
                        className="cart-item-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="cart-item-img-fallback"
                      style={{ display: item.imageData ? 'none' : 'flex' }}
                    >
                      <span className="material-symbols-outlined text-2xl">coffee</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.menuName}</h4>
                    <p className="cart-item-options">
                      {item.sizeName}
                      {item.iceLevel && ` • ${item.iceLevel === 'normal' ? 'Normal Ice' : item.iceLevel === 'less' ? 'Less Ice' : 'No Ice'}`}
                    </p>
                    {item.notes && (
                      <p className="cart-item-note">"{item.notes}"</p>
                    )}
                    <span className="cart-item-price">{formatRupiah(item.subtotal)}</span>
                  </div>

                  {/* Controls */}
                  <div className="cart-item-actions">
                    <div className="cart-item-stepper">
                      <button
                        type="button"
                        className="cart-stepper-btn"
                        onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                        aria-label="Kurangi kuantitas"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="cart-stepper-qty">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-stepper-btn"
                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                        aria-label="Tambah kuantitas"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-item-delete-btn"
                      onClick={() => onDeleteItem(item.id)}
                      title="Hapus item"
                      aria-label="Hapus item"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-breakdown">
              <div className="cart-breakdown-row">
                <span>Subtotal ({totalItemCount} item)</span>
                <span>{formatRupiah(totalAmount)}</span>
              </div>
              <div className="cart-breakdown-row cart-total-row">
                <span>Total Bayar</span>
                <span className="cart-total-val">{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            <button
              type="button"
              className="cart-pay-btn"
              onClick={() => {
                onClose();
                onProceedPayment();
              }}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">payments</span>
                <span>Lanjut ke Pembayaran</span>
              </div>
              <span>{formatRupiah(totalAmount)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
