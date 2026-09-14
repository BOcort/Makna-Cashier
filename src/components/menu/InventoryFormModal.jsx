// InventoryFormModal — Modal Tambah & Edit Item Bahan Baku (Master Data)
// Sesuai desain popup_tambah_edit_menu_item
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../ui/Toast.jsx';

const RAW_CATEGORIES = [
  'Flavour Syrup & Cordial',
  'Coffee Beans (Biji Kopi)',
  'Dairy Milk & Plant-Based',
  'Sweetener & Gula Aren',
  'Tea Leaves & Powder Matcha/Choco',
  'Snack & Food Ingredients',
  'Packaging, Cup & Straw',
  'Gourmet Oil & Seasoning',
  'Garnish & Topping',
  'Lainnya'
];

const STORAGE_LOCATIONS = [
  { key: 'Bar POS', label: 'Bar POS', icon: 'table_bar' },
  { key: 'Gudang', label: 'Gudang', icon: 'warehouse' },
  { key: 'Chiller', label: 'Chiller', icon: 'ac_unit' }
];

const RAW_UNITS = ['ml', 'gr', 'pcs', 'shot', 'botol', 'pack'];

// Helper to get category icon
function getCategoryIcon(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('syrup') || c.includes('sirup') || c.includes('cordial')) return 'liquor';
  if (c.includes('bean') || c.includes('kopi')) return 'coffee';
  if (c.includes('milk') || c.includes('susu') || c.includes('dairy') || c.includes('plant')) return 'local_cafe';
  if (c.includes('sweet') || c.includes('aren') || c.includes('gula')) return 'water_drop';
  if (c.includes('tea') || c.includes('matcha') || c.includes('powder') || c.includes('choco')) return 'spa';
  if (c.includes('oil') || c.includes('truffle') || c.includes('seasoning') || c.includes('gourmet')) return 'science';
  if (c.includes('food') || c.includes('snack') || c.includes('ingredient')) return 'restaurant';
  if (c.includes('garnish') || c.includes('topping')) return 'eco';
  if (c.includes('packaging') || c.includes('cup') || c.includes('straw')) return 'coffee_maker';
  return 'inventory_2';
}

export default function InventoryFormModal({
  show,
  item = null,
  activeLocation = null,
  onClose,
  onSave
}) {
  const toast = useToast();
  const isEdit = Boolean(item);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(RAW_CATEGORIES[0]);
  const [storageLocation, setStorageLocation] = useState('Bar POS');
  const [unit, setUnit] = useState('ml');
  const [currentStock, setCurrentStock] = useState('1500');
  const [minStock, setMinStock] = useState('300');
  const [purchasePrice, setPurchasePrice] = useState('85000');
  const [packageSize, setPackageSize] = useState('1000');
  const [costPerUnit, setCostPerUnit] = useState('85');
  const [manualCostOverride, setManualCostOverride] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!show) return;

    if (item) {
      setSku(item.sku || `MAT-${String(item.id).padStart(3, '0')}`);
      setName(item.name || '');
      setCategory(item.category || RAW_CATEGORIES[0]);
      setStorageLocation(item.storage_location || 'Bar POS');
      setUnit(item.unit || 'ml');
      setCurrentStock(item.current_stock !== undefined ? String(item.current_stock) : '0');
      setMinStock(item.min_stock !== undefined ? String(item.min_stock) : '0');
      setPurchasePrice(item.purchase_price ? String(item.purchase_price) : '');
      setPackageSize(item.package_size ? String(item.package_size) : '');
      setCostPerUnit(item.cost_per_unit !== undefined ? String(item.cost_per_unit) : '0');
      setManualCostOverride(true);
      setSupplier(item.supplier || '');
      setExpiryDate(item.expiry_date || '');
    } else {
      const randomId = Math.floor(100 + Math.random() * 900);
      setSku(`MAT-${randomId}`);
      setName('');
      setCategory(RAW_CATEGORIES[0]);
      setStorageLocation('Bar POS');
      setUnit('ml');
      setCurrentStock('1500');
      setMinStock('300');
      setPurchasePrice('85000');
      setPackageSize('1000');
      setCostPerUnit('85');
      setManualCostOverride(false);
      setSupplier('Toffin Papua Distributor - Jayapura');
      setExpiryDate('');
    }
    setIsSaving(false);
  }, [show, item]);

  // Real-time calculation of cost per unit if not manually overridden
  const handlePriceChange = (val) => {
    setPurchasePrice(val);
    const p = parseFloat(val) || 0;
    const s = parseFloat(packageSize) || 0;
    if (s > 0 && !manualCostOverride) {
      const calc = Math.round((p / s) * 100) / 100;
      setCostPerUnit(String(calc));
    }
  };

  const handleSizeChange = (val) => {
    setPackageSize(val);
    const s = parseFloat(val) || 0;
    const p = parseFloat(purchasePrice) || 0;
    if (s > 0 && !manualCostOverride) {
      const calc = Math.round((p / s) * 100) / 100;
      setCostPerUnit(String(calc));
    }
  };

  const handleCostPerUnitChange = (val) => {
    setCostPerUnit(val);
    setManualCostOverride(true);
  };

  // Recipe sample calculation note
  const recipeSampleText = useMemo(() => {
    const cost = parseFloat(costPerUnit) || 0;
    if (unit === 'ml') {
      const sampleCost = Math.round(cost * 20);
      return `Resep 20ml = Rp ${sampleCost.toLocaleString('id-ID')}`;
    }
    if (unit === 'gr') {
      const sampleCost = Math.round(cost * 18);
      return `Resep 18gr = Rp ${sampleCost.toLocaleString('id-ID')}`;
    }
    if (unit === 'shot') {
      return `Resep 1 shot = Rp ${Math.round(cost).toLocaleString('id-ID')}`;
    }
    return `Resep 1 ${unit} = Rp ${Math.round(cost).toLocaleString('id-ID')}`;
  }, [costPerUnit, unit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Nama bahan baku wajib diisi');
      return;
    }

    setIsSaving(true);

    const payload = {
      id: item?.id,
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      currentStock: parseFloat(currentStock) || 0,
      minStock: parseFloat(minStock) || 0,
      costPerUnit: parseFloat(costPerUnit) || 0,
      sku: sku.trim(),
      purchasePrice: parseFloat(purchasePrice) || 0,
      packageSize: parseFloat(packageSize) || 0,
      storageLocation: storageLocation.trim(),
      supplier: supplier.trim(),
      expiryDate: expiryDate.trim()
    };

    setTimeout(() => {
      onSave(payload);
    }, 250);
  };

  if (!show) return null;

  const catIcon = getCategoryIcon(category);
  const locationName = activeLocation?.name || 'Cabang Abepura';

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div
        className="stitch-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stitch-inv-modal-title"
      >
        {/* ── Modal Header ── */}
        <div className="stitch-modal-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div className="stitch-header-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '26px', color: '#9B4428' }}>
                {catIcon}
              </span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                <h2 id="stitch-inv-modal-title" style={{ fontSize: '18px', fontWeight: 800, color: '#31170A', margin: 0, letterSpacing: '-0.3px' }}>
                  {isEdit ? `Edit Item: ${item.name}` : 'Tambah Item Bahan Baku'}
                </h2>
                <span className="stitch-badge-pill">
                  {isEdit ? sku : 'Master Stok'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#50443F', margin: 0, lineHeight: 1.4, maxWidth: '440px' }}>
                Daftarkan bahan baku mentah baru untuk integrasi resep menu, tracking stok real-time, dan estimasi HPP akurat di {locationName}.
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

        {/* ── Modal Body (Scrollable Sections) ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="stitch-modal-body">

            {/* ════ SECTION 1: Informasi Dasar Bahan Baku ════ */}
            <div>
              <div className="stitch-section-header">
                <div className="stitch-section-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9B4428' }}>badge</span>
                  <span>1. Informasi Dasar Bahan Baku</span>
                </div>
                <span className="stitch-section-subtitle" style={{ color: '#9B4428', fontWeight: 600 }}>*Wajib diisi</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px' }}>
                {/* Kode SKU */}
                <div style={{ gridColumn: 'span 4' }}>
                  <label className="stitch-label">
                    <span>Kode SKU</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#9B4428', background: '#F7ECE2', padding: '1px 6px', borderRadius: '4px' }}>Auto ID</span>
                  </label>
                  <div className="stitch-input-readonly">
                    <span>{sku}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#82746E' }}>lock</span>
                  </div>
                </div>

                {/* Nama Bahan Baku */}
                <div style={{ gridColumn: 'span 8' }}>
                  <label className="stitch-label">
                    <span>Nama Item Bahan Baku *</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="stitch-input"
                    placeholder="cth. Sirup Salted Caramel, Susu Oat..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Kategori Klasifikasi */}
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="stitch-label">Kategori Klasifikasi</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      className="stitch-input"
                      style={{ appearance: 'none', paddingRight: '36px', cursor: 'pointer', fontWeight: 600 }}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {RAW_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '20px', pointerEvents: 'none' }}>
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Alokasi Penempatan Fisik */}
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="stitch-label">Alokasi Penempatan Fisik</label>
                  <div className="stitch-segmented-group" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {STORAGE_LOCATIONS.map((loc) => (
                      <button
                        key={loc.key}
                        type="button"
                        className={`stitch-segmented-btn ${storageLocation === loc.key ? 'active' : ''}`}
                        onClick={() => setStorageLocation(loc.key)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{loc.icon}</span>
                        <span>{loc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ════ SECTION 2: Inventaris Stok & Takaran Resep ════ */}
            <div>
              <div className="stitch-section-header">
                <div className="stitch-section-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9B4428' }}>scale</span>
                  <span>2. Inventaris Stok & Takaran Resep</span>
                </div>
                <span className="stitch-section-subtitle">Unit acuan pengurangan otomatis</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px' }}>
                {/* Satuan Resep Pokok */}
                <div style={{ gridColumn: 'span 5' }}>
                  <label className="stitch-label">Satuan Resep Pokok (Unit)</label>
                  <div className="stitch-segmented-group" style={{ gridTemplateColumns: `repeat(${RAW_UNITS.length}, 1fr)` }}>
                    {RAW_UNITS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={`stitch-segmented-btn ${unit === u ? 'active-primary' : ''}`}
                        onClick={() => setUnit(u)}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stok Awal Tersedia */}
                <div style={{ gridColumn: 'span 3' }}>
                  <label className="stitch-label">Stok Fisik Tersedia</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      className="stitch-input"
                      style={{ paddingRight: '40px', fontWeight: 800, fontSize: '15px', color: '#31170A' }}
                      value={currentStock}
                      onChange={(e) => setCurrentStock(e.target.value)}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#82746E' }}>
                      {unit}
                    </span>
                  </div>
                </div>

                {/* Batas Minimum Alert */}
                <div style={{ gridColumn: 'span 4' }}>
                  <label className="stitch-label" style={{ color: '#9B4428' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>notifications_active</span>
                      Batas Min. Peringatan
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="stitch-input"
                      style={{ paddingRight: '40px', fontWeight: 800, fontSize: '15px', color: '#9B4428', borderColor: 'rgba(155, 68, 40, 0.25)' }}
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#9B4428' }}>
                      {unit}
                    </span>
                  </div>
                </div>

                {/* Contextual Info Note */}
                <div style={{ gridColumn: 'span 12' }}>
                  <div className="stitch-info-box">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9B4428', flexShrink: 0, marginTop: '1px' }}>
                      info
                    </span>
                    <div>
                      Sistem Makna POS otomatis memberi label merah <strong style={{ color: '#9B4428' }}>"Stok Menipis"</strong> di kasir & inventory jika stok kurang dari <strong>{minStock || 0} {unit}</strong>.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ════ SECTION 3: Biaya Pembelian & Kalkulasi HPP ════ */}
            <div>
              <div className="stitch-section-header">
                <div className="stitch-section-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9B4428' }}>payments</span>
                  <span>3. Biaya Pembelian & Kalkulasi HPP</span>
                </div>
                <span className="stitch-section-subtitle" style={{ color: '#9B4428', fontWeight: 700 }}>Real-time Calculation</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px' }}>
                {/* Harga Beli Kemasan Baru (Bruto) */}
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="stitch-label">Harga Beli Kemasan Baru (Bruto)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', fontWeight: 700, color: '#82746E' }}>
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="stitch-input"
                      style={{ paddingLeft: '38px', fontWeight: 800, fontSize: '15px' }}
                      placeholder="85000"
                      value={purchasePrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Netto / Isi per Kemasan */}
                <div style={{ gridColumn: 'span 6' }}>
                  <label className="stitch-label">Netto / Isi per Kemasan</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="stitch-input"
                      style={{ paddingRight: '40px', fontWeight: 800, fontSize: '15px' }}
                      placeholder="1000"
                      value={packageSize}
                      onChange={(e) => handleSizeChange(e.target.value)}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#82746E' }}>
                      {unit}
                    </span>
                  </div>
                </div>

                {/* Bento Highlight HPP Calculation Card */}
                <div style={{ gridColumn: 'span 12' }}>
                  <div className="stitch-hpp-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div className="stitch-hpp-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>calculate</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9B4428', display: 'block' }}>
                          Estimasi Biaya Resep (HPP Pokok)
                        </span>
                        <span style={{ fontSize: '12px', color: '#50443F' }}>
                          Biaya dihitung otomatis untuk setiap 1 takaran porsi menu.
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="stitch-hpp-amount">
                        Rp {Number(costPerUnit || 0).toLocaleString('id-ID')}
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#82746E', marginLeft: '4px' }}>/ {unit}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#9B4428' }}>
                        {recipeSampleText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ════ SECTION 4: Supplier & Kadaluarsa (Opsional) ════ */}
            <div>
              <div className="stitch-section-header">
                <div className="stitch-section-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#50443F' }}>local_shipping</span>
                  <span>4. Supplier & Kadaluarsa (Opsional)</span>
                </div>
                <span className="stitch-section-subtitle">Metadata Stok</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '12px' }}>
                {/* Distributor / Vendor */}
                <div style={{ gridColumn: 'span 7' }}>
                  <label className="stitch-label">Distributor / Vendor Resmi</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '18px' }}>
                      storefront
                    </span>
                    <input
                      type="text"
                      className="stitch-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="Nama supplier bahan..."
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                    />
                  </div>
                </div>

                {/* Perkiraan Expired Date */}
                <div style={{ gridColumn: 'span 5' }}>
                  <label className="stitch-label">Perkiraan Expired Date</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '18px' }}>
                      event
                    </span>
                    <input
                      type="text"
                      className="stitch-input"
                      style={{ paddingLeft: '36px' }}
                      placeholder="cth. 24 Nov 2027"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
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
                    <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Bahan Baku'}</span>
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
