// Menu card component for cashier POS grid
import { formatRupiah } from '../../utils/format.js';

export default function MenuCard({ item, selected, onSelect }) {
  const prices = item.sizes?.map(s => s.price) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  return (
    <div
      className={`pos-menu-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
    >
      {/* Thumbnail with overlay badge */}
      <div className="pos-card-img-wrap">
        {item.image_data ? (
          <img
            src={item.image_data}
            alt={item.name}
            className="pos-card-img"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="pos-card-img-placeholder"
          style={{ display: item.image_data ? 'none' : 'flex' }}
        >
          <span className="material-symbols-outlined text-4xl">coffee</span>
        </div>

        {item.badge && (
          <span className="pos-card-badge">
            {item.badge}
          </span>
        )}
      </div>

      {/* Info Details */}
      <div className="pos-card-content">
        <div className="pos-card-header-info">
          {item.category_name && (
            <span className="pos-card-category">{item.category_name}</span>
          )}
          <h3 className="pos-card-title">{item.name}</h3>
          {item.description && (
            <p className="pos-card-desc">{item.description}</p>
          )}
        </div>

        {/* Pricing and Action */}
        <div className="pos-card-footer">
          <div className="pos-card-price-wrap">
            <span className="pos-card-price-label">Mulai dari</span>
            <span className="pos-card-price">{formatRupiah(minPrice)}</span>
          </div>

          <button
            type="button"
            className="pos-card-add-btn"
            aria-label={`Tambah ${item.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
