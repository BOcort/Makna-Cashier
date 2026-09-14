// Kasir page (Home) — Full-screen POS interface matching Stitch design
import { useState, useEffect, useCallback, useMemo } from 'react';
import MenuCard from '../../components/cashier/MenuCard.jsx';
import ItemDetailModal from '../../components/cashier/ItemDetailModal.jsx';
import CartDrawer from '../../components/cashier/CartDrawer.jsx';
import PaymentModal from '../../components/cashier/PaymentModal.jsx';
import ClosingModal from '../../components/cashier/ClosingModal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useLocation } from '../../contexts/LocationContext.jsx';
import { menuQueries, paymentQueries, transactionQueries, closingQueries } from '../../services/queries.js';
import { formatRupiah } from '../../utils/format.js';

let cartItemIdCounter = 0;

export default function Home() {
  const toast = useToast();
  const { activeLocation, sessionOpenedAt, clearLocation } = useLocation();

  // Menu data
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Modals & Drawers state
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);

  // Today's summary
  const [todaySummary, setTodaySummary] = useState({ total_transactions: 0, total_revenue: 0 });
  const [todayByMethod, setTodayByMethod] = useState([]);

  const loadData = useCallback(() => {
    const items = menuQueries.getAllWithPrices();
    setMenuItems(items);
    setPaymentMethods(paymentQueries.getActive());

    if (activeLocation) {
      const summary = transactionQueries.getTodaySummary(activeLocation.id);
      setTodaySummary(summary || { total_transactions: 0, total_revenue: 0 });
      setTodayByMethod(transactionQueries.getTodayByPaymentMethod(activeLocation.id));
    }
  }, [activeLocation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cart totals
  const cartTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const cartTotalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Categorize items
  const categorizedMenus = useMemo(() => {
    const normalize = (catName = '') => catName.toLowerCase().replace('-', ' ').trim();

    const signature = [];
    const coffee = [];
    const nonCoffee = [];
    const snack = [];
    const makanan = [];

    const q = searchQuery.toLowerCase().trim();

    menuItems.forEach((item) => {
      // Filter by search query if present
      if (q) {
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = (item.category_name || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return;
      }

      const cat = normalize(item.category_name);
      if (cat.includes('signature')) {
        signature.push(item);
      } else if (cat.includes('non coffee') || cat.includes('non-coffee')) {
        nonCoffee.push(item);
      } else if (cat.includes('coffee') || cat.includes('kopi') || cat.includes('espresso')) {
        coffee.push(item);
      } else if (cat.includes('snack') || cat.includes('camilan') || cat.includes('pastry')) {
        snack.push(item);
      } else {
        makanan.push(item);
      }
    });

    return { signature, coffee, nonCoffee, snack, makanan };
  }, [menuItems, searchQuery]);

  // Counts for pills
  const counts = useMemo(() => {
    const normalize = (catName = '') => catName.toLowerCase().replace('-', ' ').trim();
    let sig = 0, cof = 0, non = 0, snk = 0, mak = 0;

    menuItems.forEach((m) => {
      const cat = normalize(m.category_name);
      if (cat.includes('signature')) sig++;
      else if (cat.includes('non coffee') || cat.includes('non-coffee')) non++;
      else if (cat.includes('coffee') || cat.includes('kopi') || cat.includes('espresso')) cof++;
      else if (cat.includes('snack') || cat.includes('camilan') || cat.includes('pastry')) snk++;
      else mak++;
    });

    return { all: menuItems.length, signature: sig, coffee: cof, nonCoffee: non, snack: snk, makanan: mak };
  }, [menuItems]);

  // Open item modal on card click
  const handleSelectMenu = (item) => {
    setSelectedItemForModal(item);
    setShowItemModal(true);
  };

  // Add item from modal to cart
  const handleAddToCart = ({ item, selectedSize, quantity, iceLevel, notes, subtotal }) => {
    const newItem = {
      id: ++cartItemIdCounter,
      menuItemId: item.id,
      menuName: item.name,
      sizeId: selectedSize?.size_id || null,
      sizeName: selectedSize?.size_name || 'Regular',
      unitPrice: selectedSize?.price || 0,
      quantity,
      iceLevel,
      notes,
      subtotal,
      imageData: item.image_data || ''
    };

    setCart(prev => [...prev, newItem]);
    toast.success(`${item.name} (${newItem.sizeName}) ditambahkan`);
  };

  // Update item quantity in cart drawer
  const handleUpdateCartQty = (itemId, newQty) => {
    if (newQty <= 0) {
      handleDeleteCartItem(itemId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: newQty,
          subtotal: item.unitPrice * newQty
        };
      }
      return item;
    }));
  };

  // Delete item from cart drawer
  const handleDeleteCartItem = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    toast.info('Item dihapus dari keranjang');
  };

  // Open payment from cart drawer
  const handleProceedPayment = () => {
    if (cart.length === 0) {
      toast.warning('Keranjang masih kosong');
      return;
    }
    setShowPaymentModal(true);
  };

  // Confirm payment in PaymentModal
  const handleConfirmPayment = ({ paidAmount, changeAmount, paymentMethodId, paymentId }) => {
    if (!activeLocation) {
      toast.error('Cabang aktif tidak ditemukan');
      return;
    }

    try {
      transactionQueries.create(
        activeLocation.id,
        paymentMethodId,
        paymentId,
        cartTotalAmount,
        paidAmount,
        changeAmount,
        cart.map(item => ({
          menuItemId: item.menuItemId,
          sizeId: item.sizeId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          menuName: item.menuName,
          sizeName: item.sizeName
        }))
      );

      setCart([]);
      setShowPaymentModal(false);
      setShowCartDrawer(false);
      loadData();
      toast.success('🎉 Transaksi Berhasil & Struk Tercetak!');
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Gagal memproses transaksi');
    }
  };

  // Closing
  const handleClosing = () => {
    if (!activeLocation) return;
    const summary = transactionQueries.getTodaySummary(activeLocation.id);
    const byMethod = transactionQueries.getTodayByPaymentMethod(activeLocation.id);
    setTodaySummary(summary || { total_transactions: 0, total_revenue: 0 });
    setTodayByMethod(byMethod);
    setShowClosingModal(true);
  };

  const handleConfirmClosing = () => {
    if (!activeLocation) return;
    closingQueries.create(activeLocation.id, sessionOpenedAt || new Date().toISOString());
    setShowClosingModal(false);
    clearLocation();
    toast.success('Kasir berhasil ditutup!');
  };

  const hasAnyResults =
    categorizedMenus.signature.length > 0 ||
    categorizedMenus.coffee.length > 0 ||
    categorizedMenus.nonCoffee.length > 0 ||
    categorizedMenus.snack.length > 0 ||
    categorizedMenus.makanan.length > 0;

  return (
    <div className="pos-page-wrapper">
      {/* ── Top Sticky Command & Filter Bar ── */}
      <div className="pos-top-bar">
        <div className="pos-top-bar-inner">
          {/* Search Box */}
          <div className="pos-search-box">
            <span className="material-symbols-outlined pos-search-icon">search</span>
            <input
              type="text"
              className="pos-search-input"
              placeholder="Cari menu kopi, makanan, snack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="pos-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Category Navigation Pills */}
          <div className="pos-category-pills">
            <button
              type="button"
              className={`pos-cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <span>Semua</span>
              <span className="pos-pill-count">{counts.all}</span>
            </button>

            <button
              type="button"
              className={`pos-cat-pill ${activeCategory === 'signature' ? 'active' : ''}`}
              onClick={() => setActiveCategory('signature')}
            >
              <span>Signature</span>
              <span className="pos-pill-count">{counts.signature}</span>
            </button>

            <button
              type="button"
              className={`pos-cat-pill ${activeCategory === 'coffee' ? 'active' : ''}`}
              onClick={() => setActiveCategory('coffee')}
            >
              <span>Coffee</span>
              <span className="pos-pill-count">{counts.coffee}</span>
            </button>

            <button
              type="button"
              className={`pos-cat-pill ${activeCategory === 'non-coffee' ? 'active' : ''}`}
              onClick={() => setActiveCategory('non-coffee')}
            >
              <span>Non Coffee</span>
              <span className="pos-pill-count">{counts.nonCoffee}</span>
            </button>

            <button
              type="button"
              className={`pos-cat-pill ${activeCategory === 'snack' ? 'active' : ''}`}
              onClick={() => setActiveCategory('snack')}
            >
              <span>Snack</span>
              <span className="pos-pill-count">{counts.snack}</span>
            </button>

            <button
              type="button"
              className={`pos-cat-pill ${activeCategory === 'makanan' ? 'active' : ''}`}
              onClick={() => setActiveCategory('makanan')}
            >
              <span>Makanan</span>
              <span className="pos-pill-count">{counts.makanan}</span>
            </button>
          </div>

          {/* Closing & Quick Info Action */}
          <div className="pos-top-actions">
            <button
              type="button"
              className="pos-closing-trigger-btn"
              onClick={handleClosing}
              title="Tutup Kasir Harian (Shift Closing)"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Tutup Kasir</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Catalog Grid Container ── */}
      <main className="pos-catalog-container">
        {!hasAnyResults ? (
          <div className="pos-no-results">
            <span className="material-symbols-outlined text-5xl text-amber-900/40 mb-2">search_off</span>
            <h3>Tidak Ada Menu Ditemukan</h3>
            <p>Menu dengan kata kunci "{searchQuery}" tidak tersedia.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="pos-sections-stack">
            {/* 1. SIGNATURE SECTION */}
            {(activeCategory === 'all' || activeCategory === 'signature') && categorizedMenus.signature.length > 0 && (
              <section className="pos-menu-section" id="section-signature">
                <div className="pos-section-header">
                  <div className="pos-section-title-wrap">
                    <span className="material-symbols-outlined text-[#B34433] text-[24px]">stars</span>
                    <h2 className="pos-section-title">Makna Signature</h2>
                    <span className="pos-section-badge">Barista Choice</span>
                  </div>
                  <span className="pos-section-count">{categorizedMenus.signature.length} Kreasi Rasa</span>
                </div>

                <div className="pos-grid-cards">
                  {categorizedMenus.signature.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelectMenu}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 2. ESPRESSO & COFFEE SECTION */}
            {(activeCategory === 'all' || activeCategory === 'coffee') && categorizedMenus.coffee.length > 0 && (
              <section className="pos-menu-section" id="section-coffee">
                <div className="pos-section-header">
                  <div className="pos-section-title-wrap">
                    <span className="material-symbols-outlined text-[#3D2617] text-[24px]">coffee</span>
                    <h2 className="pos-section-title">Espresso & Coffee</h2>
                  </div>
                  <span className="pos-section-count">{categorizedMenus.coffee.length} Pilihan Menu</span>
                </div>

                <div className="pos-grid-cards">
                  {categorizedMenus.coffee.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelectMenu}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 3. NON-COFFEE SECTION */}
            {(activeCategory === 'all' || activeCategory === 'non-coffee') && categorizedMenus.nonCoffee.length > 0 && (
              <section className="pos-menu-section" id="section-non-coffee">
                <div className="pos-section-header">
                  <div className="pos-section-title-wrap">
                    <span className="material-symbols-outlined text-[#824F2C] text-[24px]">local_bar</span>
                    <h2 className="pos-section-title">Non Coffee Series</h2>
                  </div>
                  <span className="pos-section-count">{categorizedMenus.nonCoffee.length} Pilihan Menu</span>
                </div>

                <div className="pos-grid-cards">
                  {categorizedMenus.nonCoffee.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelectMenu}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 4. SNACK SECTION */}
            {(activeCategory === 'all' || activeCategory === 'snack') && categorizedMenus.snack.length > 0 && (
              <section className="pos-menu-section" id="section-snack">
                <div className="pos-section-header">
                  <div className="pos-section-title-wrap">
                    <span className="material-symbols-outlined text-[#C67E36] text-[24px]">bakery_dining</span>
                    <h2 className="pos-section-title">Camilan & Snack</h2>
                  </div>
                  <span className="pos-section-count">{categorizedMenus.snack.length} Pilihan Menu</span>
                </div>

                <div className="pos-grid-cards">
                  {categorizedMenus.snack.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelectMenu}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* 5. MAKANAN UTAMA SECTION */}
            {(activeCategory === 'all' || activeCategory === 'makanan') && categorizedMenus.makanan.length > 0 && (
              <section className="pos-menu-section" id="section-makanan">
                <div className="pos-section-header">
                  <div className="pos-section-title-wrap">
                    <span className="material-symbols-outlined text-[#3D2617] text-[24px]">dinner_dining</span>
                    <h2 className="pos-section-title">Makanan Utama</h2>
                  </div>
                  <span className="pos-section-count">{categorizedMenus.makanan.length} Pilihan Menu</span>
                </div>

                <div className="pos-grid-cards">
                  {categorizedMenus.makanan.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelectMenu}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* ── FLOATING TRIGGER KERANJANG (Pojok Bawah Kanan di Atas Navbar) ── */}
      <div className="pos-floating-cart-anchor">
        <button
          type="button"
          className="pos-floating-cart-btn"
          onClick={() => setShowCartDrawer(true)}
          aria-label="Buka Keranjang Pesanan"
        >
          <div className="pos-floating-cart-icon-wrap">
            <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
            {cartTotalCount > 0 && (
              <span className="pos-floating-cart-badge">{cartTotalCount}</span>
            )}
          </div>
          <div className="pos-floating-cart-info">
            <span className="pos-floating-cart-label">Keranjang Pesanan</span>
            <span className="pos-floating-cart-total">{formatRupiah(cartTotalAmount)}</span>
          </div>
          <span className="material-symbols-outlined text-[20px] ml-1">chevron_right</span>
        </button>
      </div>

      {/* ── MODALS & DRAWERS ── */}

      {/* 1. Item Detail & Customization Modal */}
      <ItemDetailModal
        show={showItemModal}
        item={selectedItemForModal}
        onClose={() => setShowItemModal(false)}
        onAddToCart={handleAddToCart}
      />

      {/* 2. Right Slide-In Cart Drawer */}
      <CartDrawer
        show={showCartDrawer}
        cart={cart}
        activeLocation={activeLocation}
        onClose={() => setShowCartDrawer(false)}
        onUpdateQty={handleUpdateCartQty}
        onDeleteItem={handleDeleteCartItem}
        onProceedPayment={handleProceedPayment}
      />

      {/* 3. Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
        totalAmount={cartTotalAmount}
        paymentMethods={paymentMethods}
        activeLocation={activeLocation}
      />

      {/* 4. Shift Closing Modal */}
      <ClosingModal
        show={showClosingModal}
        onClose={() => setShowClosingModal(false)}
        onConfirm={handleConfirmClosing}
        summary={todaySummary}
        byPaymentMethod={todayByMethod}
        openedAt={sessionOpenedAt}
      />
    </div>
  );
}
