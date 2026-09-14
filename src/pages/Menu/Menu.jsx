// Kelola Menu & Inventaris Resep Page — Makna Coffee POS
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '../../components/ui/Toast.jsx';
import { useLocation } from '../../contexts/LocationContext.jsx';
import { formatRupiah } from '../../utils/format.js';
import {
  menuQueries,
  categoryQueries,
  sizeQueries,
  inventoryQueries,
  recipeQueries
} from '../../services/queries.js';

import MenuFormModal from '../../components/menu/MenuFormModal.jsx';
import InventoryFormModal from '../../components/menu/InventoryFormModal.jsx';
import RecipeQuickModal from '../../components/menu/RecipeQuickModal.jsx';

export default function Menu() {
  const toast = useToast();
  const { activeLocation } = useLocation();

  const [activeMainTab, setActiveMainTab] = useState('katalog');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilterCategory, setMenuFilterCategory] = useState('all');
  const [rawSearch, setRawSearch] = useState('');

  const [menuList, setMenuList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);

  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [showRecipeQuickModal, setShowRecipeQuickModal] = useState(false);
  const [recipeQuickMenuItem, setRecipeQuickMenuItem] = useState(null);

  const sectionKatalogRef = useRef(null);
  const sectionBahanRef = useRef(null);

  const loadData = useCallback(() => {
    try {
      const menus = menuQueries.getAllWithDetails();
      const cats = categoryQueries.getAll();
      const szs = sizeQueries.getAll();
      const invs = inventoryQueries.getAllWithUsage(activeLocation?.id || null);
      setMenuList(menus);
      setCategories(cats);
      setSizes(szs);
      setInventoryList(invs);
    } catch (err) {
      console.error('Failed to load menu data:', err);
      toast.error('Gagal memuat data menu');
    }
  }, [activeLocation]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSwitchTab = (tab) => {
    setActiveMainTab(tab);
    setTimeout(() => {
      if (tab === 'katalog') {
        sectionKatalogRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        sectionBahanRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const activeMenuCount = useMemo(() =>
    menuList.filter(m => m.is_active === 1 || m.is_active === true).length,
  [menuList]);

  const categoryCounts = useMemo(() => {
    const normalize = (catName = '') => catName.toLowerCase().replace('-', ' ').trim();
    let cof = 0, non = 0, sig = 0, snk = 0;
    menuList.forEach(m => {
      const cat = normalize(m.category_name);
      if (cat.includes('signature')) sig++;
      else if (cat.includes('non coffee') || cat.includes('non-coffee')) non++;
      else if (cat.includes('coffee') || cat.includes('kopi') || cat.includes('espresso')) cof++;
      else snk++;
    });
    return { all: menuList.length, coffee: cof, nonCoffee: non, signature: sig, snack: snk };
  }, [menuList]);

  const filteredMenuList = useMemo(() => {
    const q = menuSearch.toLowerCase().trim();
    const normalize = (catName = '') => catName.toLowerCase().replace('-', ' ').trim();
    return menuList.filter(item => {
      if (menuFilterCategory !== 'all') {
        const cat = normalize(item.category_name);
        if (menuFilterCategory === 'coffee' && (!cat.includes('coffee') || cat.includes('non'))) return false;
        if (menuFilterCategory === 'non-coffee' && !cat.includes('non')) return false;
        if (menuFilterCategory === 'signature' && !cat.includes('signature')) return false;
        if (menuFilterCategory === 'snack-makanan' && !cat.includes('snack') && !cat.includes('makan') && !cat.includes('pastry')) return false;
      }
      if (q) {
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchCat = (item.category_name || '').toLowerCase().includes(q);
        const matchSku = (item.sku || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchSku) return false;
      }
      return true;
    });
  }, [menuList, menuSearch, menuFilterCategory]);

  const filteredInventoryList = useMemo(() => {
    const q = rawSearch.toLowerCase().trim();
    if (!q) return inventoryList;
    return inventoryList.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.unit || '').toLowerCase().includes(q)
    );
  }, [inventoryList, rawSearch]);

  const handleOpenAddMenu = () => { setEditingMenuItem(null); setShowMenuModal(true); };
  const handleOpenEditMenu = (item) => { setEditingMenuItem(item); setShowMenuModal(true); };
  const handleOpenRecipeQuick = (item) => { setRecipeQuickMenuItem(item); setShowRecipeQuickModal(true); };

  const handleSaveMenu = ({ id, name, categoryId, sku, description, badge, imageData, isActive, prices, recipes }) => {
    try {
      let menuId = id;
      if (id) {
        menuQueries.update(id, name, categoryId, imageData, description, badge, sku);
      } else {
        menuId = menuQueries.create(name, categoryId, imageData, description, badge, sku);
      }
      sizes.forEach(s => {
        const p = prices[s.id];
        if (p && p > 0) menuQueries.setSize(menuId, s.id, p);
        else menuQueries.removeSize(menuId, s.id);
      });
      recipeQueries.setAll(menuId, recipes);
      setShowMenuModal(false);
      loadData();
      toast.success(id ? 'Menu berhasil diperbarui!' : 'Menu baru berhasil ditambahkan!');
    } catch (err) {
      console.error('Failed to save menu:', err);
      toast.error('Gagal menyimpan menu');
    }
  };

  const handleToggleMenuStatus = (item) => {
    try {
      const newStatus = item.is_active === 1 || item.is_active === true ? 0 : 1;
      menuQueries.toggleActive(item.id, newStatus);
      loadData();
      toast.info(`Status "${item.name}" diubah ke ${newStatus ? 'Tersedia' : 'Non-Aktif'}`);
    } catch (err) {
      toast.error('Gagal mengubah status ketersediaan');
    }
  };

  const handleDeleteMenu = (item) => {
    if (window.confirm(`Hapus menu "${item.name}" beserta konfigurasi resepnya?`)) {
      try {
        menuQueries.delete(item.id);
        loadData();
        toast.success('Menu berhasil dihapus');
      } catch (err) {
        toast.error('Gagal menghapus menu');
      }
    }
  };

  const handleSaveQuickRecipe = (menuItemId, recipeList) => {
    try {
      recipeQueries.setAll(menuItemId, recipeList);
      setShowRecipeQuickModal(false);
      loadData();
      toast.success('Formulasi resep berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal menyimpan resep');
    }
  };

  const handleOpenAddInventory = () => { setEditingInventoryItem(null); setShowInventoryModal(true); };
  const handleOpenEditInventory = (item) => { setEditingInventoryItem(item); setShowInventoryModal(true); };

  const handleSaveInventory = ({ id, name, category, unit, currentStock, minStock, costPerUnit, sku, purchasePrice, packageSize, storageLocation, supplier, expiryDate }) => {
    try {
      const extra = { sku, purchasePrice, packageSize, storageLocation, supplier, expiryDate };
      if (id) {
        inventoryQueries.update(id, name, category, unit, currentStock, minStock, costPerUnit, extra);
      } else {
        inventoryQueries.create(name, category, unit, currentStock, minStock, costPerUnit, activeLocation?.id || null, extra);
      }
      setShowInventoryModal(false);
      loadData();
      toast.success(id ? 'Bahan baku diperbarui!' : 'Bahan baku baru ditambahkan!');
    } catch (err) {
      console.error('Failed to save inventory:', err);
      toast.error('Gagal menyimpan bahan baku');
    }
  };

  const handleDeleteInventory = (item) => {
    if (window.confirm(`Hapus bahan baku "${item.name}"?`)) {
      try {
        inventoryQueries.delete(item.id);
        loadData();
        toast.success('Bahan baku dihapus');
      } catch (err) {
        toast.error('Gagal menghapus bahan baku');
      }
    }
  };

  const getRawIcon = (cat = '') => {
    const c = cat.toLowerCase();
    if (c.includes('syrup') || c.includes('sirup')) return 'liquor';
    if (c.includes('bean') || c.includes('kopi')) return 'coffee';
    if (c.includes('milk') || c.includes('susu') || c.includes('dairy')) return 'local_cafe';
    if (c.includes('sweet') || c.includes('aren') || c.includes('gula')) return 'water_drop';
    if (c.includes('tea') || c.includes('matcha')) return 'spa';
    if (c.includes('oil') || c.includes('truffle')) return 'science';
    if (c.includes('powder') || c.includes('cokelat')) return 'bakery_dining';
    return 'inventory_2';
  };

  const defaultImage = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80';

  return (
    <div className="menu-mgmt-wrapper">
      <div className="menu-mgmt-container">

        {/* ── TOP HEADER CARD ── */}
        <div className="menu-mgmt-header-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#9B4428', display: 'inline-block' }}></span>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: '#9B4428' }}>
                Katalog & Inventarisasi
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#31170A', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              Kelola Menu & Inventaris Resep
            </h1>
            <p style={{ fontSize: '13px', color: '#50443F', margin: 0 }}>
              Atur varian rasa, harga POS, formulasi bahan baku otomatis, serta ketersediaan stok cabang{' '}
              <strong style={{ color: '#31170A' }}>{activeLocation?.name || 'Abepura'}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F2E6DC', padding: '6px', borderRadius: '14px' }}>
            <button
              type="button"
              className={`menu-mgmt-tab-pill ${activeMainTab === 'katalog' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('katalog')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restaurant_menu</span>
              <span>Katalog Menu Kasir</span>
              <span className="menu-mgmt-tab-count">{activeMenuCount} Active</span>
            </button>
            <button
              type="button"
              className={`menu-mgmt-tab-pill ${activeMainTab === 'bahan' ? 'active' : ''}`}
              onClick={() => handleSwitchTab('bahan')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>science</span>
              <span>Data Item & Bahan Baku</span>
              <span className="menu-mgmt-tab-count">{inventoryList.length} Item</span>
            </button>
          </div>
        </div>

        {/* ── SECTION 1: KATALOG MENU ── */}
        <div ref={sectionKatalogRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>

          {/* Toolbar */}
          <div className="menu-toolbar-card">
            <div className="menu-toolbar-left">
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '20px' }}>
                  search
                </span>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    paddingLeft: '42px',
                    paddingRight: menuSearch ? '32px' : '14px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    background: '#FDF2E7',
                    border: '1px solid rgba(130,79,44,0.15)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: '#201B15',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Cari nama menu, kode, kategori..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
                {menuSearch && (
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#82746E', fontSize: '14px' }}
                    onClick={() => setMenuSearch('')}
                  >✕</button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { key: 'all', label: 'Semua', count: categoryCounts.all },
                  { key: 'coffee', label: 'Coffee', count: categoryCounts.coffee },
                  { key: 'non-coffee', label: 'Non Coffee', count: categoryCounts.nonCoffee },
                  { key: 'signature', label: 'Signature', count: categoryCounts.signature },
                  { key: 'snack-makanan', label: 'Snack & Makanan', count: categoryCounts.snack },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    className={`menu-filter-btn ${menuFilterCategory === f.key ? 'active' : ''}`}
                    onClick={() => setMenuFilterCategory(f.key)}
                  >
                    {f.label}<span style={{ marginLeft: '4px', opacity: 0.75 }}>({f.count})</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="btn btn-primary" style={{ padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
              onClick={handleOpenAddMenu}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
              + Tambah Menu Baru
            </button>
          </div>

          {/* Menu Item List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredMenuList.length === 0 ? (
              <div style={{ padding: '56px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(130,79,44,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#FDF2E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'rgba(130,79,44,0.3)' }}>search_off</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#31170A', margin: '0 0 4px' }}>Tidak Ada Menu Ditemukan</h3>
                  <p style={{ fontSize: '13px', color: '#82746E', margin: 0 }}>Coba sesuaikan kata kunci atau filter kategori.</p>
                </div>
                <button type="button" onClick={() => { setMenuSearch(''); setMenuFilterCategory('all'); }}
                  style={{ fontSize: '12px', fontWeight: 700, color: '#9B4428', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span> Reset Filter
                </button>
              </div>
            ) : filteredMenuList.map(item => {
              const isActive = item.is_active === 1 || item.is_active === true;
              return (
                <div key={item.id} className="menu-row-card" style={!isActive ? { opacity: 0.72, background: '#FAFAFA' } : {}}>

                  {/* Foto + Info */}
                  <div className="menu-row-main">
                    {/* Foto */}
                    <div style={{ position: 'relative', width: '96px', height: '96px', borderRadius: '12px', overflow: 'hidden', background: '#F2E6DC', flexShrink: 0, border: '1px solid rgba(130,79,44,0.10)' }}>
                      <img
                        src={item.image_data || defaultImage}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isActive ? 'none' : 'grayscale(40%)' }}
                        onError={e => { e.target.src = defaultImage; }}
                      />
                      {!isActive && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#C0392B', background: 'rgba(255,255,255,0.92)', padding: '1px 6px', borderRadius: '999px' }}>NON-AKTIF</span>
                        </div>
                      )}
                    </div>

                    {/* Detail */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: '999px', background: '#FDEBD0', color: '#9B4428', fontSize: '11px', fontWeight: 700 }}>
                          {item.badge || item.category_name || 'Menu'}
                        </span>
                        <span style={{ color: '#82746E', fontSize: '11px', fontFamily: 'monospace' }}>
                          • SKU: {item.sku || `MKN-${String(item.id).padStart(3, '0')}`}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#31170A', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(item.sizes && item.sizes.length > 0) ? item.sizes.map(sz => (
                          <div key={sz.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#FDF2E7', padding: '3px 10px', borderRadius: '8px', border: '1px solid rgba(130,79,44,0.08)' }}>
                            <span style={{ color: '#82746E', fontSize: '11px', fontWeight: 600 }}>{sz.size_name?.charAt(0) || 'S'}:</span>
                            <span style={{ fontWeight: 700, color: '#201B15', fontSize: '12px' }}>{formatRupiah(sz.price)}</span>
                          </div>
                        )) : (
                          <span style={{ fontSize: '12px', color: '#82746E', fontStyle: 'italic' }}>Harga belum diatur</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recipe Box */}
                  <div className="menu-recipe-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#512900', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>receipt_long</span>
                      <span>{item.recipeCount || 0} Bahan Terhubung:</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#50443F', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.recipeSummary || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Resep belum dikonfigurasi</span>}
                    </p>
                  </div>

                  {/* Status + Actions */}
                  <div className="menu-row-actions">
                    {/* Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#201B15' : '#9E9E9E', lineHeight: 1.2 }}>
                          {isActive ? 'Tersedia' : 'Non-Aktif'}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: isActive ? '#16A34A' : '#DC2626' }}>
                          {isActive ? 'Siap Jual' : 'Stok Kosong'}
                        </div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input type="checkbox" style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                          checked={isActive} onChange={() => handleToggleMenuStatus(item)} />
                        <div style={{
                          width: '48px', height: '24px', borderRadius: '999px', position: 'relative',
                          background: isActive ? '#4A2C1D' : '#D0D0D0', transition: 'background 0.2s ease',
                        }}>
                          <div style={{
                            position: 'absolute', top: '2px',
                            left: isActive ? '26px' : '2px',
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: '#FFFFFF', transition: 'left 0.2s ease',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          }}></div>
                        </div>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button type="button" className="menu-action-btn" title="Kelola Resep" onClick={() => handleOpenRecipeQuick(item)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>science</span>
                      </button>
                      <button type="button" className="menu-action-btn" title="Edit Menu" onClick={() => handleOpenEditMenu(item)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                      <button type="button" className="menu-action-btn danger" title="Hapus Menu" onClick={() => handleDeleteMenu(item)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 2: BAHAN BAKU ── */}
        <div ref={sectionBahanRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '32px', marginTop: '16px' }}>

          <div className="menu-toolbar-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#9B4428', fontSize: '22px' }}>inventory_2</span>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#31170A', margin: 0 }}>Master Item Bahan Baku (Resep)</h2>
              </div>
              <p style={{ fontSize: '13px', color: '#50443F', margin: '2px 0 0' }}>
                Kelola stok bahan baku untuk kalkulasi resep menu otomatis di report dan audit HPP.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', minWidth: '200px' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#82746E', fontSize: '18px' }}>search</span>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    paddingLeft: '36px',
                    paddingRight: '12px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    background: '#FDF2E7',
                    border: '1px solid rgba(130,79,44,0.15)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    color: '#201B15',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Cari item bahan baku..."
                  value={rawSearch}
                  onChange={e => setRawSearch(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-primary" style={{ padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
                onClick={handleOpenAddInventory}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_box</span>
                + Tambah Item Baru
              </button>
            </div>
          </div>

          {filteredInventoryList.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(130,79,44,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(130,79,44,0.2)' }}>inventory_2</span>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#31170A', margin: '0 0 4px' }}>Belum Ada Bahan Baku</h3>
                <p style={{ fontSize: '12px', color: '#82746E', margin: 0 }}>
                  {rawSearch ? 'Tidak ditemukan bahan baku yang cocok.' : 'Tambahkan bahan baku pertama Anda.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="raw-material-grid">
              {filteredInventoryList.map(raw => {
                const isLowStock = raw.min_stock > 0 && raw.current_stock <= raw.min_stock;
                const rawIcon = getRawIcon(raw.category);
                return (
                  <div key={raw.id} className="raw-material-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(218,148,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B4428', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{rawIcon}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#9B4428', background: '#FDF2E7', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                              {raw.sku || `MAT-${String(raw.id).padStart(3, '0')}`}
                            </span>
                            {raw.storage_location && (
                              <span style={{ fontSize: '10px', fontWeight: 600, color: '#50443F', background: '#F2E6DC', padding: '1px 6px', borderRadius: '4px' }}>
                                {raw.storage_location}
                              </span>
                            )}
                          </div>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#31170A', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{raw.name}</h4>
                          <span style={{ fontSize: '11px', color: '#50443F' }}>Kategori: {raw.category || 'General'}</span>
                        </div>
                      </div>
                      <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, flexShrink: 0, background: isLowStock ? '#FEE2E2' : '#DCFCE7', color: isLowStock ? '#B91C1C' : '#15803D' }}>
                        {isLowStock ? 'Stok Rendah' : 'Aman'}
                      </span>
                    </div>

                    <div style={{ background: '#FDF2E7', border: '1px solid rgba(130,79,44,0.08)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#82746E', marginBottom: '2px' }}>Stok Tersedia</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '28px', fontWeight: 900, color: isLowStock ? '#DC2626' : '#31170A', letterSpacing: '-1px', lineHeight: 1 }}>
                            {Number(raw.current_stock).toLocaleString('id-ID')}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#50443F' }}>{raw.unit}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F2E6DC', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#9B4428' }}>
                          <span>Rp {Number(raw.cost_per_unit || 0).toLocaleString('id-ID')} / {raw.unit}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#50443F' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>link</span>
                          <span>Terpakai di: <strong>{raw.menu_count || 0} Menu</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: '#82746E', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>warning</span>
                        Min. Alert: <strong style={{ marginLeft: '2px' }}>{raw.min_stock || 0} {raw.unit}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="menu-action-btn" title="Edit" onClick={() => handleOpenEditInventory(raw)}>
                          <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>edit</span>
                        </button>
                        <button type="button" className="menu-action-btn danger" title="Hapus" onClick={() => handleDeleteInventory(raw)}>
                          <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <MenuFormModal
        show={showMenuModal}
        item={editingMenuItem}
        categories={categories}
        sizes={sizes}
        inventoryList={inventoryList}
        onClose={() => setShowMenuModal(false)}
        onSave={handleSaveMenu}
      />
      <InventoryFormModal
        show={showInventoryModal}
        item={editingInventoryItem}
        activeLocation={activeLocation}
        onClose={() => setShowInventoryModal(false)}
        onSave={handleSaveInventory}
      />
      <RecipeQuickModal
        show={showRecipeQuickModal}
        menuItem={recipeQuickMenuItem}
        inventoryList={inventoryList}
        activeLocation={activeLocation}
        onClose={() => setShowRecipeQuickModal(false)}
        onSave={handleSaveQuickRecipe}
      />
    </div>
  );
}
