// RecipeQuickModal — Modal Kelola Formulasi Resep Menu (Konsisten dengan Desain Sistem POS)
import { useState, useEffect, useMemo } from 'react';
import { formatRupiah } from '../../utils/format.js';
import { useToast } from '../ui/Toast.jsx';

export default function RecipeQuickModal({
  show,
  menuItem = null,
  inventoryList = [],
  activeLocation = null,
  onClose,
  onSave
}) {
  const toast = useToast();
  const [recipeRows, setRecipeRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!show || !menuItem) return;

    if (menuItem.recipeIngredients && menuItem.recipeIngredients.length > 0) {
      setRecipeRows(
        menuItem.recipeIngredients.map((r) => ({
          inventoryId: r.inventory_id,
          quantity: r.quantity
        }))
      );
    } else {
      setRecipeRows([]);
    }
    setSearchQuery('');
    setIsSaving(false);
  }, [show, menuItem]);

  const filteredInventoryList = useMemo(() => {
    if (!searchQuery.trim()) return inventoryList;
    const q = searchQuery.toLowerCase().trim();
    return inventoryList.filter((inv) =>
      (inv.name || '').toLowerCase().includes(q) ||
      (inv.category || '').toLowerCase().includes(q)
    );
  }, [inventoryList, searchQuery]);

  const handleAddRow = () => {
    if (inventoryList.length === 0) {
      toast.warning('Belum ada data bahan baku di inventaris');
      return;
    }
    // Pick the first ingredient not already in recipeRows, or first item
    const existingIds = new Set(recipeRows.map((r) => r.inventoryId));
    const available = inventoryList.find((i) => !existingIds.has(i.id)) || inventoryList[0];

    setRecipeRows((prev) => [
      ...prev,
      {
        inventoryId: available.id,
        quantity: 20
      }
    ]);
  };

  const handleUpdateRow = (index, field, val) => {
    setRecipeRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: field === 'inventoryId' ? Number(val) : parseFloat(val) || 0
      };
      return copy;
    });
  };

  const handleRemoveRow = (index) => {
    setRecipeRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Live estimated HPP calculation
  const estimatedHpp = useMemo(() => {
    let total = 0;
    recipeRows.forEach((row) => {
      const inv = inventoryList.find((i) => i.id === row.inventoryId);
      if (inv && inv.cost_per_unit > 0 && row.quantity > 0) {
        total += inv.cost_per_unit * row.quantity;
      }
    });
    return Math.round(total);
  }, [recipeRows, inventoryList]);

  // Reference selling price (first size or regular size)
  const referencePrice = useMemo(() => {
    if (!menuItem || !menuItem.sizes || menuItem.sizes.length === 0) return 0;
    const reg = menuItem.sizes.find(
      (s) =>
        (s.size_name || '').toLowerCase().includes('reg') ||
        (s.size_name || '').toLowerCase().includes('med')
    );
    return reg ? reg.price : menuItem.sizes[0]?.price || 0;
  }, [menuItem]);

  const grossMargin = useMemo(() => {
    if (!referencePrice || referencePrice <= 0 || estimatedHpp <= 0) return null;
    const profit = referencePrice - estimatedHpp;
    const pct = Math.round((profit / referencePrice) * 100);
    return { profit, pct };
  }, [referencePrice, estimatedHpp]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validRows = recipeRows
      .filter((r) => r.inventoryId && r.quantity > 0)
      .map((r) => ({
        inventoryId: Number(r.inventoryId),
        quantity: Number(r.quantity)
      }));

    setIsSaving(true);
    setTimeout(() => {
      onSave(menuItem.id, validRows);
    }, 250);
  };

  if (!show || !menuItem) return null;

  const locationName = activeLocation?.name || 'Cabang Abepura';
  const defaultImage = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80';

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div
        className="stitch-modal-card"
        style={{ maxWidth: '720px' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stitch-recipe-modal-title"
      >
        {/* ── Header ── */}
        <div className="stitch-modal-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div className="stitch-header-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#9B4428' }}>
                receipt_long
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                <h2 id="stitch-recipe-modal-title" style={{ fontSize: '18px', fontWeight: 800, color: '#31170A', margin: 0, letterSpacing: '-0.3px' }}>
                  Kelola Resep: {menuItem.name}
                </h2>
                <span className="stitch-badge-pill amber">
                  {menuItem.sku || `#MKN-${String(menuItem.id).padStart(3, '0')}`}
                </span>
                <span className="stitch-badge-pill green">
                  <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                  Auto-Deduct Aktif
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#50443F', margin: 0, lineHeight: 1.4, maxWidth: '460px' }}>
                Formulasi komposisi bahan baku per porsi menu agar stok gudang & bar terpotong otomatis setiap transaksi kasir di {locationName}.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="pos-modal-close"
            onClick={onClose}
            aria-label="Tutup Dialog"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* ── Accent Top Divider Line ── */}
        <div className="stitch-modal-accent"></div>

        {/* ── Modal Body ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="stitch-modal-body">

            {/* Menu Item Quick Overview Card */}
            <div style={{ background: '#FDF2E7', border: '1px solid rgba(130, 79, 44, 0.12)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', background: '#F2E6DC', flexShrink: 0, border: '1px solid rgba(130, 79, 44, 0.10)' }}>
                  <img
                    src={menuItem.image_data || defaultImage}
                    alt={menuItem.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = defaultImage; }}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#31170A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {menuItem.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#50443F', marginTop: '2px' }}>
                    Kategori: <strong>{menuItem.category_name || 'Katalog Kasir'}</strong> • {recipeRows.length} Bahan Diformulasikan
                  </div>
                </div>
              </div>

              {/* Prices Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {menuItem.sizes && menuItem.sizes.length > 0 ? (
                  menuItem.sizes.map((sz) => (
                    <div key={sz.id} style={{ background: '#FFFFFF', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(130, 79, 44, 0.10)', fontSize: '11px', fontWeight: 700, color: '#31170A' }}>
                      <span style={{ color: '#82746E', marginRight: '4px' }}>{sz.size_name}:</span>
                      <span>{formatRupiah(sz.price)}</span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '11px', color: '#82746E', fontStyle: 'italic' }}>Harga belum diset</span>
                )}
              </div>
            </div>

            {/* Section Resep Bahan Baku */}
            <div>
              <div className="stitch-section-header" style={{ marginBottom: '8px' }}>
                <div className="stitch-section-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9B4428' }}>science</span>
                  <span>Komposisi Bahan Baku Resep</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleAddRow}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                  <span>Tambah Bahan</span>
                </button>
              </div>

              {inventoryList.length > 5 && (
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '16px' }}>
                    search
                  </span>
                  <input
                    type="text"
                    className="stitch-input"
                    style={{ height: '36px', paddingLeft: '32px', fontSize: '12px' }}
                    placeholder="Filter pilihan bahan baku di dropdown..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}

              {/* Recipe rows header */}
              {recipeRows.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 65px 110px 36px', gap: '8px', padding: '0 8px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#82746E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bahan Baku (Gudang & Bar)</div>
                  <div style={{ fontSize: '11px', color: '#82746E', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Takaran</div>
                  <div style={{ fontSize: '11px', color: '#82746E', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Satuan</div>
                  <div style={{ fontSize: '11px', color: '#82746E', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Subtotal HPP</div>
                  <div></div>
                </div>
              )}

              {/* Recipe rows list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '2px' }}>
                {recipeRows.map((row, idx) => {
                  const selectedInv = inventoryList.find((i) => i.id === row.inventoryId);
                  const invList = searchQuery.trim() ? filteredInventoryList : inventoryList;
                  const rowCost = (selectedInv?.cost_per_unit || 0) * (row.quantity || 0);

                  return (
                    <div
                      key={idx}
                      className="stitch-recipe-card"
                      style={{ display: 'grid', gridTemplateColumns: '1fr 90px 65px 110px 36px', gap: '8px', alignItems: 'center' }}
                    >
                      {/* Ingredient selector */}
                      <div style={{ position: 'relative' }}>
                        <select
                          className="stitch-input"
                          style={{ height: '38px', fontSize: '13px', fontWeight: 600, paddingRight: '28px', appearance: 'none', cursor: 'pointer' }}
                          value={row.inventoryId}
                          onChange={(e) => handleUpdateRow(idx, 'inventoryId', e.target.value)}
                        >
                          {invList.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} (Stok: {inv.current_stock} {inv.unit})
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '18px', pointerEvents: 'none' }}>
                          expand_more
                        </span>
                      </div>

                      {/* Quantity input */}
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="stitch-input"
                          style={{ height: '38px', fontSize: '14px', fontWeight: 800, textAlign: 'center', color: '#31170A' }}
                          value={row.quantity}
                          onChange={(e) => handleUpdateRow(idx, 'quantity', e.target.value)}
                        />
                      </div>

                      {/* Unit pill */}
                      <div style={{ height: '38px', background: '#F2E6DC', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#31170A', border: '1px solid rgba(130, 79, 44, 0.10)' }}>
                        {selectedInv?.unit || 'ml'}
                      </div>

                      {/* Subtotal cost */}
                      <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#9B4428' }}>
                        {formatRupiah(rowCost)}
                      </div>

                      {/* Delete button */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="menu-action-btn danger"
                          style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                          onClick={() => handleRemoveRow(idx)}
                          title="Hapus Bahan"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {recipeRows.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 20px', background: '#FDF2E7', borderRadius: '14px', border: '2px dashed rgba(130, 79, 44, 0.18)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#82746E' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#9B4428', opacity: 0.6 }}>receipt_long</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#31170A' }}>Belum ada formulasi bahan baku</span>
                    <span style={{ fontSize: '12px' }}>Klik tombol di atas untuk menambahkan bahan baku pertama ke resep ini.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bento Live HPP & Margin Calculation Box */}
            <div className="stitch-hpp-box" style={{ background: '#FDF2E7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="stitch-hpp-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>analytics</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9B4428', display: 'block' }}>
                    Estimasi Total HPP per Porsi
                  </span>
                  <div style={{ fontSize: '12px', color: '#50443F' }}>
                    Akumulasi biaya bahan baku per 1 cup porsi menu.
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div className="stitch-hpp-amount">
                  {formatRupiah(estimatedHpp)}
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#82746E', marginLeft: '4px' }}>/ cup</span>
                </div>
                {grossMargin ? (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803D' }}>
                    Gross Margin: {grossMargin.pct}% (Profit: {formatRupiah(grossMargin.profit)})
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#82746E' }}>
                    Dihitung otomatis saat stok dipotong
                  </span>
                )}
              </div>
            </div>

            {/* Info Callout */}
            <div className="stitch-info-box">
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9B4428', flexShrink: 0, marginTop: '1px' }}>
                info
              </span>
              <div>
                Stok bahan baku di atas otomatis terpotong saat kasir menyelesaikan pembayaran pesanan <strong>{menuItem.name}</strong> di cabang <strong>{locationName}</strong>.
              </div>
            </div>

          </div>

          {/* ── Modal Action Footer ── */}
          <div className="stitch-modal-footer">
            <div className="stitch-sync-status">
              <span className="pulse-dot"></span>
              <span>
                Terkoneksi Master Sync POS <strong style={{ color: '#31170A' }}>{locationName}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ height: '42px', padding: '0 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}
                onClick={onClose}
                disabled={isSaving}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ height: '42px', padding: '0 22px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 0.8s linear infinite' }}>refresh</span>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                    <span>Simpan Formulasi Resep</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

