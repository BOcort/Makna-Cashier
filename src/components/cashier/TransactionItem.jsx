// Transaction line item component
import { formatRupiah } from '../../utils/format.js';

export default function TransactionItem({ item, onDelete }) {
  return (
    <div className="tx-item">
      <div className="tx-left">
        <span className="tx-label">{item.menuName}</span>
        <span className="tx-detail">
          {item.sizeName} × {item.quantity} — @{formatRupiah(item.unitPrice)}
        </span>
      </div>
      <div className="tx-right">
        <span className="tx-price">{formatRupiah(item.subtotal)}</span>
        <button className="tx-del" onClick={() => onDelete(item.id)} type="button" aria-label="Hapus">
          🗑
        </button>
      </div>
    </div>
  );
}
