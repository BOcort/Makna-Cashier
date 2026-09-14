// Closing modal — summary before closing the register
import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { formatRupiah } from '../../utils/format.js';

export default function ClosingModal({ show, onClose, onConfirm, summary, byPaymentMethod, openedAt }) {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(notes);
    setNotes('');
  };

  const formatOpenTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <Modal show={show} onClose={onClose} title="Tutup Kasir (Closing)">
      <div className="closing-modal-content">
        <div className="closing-time-info">
          <div className="closing-time-item">
            <span className="closing-time-label">Buka</span>
            <span className="closing-time-value">{formatOpenTime(openedAt)}</span>
          </div>
          <div className="closing-time-item">
            <span className="closing-time-label">Tutup</span>
            <span className="closing-time-value">{formatOpenTime(new Date().toISOString())}</span>
          </div>
        </div>

        <div className="closing-summary-card">
          <div className="closing-summary-row">
            <span>Total Transaksi</span>
            <span className="closing-summary-val">{summary?.total_transactions || 0}</span>
          </div>
          <div className="closing-summary-row highlight">
            <span>Total Omzet</span>
            <span className="closing-summary-val">{formatRupiah(summary?.total_revenue || 0)}</span>
          </div>
        </div>

        {byPaymentMethod?.length > 0 && (
          <div className="closing-breakdown">
            <h4 className="closing-breakdown-title">Rincian per Metode Pembayaran</h4>
            {byPaymentMethod.map(pm => (
              <div key={pm.payment_method_id} className="closing-pm-row">
                <div className="closing-pm-left">
                  <span className="closing-pm-name">{pm.payment_method_name}</span>
                  <span className="closing-pm-count">{pm.transaction_count} transaksi</span>
                </div>
                <span className="closing-pm-amount">{formatRupiah(pm.total_amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="modal-form-row">
          <label className="modal-label">Catatan (opsional)</label>
          <input
            type="text"
            className="text-input"
            placeholder="Catatan untuk closing ini..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="modal-buttons">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button type="button" className="btn btn-close" onClick={handleConfirm}>
          Konfirmasi Closing
        </button>
      </div>
    </Modal>
  );
}
