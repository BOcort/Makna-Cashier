// Item Detail & Customization Modal for Kasir
import { useState, useEffect, useMemo } from 'react';
import { formatRupiah } from '../../utils/format.js';

export default function ItemDetailModal({ show, item, onClose, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [iceLevel, setIceLevel] = useState('normal'); // 'normal' | 'less' | 'no'
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Initialize or reset when item changes or modal opens
  useEffect(() => {
    if (show && item) {
      const defaultSize = item.sizes?.[0] || null;
      setSelectedSize(defaultSize);
      setIceLevel('normal');
      setNotes('');
      setQuantity(1);
    }
  }, [show, item]);

  // Lock body scroll
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  const basePrice = item?.sizes?.[0]?.price || 0;
  const currentPrice = selectedSize?.price || basePrice;
  const subtotal = currentPrice * quantity;

  // Check if beverage (show ice selection)
  const isBeverage = useMemo(() => {
    if (!item) return false;
    const cat = (item.category_name || '').toLowerCase();
    return cat.includes('coffee') || cat.includes('signature') || cat.includes('kopi') || cat.includes('minum');
  }, [item]);

  if (!show || !item) return null;

  const handleAdd = () => {
    onAddToCart({
      item,
      selectedSize,
      quantity,
      iceLevel: isBeverage ? iceLevel : null,
      notes: notes.trim(),
      subtotal
    });
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('item-modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="item-modal-backdrop" onClick={handleBackdropClick}>
      <div className="item-modal-card" role="dialog" aria-modal="true">
        {/* Header Image */}
        <div className="item-modal-img-wrap">
          {item.image_data ? (
            <img
              src={item.image_data}
              alt={item.name}
              className="item-modal-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="item-modal-img-placeholder"
            style={{ display: item.image_data ? 'none' : 'flex' }}
          >
            <span className="material-symbols-outlined text-6xl">coffee</span>
          </div>

          <button
            className="item-modal-close-btn"
            onClick={onClose}
            aria-label="Tutup"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="item-modal-badge-container">
            {item.category_name && (
              <span className="item-badge-category">
                {item.category_name}
              </span>
            )}
            {item.badge && (
              <span className="item-badge-tag">
                {item.badge}
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <div className="item-modal-body">
          <div className="item-modal-title-row">
            <div>
              <h3 className="item-modal-title">{item.name}</h3>
              {item.description && (
                <p className="item-modal-desc">{item.description}</p>
              )}
            </div>
            <div className="item-modal-price-display">
              {formatRupiah(currentPrice)}
            </div>
          </div>

          {/* Size Options */}
          {item.sizes?.length > 0 && (
            <div className="item-modal-section">
              <span className="item-modal-section-title">Pilihan Ukuran Cup</span>
              <div className="item-size-grid">
                {item.sizes.map((sz) => {
                  const isActive = selectedSize?.size_id === sz.size_id;
                  const priceDiff = sz.price - basePrice;
                  const diffText = priceDiff > 0 ? `+${formatRupiah(priceDiff)}` : 'Standar';

                  return (
                    <button
                      key={sz.size_id}
                      type="button"
                      className={`item-size-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedSize(sz)}
                    >
                      <span className="item-size-name">{sz.size_name}</span>
                      <span className="item-size-diff">{diffText}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ice Level Options for drinks */}
          {isBeverage && (
            <div className="item-modal-section">
              <span className="item-modal-section-title">Level Es</span>
              <div className="item-ice-grid">
                <button
                  type="button"
                  className={`item-ice-btn ${iceLevel === 'normal' ? 'active' : ''}`}
                  onClick={() => setIceLevel('normal')}
                >
                  Normal Ice
                </button>
                <button
                  type="button"
                  className={`item-ice-btn ${iceLevel === 'less' ? 'active' : ''}`}
                  onClick={() => setIceLevel('less')}
                >
                  Less Ice
                </button>
                <button
                  type="button"
                  className={`item-ice-btn ${iceLevel === 'no' ? 'active' : ''}`}
                  onClick={() => setIceLevel('no')}
                >
                  No Ice
                </button>
              </div>
            </div>
          )}

          {/* Special notes */}
          <div className="item-modal-section">
            <span className="item-modal-section-title">Catatan Khusus (Opsional)</span>
            <input
              type="text"
              className="item-modal-input"
              placeholder="Contoh: Kurangi manis, pisahkan sedotan, saus pedas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Action */}
        <div className="item-modal-footer">
          <div className="item-stepper">
            <button
              type="button"
              className="item-stepper-btn"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Kurangi"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <span className="item-stepper-val">{quantity}</span>
            <button
              type="button"
              className="item-stepper-btn"
              onClick={() => setQuantity(q => q + 1)}
              aria-label="Tambah"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          <button
            type="button"
            className="item-modal-add-btn"
            onClick={handleAdd}
          >
            <span>+ Tambah ke Keranjang</span>
            <span className="item-modal-subtotal">{formatRupiah(subtotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
