// MenuFormModal — Popup Tambah & Edit Menu
// Sesuai desain popup_tambah_edit_menu_resep_bahan_baku
import { useState, useEffect, useRef, useMemo } from 'react';
import { formatRupiah, readFileAsDataURL } from '../../utils/format.js';
import { useToast } from '../ui/Toast.jsx';

export default function MenuFormModal({
  show,
  item = null,
  categories = [],
  sizes = [],
  inventoryList = [],
  onClose,
  onSave
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const isEdit = Boolean(item);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [imageData, setImageData] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [prices, setPrices] = useState({});
  const [recipeRows, setRecipeRows] = useState([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [imgHover, setImgHover] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (item) {
      setName(item.name || '');
      setCategoryId(item.category_id || categories[0]?.id || '');
      setSku(item.sku || `MKN-${String(item.id).padStart(3, '0')}`);
      setDescription(item.description || '');
      setBadge(item.badge || '');
      setImageData(item.image_data || '');
      setIsActive(item.is_active === 1 || item.is_active === true);
      const pMap = {};
      sizes.forEach(s => {
        const found = (item.sizes || []).find(sz => sz.size_id === s.id);
        pMap[s.id] = found ? String(found.price) : '';
      });
      setPrices(pMap);
      if (item.recipeIngredients && item.recipeIngredients.length > 0) {
        setRecipeRows(item.recipeIngredients.map(r => ({ inventoryId: r.inventory_id, quantity: r.quantity })));
      } else {
        setRecipeRows([]);
      }
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setSku(`MKN-${Math.floor(100 + Math.random() * 900)}`);
      setDescription('');
      setBadge('');
      setImageData('');
      setIsActive(true);
      const pMap = {};
      sizes.forEach(s => { pMap[s.id] = ''; });
      setPrices(pMap);
      setRecipeRows([]);
    }
    setRecipeSearch('');
  }, [show, item, categories, sizes]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.warning('Ukuran gambar maksimal 3MB'); return; }
    try {
      const dataURL = await readFileAsDataURL(file);
      setImageData(dataURL);
      toast.info('Foto menu berhasil dimuat');
    } catch { toast.error('Gagal membaca gambar'); }
  };

  const filteredInventoryForRecipe = useMemo(() => {
    if (!recipeSearch.trim()) return inventoryList;
    const q = recipeSearch.toLowerCase();
    return inventoryList.filter(inv =>
      (inv.name || '').toLowerCase().includes(q) ||
      (inv.category || '').toLowerCase().includes(q)
    );
  }, [inventoryList, recipeSearch]);

  const handleAddRecipeRow = () => {
    if (inventoryList.length === 0) {
      toast.warning('Belum ada data bahan baku. Tambahkan di tab "Data Item & Bahan Baku" terlebih dahulu.');
      return;
    }
    setRecipeRows(prev => [...prev, { inventoryId: inventoryList[0].id, quantity: 10 }]);
  };

  const handleUpdateRecipeRow = (index, field, value) => {
    setRecipeRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: field === 'inventoryId' ? Number(value) : parseFloat(value) || 0 };
      return copy;
    });
  };

  const handleRemoveRecipeRow = (index) => {
    setRecipeRows(prev => prev.filter((_, i) => i !== index));
  };

  const estimatedHpp = useMemo(() => {
    let total = 0;
    recipeRows.forEach(row => {
      const inv = inventoryList.find(i => i.id === row.inventoryId);
      if (inv && inv.cost_per_unit > 0 && row.quantity > 0) total += inv.cost_per_unit * row.quantity;
    });
    return total;
  }, [recipeRows, inventoryList]);

  const hppRefSizeLabel = useMemo(() => {
    if (!sizes.length) return 'Regular';
    const ref = sizes.find(s => s.name.toLowerCase().includes('reg') || s.name.toLowerCase().includes('med'));
    return ref ? ref.name : sizes[0]?.name || 'Regular';
  }, [sizes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.warning('Nama menu wajib diisi'); return; }
    const parsedPrices = {};
    let hasPrice = false;
    sizes.forEach(s => {
      const val = parseInt(prices[s.id], 10);
      if (val > 0) { parsedPrices[s.id] = val; hasPrice = true; }
    });
    if (!hasPrice) { toast.warning('Masukkan minimal 1 harga ukuran menu'); return; }
    const validRecipes = recipeRows.filter(r => r.inventoryId && r.quantity > 0)
      .map(r => ({ inventoryId: Number(r.inventoryId), quantity: Number(r.quantity) }));
    onSave({ id: item?.id, name: name.trim(), categoryId: Number(categoryId) || null, sku: sku.trim(), description: description.trim(), badge: badge.trim(), imageData, isActive: isActive ? 1 : 0, prices: parsedPrices, recipes: validRecipes });
  };

  if (!show) return null;

  // Styles
  const sectionBox = { background: '#FDF2E7', padding: '16px', borderRadius: '14px', border: '1px solid rgba(130,79,44,0.10)' };
  const label13 = { fontSize: '13px', fontWeight: 700, color: '#201B15', display: 'block', marginBottom: '6px' };
  const label12 = { fontSize: '12px', fontWeight: 700, color: '#201B15', display: 'block', marginBottom: '4px' };
  const inputBase = { width: '100%', background: '#FDF2E7', border: '1px solid rgba(130,79,44,0.15)', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', color: '#201B15', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const inputSm = { ...inputBase, fontSize: '13px', padding: '9px 12px' };

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal-card menu-bento-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* Header */}
        <div className="pos-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(130,79,44,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A2C1D' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>coffee_maker</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#31170A', margin: 0 }}>
                  {isEdit ? `Edit Menu: ${item.name}` : 'Tambah Menu Baru'}
                </h2>
                <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#FDEBD0', color: '#9B4428', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                  {isEdit ? `ID #MK-${item.id}` : sku || 'ID #MKN'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#50443F', margin: '2px 0 0' }}>
                Lengkapi data menu, varian harga per ukuran, dan integrasi resep bahan baku.
              </p>
            </div>
          </div>
          <button type="button" className="pos-modal-close" onClick={onClose} aria-label="Tutup">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="pos-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Bento Grid: Foto + Info */}
          <div className="menu-modal-bento">
            {/* Foto Menu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={label13}>Foto Menu</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#9B4428' }}>Rasio 4:3 (Maks 3MB)</span>
              </div>

              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#F2E6DC',
                  paddingTop: '75%', // 4:3 ratio
                  border: '1px solid rgba(130,79,44,0.10)',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setImgHover(true)}
                onMouseLeave={() => setImgHover(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageData ? (
                  <img src={imageData} alt="Preview"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: imgHover ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.3s ease' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#82746E', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#9B4428' }}>add_photo_alternate</span>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>Klik untuk pilih foto</span>
                    <span style={{ fontSize: '11px', color: '#82746E', opacity: 0.7 }}>JPG, PNG, WEBP</span>
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)', opacity: imgHover || imageData ? 1 : 0, transition: 'opacity 0.2s ease' }}></div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: imgHover || imageData ? 1 : 0, transition: 'opacity 0.2s ease' }}>
                  <button type="button" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(74,44,29,0.85)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>photo_camera</span>
                    {imageData ? 'Ganti Foto' : 'Pilih Foto'}
                  </button>
                  {imageData && (
                    <button type="button" onClick={e => { e.stopPropagation(); setImageData(''); }}
                      style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </div>

              <p style={{ fontSize: '11px', color: '#50443F', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#4A2C1D' }}>verified</span>
                Tampil di layar display POS & struk digital
              </p>
            </div>

            {/* Info Utama */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Nama */}
              <div>
                <label style={label13}>Nama Menu <span style={{ color: '#DC2626' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type="text" required style={{ ...inputBase, paddingRight: '40px', fontWeight: 700 }}
                    placeholder="Contoh: Kopi Pandan Makna" value={name} onChange={e => setName(e.target.value)} />
                  <span className="material-symbols-outlined" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9B4428', fontSize: '20px', pointerEvents: 'none' }}>local_cafe</span>
                </div>
              </div>

              {/* Kategori + SKU */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={label13}>Kategori Menu</label>
                  <div style={{ position: 'relative' }}>
                    <select style={{ ...inputSm, appearance: 'none', paddingRight: '32px', cursor: 'pointer', fontWeight: 600 }}
                      value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '20px', pointerEvents: 'none' }}>expand_more</span>
                  </div>
                </div>
                <div>
                  <label style={label13}>Kode SKU</label>
                  <input type="text" style={{ ...inputSm, fontFamily: 'monospace' }}
                    placeholder="MKN-SGN-01" value={sku} onChange={e => setSku(e.target.value)} />
                </div>
              </div>

              {/* Badge + Deskripsi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={label12}>Badge Highlight <span style={{ fontWeight: 400, color: '#82746E' }}>(Opsional)</span></label>
                  <input type="text" style={inputSm} placeholder="Best Seller, Favorit..." value={badge} onChange={e => setBadge(e.target.value)} />
                </div>
                <div>
                  <label style={label12}>Deskripsi Singkat</label>
                  <input type="text" style={inputSm} placeholder="Catatan rasa singkat" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
              </div>

              {/* Status Toggle */}
              <div style={{ background: '#FDF2E7', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(130,79,44,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#F2E6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4A2C1D' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#201B15' }}>Status Ketersediaan</div>
                    <div style={{ fontSize: '11px', color: '#50443F' }}>Menu Aktif / Tampil di Kasir</div>
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  <div style={{ width: '48px', height: '26px', borderRadius: '999px', background: isActive ? '#4A2C1D' : '#D0D0D0', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: '3px', left: isActive ? '25px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Harga per Ukuran */}
          <div style={sectionBox}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#4A2C1D', fontSize: '20px' }}>tune</span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#31170A', margin: 0 }}>Harga per Ukuran (Cup Size)</h3>
              </div>
              <span style={{ fontSize: '11px', color: '#50443F' }}>Sinkron dengan tombol kasir</span>
            </div>

            <div className="size-price-grid">
              {sizes.map(s => {
                const isStd = s.name.toLowerCase().includes('reg') || s.name.toLowerCase().includes('med');
                return (
                  <div key={s.id} style={{ background: '#fff', padding: '14px', borderRadius: '12px', boxShadow: '0 1px 4px rgba(74,44,29,0.05)', border: '1px solid rgba(130,79,44,0.06)', position: 'relative' }}>
                    {isStd && <span style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', fontWeight: 700, background: '#FDEBD0', color: '#4A2C1D', padding: '1px 6px', borderRadius: '6px' }}>Standard</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FDF2E7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '13px', color: '#9B4428' }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#201B15' }}>{s.name}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 700, color: '#82746E' }}>Rp</span>
                      <input type="number"
                        style={{ width: '100%', background: '#F7ECE2', border: '1px solid transparent', borderRadius: '8px', padding: '8px 8px 8px 32px', fontWeight: 700, fontSize: '15px', color: '#31170A', outline: 'none', boxSizing: 'border-box' }}
                        placeholder="0" value={prices[s.id] || ''}
                        onChange={e => setPrices(prev => ({ ...prev, [s.id]: e.target.value }))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resep & Bahan Baku */}
          <div style={sectionBox}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#9B4428', fontSize: '20px' }}>inventory_2</span>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#31170A', margin: 0 }}>Resep & Pemakaian Bahan Baku</h3>
                </div>
                <p style={{ fontSize: '12px', color: '#50443F', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Tentukan takaran per porsi agar stok terpotong otomatis di Report penjualan.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: '#DCFCE7', color: '#15803D' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A', animation: 'pulse 1.5s infinite' }}></span>
                <span style={{ fontSize: '11px', fontWeight: 700 }}>Auto-Deduct Aktif</span>
              </div>
            </div>

            {inventoryList.length > 5 && (
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '16px' }}>search</span>
                <input type="text"
                  style={{ width: '100%', paddingLeft: '34px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', background: '#fff', border: '1px solid rgba(130,79,44,0.12)', borderRadius: '10px', fontSize: '12px', color: '#201B15', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Cari bahan baku untuk ditambahkan..."
                  value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} />
              </div>
            )}

            {/* Recipe rows header */}
            {recipeRows.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 40px', gap: '8px', padding: '0 8px', marginBottom: '4px' }}>
                <div style={{ fontSize: '11px', color: '#82746E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bahan Baku (Gudang & Bar)</div>
                <div style={{ fontSize: '11px', color: '#82746E', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Takaran</div>
                <div style={{ fontSize: '11px', color: '#82746E', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Satuan</div>
                <div></div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recipeRows.map((row, idx) => {
                const selectedInv = inventoryList.find(i => i.id === row.inventoryId);
                const invList = recipeSearch.trim() ? filteredInventoryForRecipe : inventoryList;
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 70px 40px', gap: '8px', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '12px', border: '1px solid rgba(130,79,44,0.06)', boxShadow: '0 1px 3px rgba(74,44,29,0.04)' }}>
                    <div style={{ position: 'relative' }}>
                      <select style={{ width: '100%', background: '#F7ECE2', border: '1px solid transparent', borderRadius: '8px', padding: '7px 28px 7px 10px', fontSize: '13px', fontWeight: 500, color: '#201B15', appearance: 'none', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                        value={row.inventoryId} onChange={e => handleUpdateRecipeRow(idx, 'inventoryId', e.target.value)}>
                        {invList.map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.name} (Stok: {inv.current_stock} {inv.unit})</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '18px', pointerEvents: 'none' }}>expand_more</span>
                    </div>
                    <input type="number" min="0" step="any"
                      style={{ background: '#F7ECE2', border: '1px solid transparent', borderRadius: '8px', padding: '7px', fontWeight: 700, fontSize: '15px', color: '#31170A', textAlign: 'center', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      value={row.quantity} onChange={e => handleUpdateRecipeRow(idx, 'quantity', e.target.value)} />
                    <div style={{ background: '#F2E6DC', borderRadius: '8px', padding: '7px 4px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#201B15' }}>
                      {selectedInv?.unit || 'ml'}
                    </div>
                    <button type="button" onClick={() => handleRemoveRecipeRow(idx)}
                      style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                    </button>
                  </div>
                );
              })}

              {recipeRows.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '2px dashed rgba(130,79,44,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#82746E' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.4 }}>inventory_2</span>
                  <span style={{ fontSize: '13px' }}>Belum ada bahan baku yang terhubung ke menu ini.</span>
                </div>
              )}
            </div>

            <button type="button" onClick={handleAddRecipeRow}
              style={{ width: '100%', padding: '10px', borderRadius: '12px', background: '#fff', color: '#4A2C1D', border: '1px solid rgba(130,79,44,0.15)', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', marginTop: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#9B4428' }}>add_circle</span>
              + Tambah Bahan ke Resep
            </button>

            {estimatedHpp > 0 && (
              <div style={{ background: '#F2E6DC', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#9B4428', fontSize: '18px' }}>analytics</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#201B15' }}>Estimasi HPP per Porsi ({hppRefSizeLabel}):</span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#4A2C1D' }}>{formatRupiah(estimatedHpp)} / cup</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(130,79,44,0.10)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#82746E' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
              {isEdit && item?.updated_at ? `Terakhir: ${item.updated_at}` : 'Auto-sinkronisasi SQLite lokal'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }} onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                {isEdit ? 'Simpan Perubahan' : 'Simpan Menu'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
