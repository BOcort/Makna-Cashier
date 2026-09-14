// Domain-specific query functions for Makna Coffee POS
import { runQuery, execQuery, execSingle, getLastInsertId, scheduleSave, getDatabase } from './db.js';

// ══════════════════════════════════════════
//  USER QUERIES
// ══════════════════════════════════════════

export const userQueries = {
  getAll() {
    return execQuery('SELECT id, username, qr_code, created_at FROM users');
  },

  getByUsername(username) {
    return execSingle('SELECT * FROM users WHERE username = ?', [username]);
  },

  getByQRCode(qrCode) {
    return execSingle('SELECT * FROM users WHERE qr_code = ?', [qrCode]);
  },

  create(username, passwordHash, qrCode = '') {
    runQuery(
      'INSERT INTO users (username, password_hash, qr_code) VALUES (?, ?, ?)',
      [username, passwordHash, qrCode]
    );
    return getLastInsertId();
  },

  updatePassword(id, passwordHash) {
    runQuery('UPDATE users SET password_hash = ?, updated_at = datetime("now","localtime") WHERE id = ?', [passwordHash, id]);
  },

  count() {
    const result = execSingle('SELECT COUNT(*) as cnt FROM users');
    return result?.cnt || 0;
  },

  verifyPassword(username, passwordHash) {
    const user = execSingle(
      'SELECT * FROM users WHERE username = ? AND password_hash = ?',
      [username, passwordHash]
    );
    return user;
  }
};

// ══════════════════════════════════════════
//  LOCATION QUERIES
// ══════════════════════════════════════════

export const locationQueries = {
  getAll() {
    const rows = execQuery('SELECT * FROM locations ORDER BY name');
    return rows.map(r => ({
      ...r,
      latitude: r.latitude || -2.583120,
      longitude: r.longitude || 140.672110,
      plus_code: r.plus_code || 'CMMF+87 Jayapura, Papua',
      phone: r.phone || '+62 812-4829-1092',
      opening_hours: r.opening_hours || '08:00 - 23:00 WIT (Buka)',
      rating: r.rating || 4.9,
      reviews_count: r.reviews_count || 184,
      branch_code: r.branch_code || `OUT-MKNA-${String(r.id).padStart(2, '0')}`,
      status_operasional: r.status_operasional || 'active',
      terminals_count: r.terminals_count || 2
    }));
  },

  getActive() {
    const rows = execQuery('SELECT * FROM locations WHERE is_active = 1 ORDER BY name');
    return rows.map(r => ({
      ...r,
      latitude: r.latitude || -2.583120,
      longitude: r.longitude || 140.672110,
      plus_code: r.plus_code || 'CMMF+87 Jayapura, Papua',
      phone: r.phone || '+62 812-4829-1092',
      opening_hours: r.opening_hours || '08:00 - 23:00 WIT (Buka)',
      rating: r.rating || 4.9,
      reviews_count: r.reviews_count || 184,
      branch_code: r.branch_code || `OUT-MKNA-${String(r.id).padStart(2, '0')}`,
      status_operasional: r.status_operasional || 'active',
      terminals_count: r.terminals_count || 2
    }));
  },

  getById(id) {
    const r = execSingle('SELECT * FROM locations WHERE id = ?', [id]);
    if (!r) return null;
    return {
      ...r,
      latitude: r.latitude || -2.583120,
      longitude: r.longitude || 140.672110,
      plus_code: r.plus_code || 'CMMF+87 Jayapura, Papua',
      phone: r.phone || '+62 812-4829-1092',
      opening_hours: r.opening_hours || '08:00 - 23:00 WIT (Buka)',
      rating: r.rating || 4.9,
      reviews_count: r.reviews_count || 184,
      branch_code: r.branch_code || `OUT-MKNA-${String(r.id).padStart(2, '0')}`,
      status_operasional: r.status_operasional || 'active',
      terminals_count: r.terminals_count || 2
    };
  },

  create(name, address = '', extra = {}) {
    const lat = extra.latitude || -2.583120;
    const lng = extra.longitude || 140.672110;
    const plusCode = extra.plus_code || 'CMMF+87 Jayapura';
    const phone = extra.phone || '+62 812-4829-1092';
    const openingHours = extra.opening_hours || '08:00 - 23:00 WIT (Buka)';
    const rating = extra.rating || 4.9;
    const reviewsCount = extra.reviews_count || 184;
    const branchCode = extra.branch_code || `OUT-MKNA-0${Math.floor(Math.random() * 90) + 10}`;
    const statusOperasional = extra.status_operasional || 'active';
    const terminalsCount = extra.terminals_count || 2;

    try {
      runQuery(
        'INSERT INTO locations (name, address, latitude, longitude, plus_code, phone, opening_hours, rating, reviews_count, branch_code, status_operasional, terminals_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, address, lat, lng, plusCode, phone, openingHours, rating, reviewsCount, branchCode, statusOperasional, terminalsCount]
      );
    } catch {
      runQuery('INSERT INTO locations (name, address) VALUES (?, ?)', [name, address]);
    }
    return getLastInsertId();
  },

  update(id, name, address, extra = {}) {
    const lat = extra.latitude || -2.583120;
    const lng = extra.longitude || 140.672110;
    const plusCode = extra.plus_code || 'CMMF+87 Jayapura';
    const phone = extra.phone || '+62 812-4829-1092';
    const openingHours = extra.opening_hours || '08:00 - 23:00 WIT (Buka)';
    const rating = extra.rating || 4.9;
    const reviewsCount = extra.reviews_count || 184;
    const branchCode = extra.branch_code || `OUT-KTJ-${id}`;
    const statusOperasional = extra.status_operasional || 'active';
    const terminalsCount = extra.terminals_count || 2;

    try {
      runQuery(
        'UPDATE locations SET name = ?, address = ?, latitude = ?, longitude = ?, plus_code = ?, phone = ?, opening_hours = ?, rating = ?, reviews_count = ?, branch_code = ?, status_operasional = ?, terminals_count = ? WHERE id = ?',
        [name, address, lat, lng, plusCode, phone, openingHours, rating, reviewsCount, branchCode, statusOperasional, terminalsCount, id]
      );
    } catch {
      runQuery('UPDATE locations SET name = ?, address = ? WHERE id = ?', [name, address, id]);
    }
  },

  toggleActive(id, isActive) {
    runQuery('UPDATE locations SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  },

  delete(id) {
    runQuery('DELETE FROM locations WHERE id = ?', [id]);
  }
};

// ══════════════════════════════════════════
//  CATEGORY QUERIES
// ══════════════════════════════════════════

export const categoryQueries = {
  getAll() {
    return execQuery('SELECT * FROM categories ORDER BY sort_order, name');
  },

  create(name) {
    const maxOrder = execSingle('SELECT MAX(sort_order) as m FROM categories');
    runQuery('INSERT INTO categories (name, sort_order) VALUES (?, ?)', [name, (maxOrder?.m || 0) + 1]);
    return getLastInsertId();
  },

  update(id, name) {
    runQuery('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
  },

  delete(id) {
    runQuery('DELETE FROM categories WHERE id = ?', [id]);
  }
};

// ══════════════════════════════════════════
//  SIZE QUERIES
// ══════════════════════════════════════════

export const sizeQueries = {
  getAll() {
    return execQuery('SELECT * FROM sizes ORDER BY sort_order');
  },

  create(name) {
    const maxOrder = execSingle('SELECT MAX(sort_order) as m FROM sizes');
    runQuery('INSERT INTO sizes (name, sort_order) VALUES (?, ?)', [name, (maxOrder?.m || 0) + 1]);
    return getLastInsertId();
  },

  update(id, name) {
    runQuery('UPDATE sizes SET name = ? WHERE id = ?', [name, id]);
  },

  delete(id) {
    runQuery('DELETE FROM sizes WHERE id = ?', [id]);
  }
};

// ══════════════════════════════════════════
//  MENU QUERIES
// ══════════════════════════════════════════

export const menuQueries = {
  getAll() {
    return execQuery(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id 
      ORDER BY c.sort_order, m.name
    `);
  },

  getActive() {
    return execQuery(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id 
      WHERE m.is_active = 1 
      ORDER BY c.sort_order, m.name
    `);
  },

  getById(id) {
    return execSingle(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id 
      WHERE m.id = ?
    `, [id]);
  },

  getSizes(menuItemId) {
    return execQuery(`
      SELECT ms.*, s.name as size_name 
      FROM menu_sizes ms 
      JOIN sizes s ON ms.size_id = s.id 
      WHERE ms.menu_item_id = ? 
      ORDER BY s.sort_order
    `, [menuItemId]);
  },

  create(name, categoryId, imageData = '', description = '', badge = '', sku = '') {
    // Try inserting with sku column; if column doesn't exist, fall back without it
    try {
      runQuery(
        'INSERT INTO menu_items (name, category_id, image_data, description, badge, sku) VALUES (?, ?, ?, ?, ?, ?)',
        [name, categoryId, imageData, description, badge, sku]
      );
    } catch {
      runQuery(
        'INSERT INTO menu_items (name, category_id, image_data, description, badge) VALUES (?, ?, ?, ?, ?)',
        [name, categoryId, imageData, description, badge]
      );
    }
    return getLastInsertId();
  },

  update(id, name, categoryId, imageData, description = '', badge = '', sku = '') {
    try {
      runQuery(
        'UPDATE menu_items SET name = ?, category_id = ?, image_data = ?, description = ?, badge = ?, sku = ?, updated_at = datetime("now","localtime") WHERE id = ?',
        [name, categoryId, imageData, description, badge, sku, id]
      );
    } catch {
      runQuery(
        'UPDATE menu_items SET name = ?, category_id = ?, image_data = ?, description = ?, badge = ?, updated_at = datetime("now","localtime") WHERE id = ?',
        [name, categoryId, imageData, description, badge, id]
      );
    }
  },

  setSize(menuItemId, sizeId, price) {
    // Upsert
    const existing = execSingle(
      'SELECT id FROM menu_sizes WHERE menu_item_id = ? AND size_id = ?',
      [menuItemId, sizeId]
    );
    if (existing) {
      runQuery('UPDATE menu_sizes SET price = ? WHERE id = ?', [price, existing.id]);
    } else {
      runQuery(
        'INSERT INTO menu_sizes (menu_item_id, size_id, price) VALUES (?, ?, ?)',
        [menuItemId, sizeId, price]
      );
    }
  },

  removeSize(menuItemId, sizeId) {
    runQuery('DELETE FROM menu_sizes WHERE menu_item_id = ? AND size_id = ?', [menuItemId, sizeId]);
  },

  toggleActive(id, isActive) {
    runQuery('UPDATE menu_items SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  },

  delete(id) {
    runQuery('DELETE FROM menu_sizes WHERE menu_item_id = ?', [id]);
    runQuery('DELETE FROM recipes WHERE menu_item_id = ?', [id]);
    runQuery('DELETE FROM menu_items WHERE id = ?', [id]);
  },

  // Get all menu items with their prices formatted
  getAllWithPrices() {
    const items = this.getActive();
    return items.map(item => {
      const sizes = this.getSizes(item.id);
      return { ...item, sizes };
    });
  },

  // Get all menu items with sizes + recipe summary for the Menu management page
  getAllWithDetails() {
    const items = execQuery(`
      SELECT m.*, c.name as category_name 
      FROM menu_items m 
      LEFT JOIN categories c ON m.category_id = c.id 
      ORDER BY c.sort_order, m.name
    `);

    return items.map(item => {
      // Get sizes
      const sizes = execQuery(`
        SELECT ms.*, s.name as size_name 
        FROM menu_sizes ms 
        JOIN sizes s ON ms.size_id = s.id 
        WHERE ms.menu_item_id = ? 
        ORDER BY s.sort_order
      `, [item.id]);

      // Get recipe ingredients
      const recipeIngredients = execQuery(`
        SELECT r.*, i.name as ingredient_name, i.unit, i.current_stock,
               COALESCE(i.cost_per_unit, 0) as cost_per_unit
        FROM recipes r 
        JOIN inventory i ON r.inventory_id = i.id 
        WHERE r.menu_item_id = ?
      `, [item.id]);

      // Build recipe summary text
      const recipeSummary = recipeIngredients
        .map(r => `${r.ingredient_name} ${r.quantity}${r.unit}`)
        .join(', ');

      return {
        ...item,
        sizes,
        recipeIngredients,
        recipeCount: recipeIngredients.length,
        recipeSummary: recipeSummary || null
      };
    });
  }
};

// ══════════════════════════════════════════
//  RECIPE QUERIES
// ══════════════════════════════════════════

export const recipeQueries = {
  getByMenuItem(menuItemId) {
    return execQuery(`
      SELECT r.*, i.name as ingredient_name, i.unit 
      FROM recipes r 
      JOIN inventory i ON r.inventory_id = i.id 
      WHERE r.menu_item_id = ?
    `, [menuItemId]);
  },

  set(menuItemId, inventoryId, quantity) {
    const existing = execSingle(
      'SELECT id FROM recipes WHERE menu_item_id = ? AND inventory_id = ?',
      [menuItemId, inventoryId]
    );
    if (existing) {
      runQuery('UPDATE recipes SET quantity = ? WHERE id = ?', [quantity, existing.id]);
    } else {
      runQuery(
        'INSERT INTO recipes (menu_item_id, inventory_id, quantity) VALUES (?, ?, ?)',
        [menuItemId, inventoryId, quantity]
      );
    }
  },

  remove(menuItemId, inventoryId) {
    runQuery('DELETE FROM recipes WHERE menu_item_id = ? AND inventory_id = ?', [menuItemId, inventoryId]);
  },

  clearForMenuItem(menuItemId) {
    runQuery('DELETE FROM recipes WHERE menu_item_id = ?', [menuItemId]);
  },

  // Replace all recipe rows for a menu item at once
  setAll(menuItemId, recipeList = []) {
    // Delete existing recipes
    runQuery('DELETE FROM recipes WHERE menu_item_id = ?', [menuItemId]);
    // Insert new ones
    for (const row of recipeList) {
      if (row.inventoryId && row.quantity > 0) {
        runQuery(
          'INSERT INTO recipes (menu_item_id, inventory_id, quantity) VALUES (?, ?, ?)',
          [menuItemId, row.inventoryId, row.quantity]
        );
      }
    }
  }
};

// ══════════════════════════════════════════
//  INVENTORY QUERIES
// ══════════════════════════════════════════

export const inventoryQueries = {
  getAll(locationId = null) {
    if (locationId) {
      return execQuery('SELECT * FROM inventory WHERE location_id = ? ORDER BY name', [locationId]);
    }
    return execQuery('SELECT * FROM inventory ORDER BY name');
  },

  getById(id) {
    return execSingle('SELECT * FROM inventory WHERE id = ?', [id]);
  },

  // Get all inventory with extra info: how many menus use each item
  getAllWithUsage(locationId = null) {
    const items = this.getAll(locationId);
    return items.map(item => {
      const usageResult = execSingle(
        'SELECT COUNT(DISTINCT menu_item_id) as menu_count FROM recipes WHERE inventory_id = ?',
        [item.id]
      );
      return {
        ...item,
        // Provide defaults for optional schema columns if they exist
        min_stock: item.min_stock || 0,
        cost_per_unit: item.cost_per_unit || 0,
        category: item.category || '',
        sku: item.sku || `MAT-${String(item.id).padStart(3, '0')}`,
        purchase_price: item.purchase_price || 0,
        package_size: item.package_size || 0,
        storage_location: item.storage_location || 'Bar POS',
        supplier: item.supplier || '',
        expiry_date: item.expiry_date || '',
        menu_count: usageResult?.menu_count || 0
      };
    });
  },

  create(name, category = '', unit, currentStock, minStock = 0, costPerUnit = 0, locationId = null, extra = {}) {
    const sku = extra.sku || '';
    const purchasePrice = extra.purchasePrice || 0;
    const packageSize = extra.packageSize || 0;
    const storageLocation = extra.storageLocation || 'Bar POS';
    const supplier = extra.supplier || '';
    const expiryDate = extra.expiryDate || '';

    // Try with full extended columns first
    try {
      runQuery(
        'INSERT INTO inventory (name, category, unit, current_stock, min_stock, cost_per_unit, location_id, sku, purchase_price, package_size, storage_location, supplier, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, category, unit, currentStock, minStock, costPerUnit, locationId, sku, purchasePrice, packageSize, storageLocation, supplier, expiryDate]
      );
    } catch {
      try {
        runQuery(
          'INSERT INTO inventory (name, category, unit, current_stock, min_stock, cost_per_unit, location_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [name, category, unit, currentStock, minStock, costPerUnit, locationId]
        );
      } catch {
        // Fall back to basic schema
        runQuery(
          'INSERT INTO inventory (name, unit, current_stock, location_id) VALUES (?, ?, ?, ?)',
          [name, unit, currentStock, locationId]
        );
      }
    }
    return getLastInsertId();
  },

  update(id, name, category = '', unit, currentStock = 0, minStock = 0, costPerUnit = 0, extra = {}) {
    const sku = extra.sku || '';
    const purchasePrice = extra.purchasePrice || 0;
    const packageSize = extra.packageSize || 0;
    const storageLocation = extra.storageLocation || 'Bar POS';
    const supplier = extra.supplier || '';
    const expiryDate = extra.expiryDate || '';

    try {
      runQuery(
        'UPDATE inventory SET name = ?, category = ?, unit = ?, current_stock = ?, min_stock = ?, cost_per_unit = ?, sku = ?, purchase_price = ?, package_size = ?, storage_location = ?, supplier = ?, expiry_date = ?, updated_at = datetime("now","localtime") WHERE id = ?',
        [name, category, unit, currentStock, minStock, costPerUnit, sku, purchasePrice, packageSize, storageLocation, supplier, expiryDate, id]
      );
    } catch {
      try {
        runQuery(
          'UPDATE inventory SET name = ?, category = ?, unit = ?, current_stock = ?, min_stock = ?, cost_per_unit = ?, updated_at = datetime("now","localtime") WHERE id = ?',
          [name, category, unit, currentStock, minStock, costPerUnit, id]
        );
      } catch {
        runQuery(
          'UPDATE inventory SET name = ?, unit = ?, current_stock = ?, updated_at = datetime("now","localtime") WHERE id = ?',
          [name, unit, currentStock, id]
        );
      }
    }
  },

  addStock(id, amount, reason, locationId) {
    runQuery(
      'UPDATE inventory SET current_stock = current_stock + ?, updated_at = datetime("now","localtime") WHERE id = ?',
      [amount, id]
    );
    runQuery(
      'INSERT INTO inventory_log (inventory_id, change_amount, reason, location_id) VALUES (?, ?, ?, ?)',
      [id, amount, reason, locationId]
    );
  },

  deductStock(id, amount, reason, locationId) {
    runQuery(
      'UPDATE inventory SET current_stock = current_stock - ?, updated_at = datetime("now","localtime") WHERE id = ?',
      [amount, id]
    );
    runQuery(
      'INSERT INTO inventory_log (inventory_id, change_amount, reason, location_id) VALUES (?, ?, ?, ?)',
      [id, -amount, reason, locationId]
    );
  },

  // Deduct ingredients for a menu item based on recipe
  deductForOrder(menuItemId, quantity, locationId) {
    const ingredients = recipeQueries.getByMenuItem(menuItemId);
    for (const ing of ingredients) {
      const totalNeeded = ing.quantity * quantity;
      this.deductStock(ing.inventory_id, totalNeeded, `Order: menu #${menuItemId} x${quantity}`, locationId);
    }
  },

  delete(id) {
    runQuery('DELETE FROM inventory_log WHERE inventory_id = ?', [id]);
    runQuery('DELETE FROM recipes WHERE inventory_id = ?', [id]);
    runQuery('DELETE FROM inventory WHERE id = ?', [id]);
  },

  getLogs(inventoryId, limit = 50) {
    return execQuery(
      'SELECT * FROM inventory_log WHERE inventory_id = ? ORDER BY created_at DESC LIMIT ?',
      [inventoryId, limit]
    );
  },

  // Stock analysis: calculate avg daily consumption, project days until depleted
  getStockAnalysis(locationId, lookbackDays = 30) {
    const items = this.getAllWithUsage(locationId);
    const results = [];

    for (const item of items) {
      // Get total negative consumption in the lookback period
      let totalConsumed = 0;
      try {
        const logs = execQuery(`
          SELECT COALESCE(SUM(ABS(change_amount)), 0) as total_consumed
          FROM inventory_log
          WHERE inventory_id = ?
            AND change_amount < 0
            AND created_at >= datetime('now', '-${lookbackDays} days', 'localtime')
        `, [item.id]);
        totalConsumed = logs[0]?.total_consumed || 0;
      } catch {
        totalConsumed = 0;
      }

      const dailyAvg = lookbackDays > 0 ? totalConsumed / lookbackDays : 0;
      const daysUntilEmpty = dailyAvg > 0 ? Math.floor(item.current_stock / dailyAvg) : 999;
      const weeklyNeed = Math.ceil(dailyAvg * 7 * 1.2); // 20% buffer

      let status = 'aman';
      if (daysUntilEmpty <= 2) status = 'kritis';
      else if (daysUntilEmpty <= 5) status = 'waspada';

      results.push({
        ...item,
        daily_consumption: Math.round(dailyAvg * 100) / 100,
        days_until_empty: daysUntilEmpty,
        weekly_need: weeklyNeed,
        deficit: item.current_stock - weeklyNeed,
        status
      });
    }

    // Sort by urgency: kritis first, then waspada, then aman
    const order = { kritis: 0, waspada: 1, aman: 2 };
    results.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.days_until_empty - b.days_until_empty);

    return results;
  }
};

// ══════════════════════════════════════════
//  PAYMENT METHOD QUERIES
// ══════════════════════════════════════════

export const paymentQueries = {
  getAll() {
    const rows = execQuery('SELECT * FROM payment_methods ORDER BY sort_order, name');
    return rows.map(r => ({
      ...r,
      badge: r.badge || (r.type === 'cash' ? 'Utama' : r.type === 'digital' ? 'Auto Settlement' : r.type === 'transfer' ? 'BCA & Mandiri' : r.type === 'edc' ? 'Mesin EDC' : ''),
      description: r.description || (r.type === 'cash' ? 'Batas laci: Rp 2.000.000 • Tanpa MDR' : r.type === 'digital' ? 'MDR: 0% (Usaha Mikro) • Bank Indonesia' : r.type === 'transfer' ? 'Notifikasi instan via webhook kasir' : r.type === 'edc' ? 'MDR: 0.15% • Terminal ID: EDC-ABP-088' : 'Saluran transaksi kasir'),
      cash_limit: r.cash_limit || 2000000,
      mdr_rate: r.mdr_rate || (r.type === 'edc' ? '0.15%' : '0%'),
      account_number: r.account_number || (r.type === 'transfer' ? 'BCA 1290884910' : ''),
      terminal_id: r.terminal_id || (r.type === 'edc' ? 'EDC-ABP-088' : '')
    }));
  },

  getActive() {
    const rows = execQuery('SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY sort_order, name');
    return rows.map(r => ({
      ...r,
      badge: r.badge || (r.type === 'cash' ? 'Utama' : r.type === 'digital' ? 'Auto Settlement' : r.type === 'transfer' ? 'BCA & Mandiri' : r.type === 'edc' ? 'Mesin EDC' : ''),
      description: r.description || (r.type === 'cash' ? 'Batas laci: Rp 2.000.000 • Tanpa MDR' : r.type === 'digital' ? 'MDR: 0% (Usaha Mikro) • Bank Indonesia' : r.type === 'transfer' ? 'Notifikasi instan via webhook kasir' : r.type === 'edc' ? 'MDR: 0.15% • Terminal ID: EDC-ABP-088' : 'Saluran transaksi kasir')
    }));
  },

  getById(id) {
    return execSingle('SELECT * FROM payment_methods WHERE id = ?', [id]);
  },

  create(name, type = 'other', extra = {}) {
    const maxOrder = execSingle('SELECT MAX(sort_order) as m FROM payment_methods');
    const badge = extra.badge || '';
    const desc = extra.description || '';
    const cashLimit = extra.cash_limit || 0;
    const mdrRate = extra.mdr_rate || '';
    const accNum = extra.account_number || '';
    const termId = extra.terminal_id || '';

    try {
      runQuery(
        'INSERT INTO payment_methods (name, type, sort_order, badge, description, cash_limit, mdr_rate, account_number, terminal_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, type, (maxOrder?.m || 0) + 1, badge, desc, cashLimit, mdrRate, accNum, termId]
      );
    } catch {
      runQuery(
        'INSERT INTO payment_methods (name, type, sort_order) VALUES (?, ?, ?)',
        [name, type, (maxOrder?.m || 0) + 1]
      );
    }
    return getLastInsertId();
  },

  update(id, name, type, extra = {}) {
    const badge = extra.badge || '';
    const desc = extra.description || '';
    const cashLimit = extra.cash_limit || 0;
    const mdrRate = extra.mdr_rate || '';
    const accNum = extra.account_number || '';
    const termId = extra.terminal_id || '';

    try {
      runQuery(
        'UPDATE payment_methods SET name = ?, type = ?, badge = ?, description = ?, cash_limit = ?, mdr_rate = ?, account_number = ?, terminal_id = ? WHERE id = ?',
        [name, type, badge, desc, cashLimit, mdrRate, accNum, termId, id]
      );
    } catch {
      runQuery('UPDATE payment_methods SET name = ?, type = ? WHERE id = ?', [name, type, id]);
    }
  },

  toggleActive(id, isActive) {
    runQuery('UPDATE payment_methods SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  },

  delete(id) {
    runQuery('DELETE FROM payment_methods WHERE id = ?', [id]);
  },

  // Payment Analytics & Breakdown for a date range
  getPaymentAnalytics(locationId, startDate, endDate) {
    const breakdown = transactionQueries.getRevenueByPaymentMethod(locationId, startDate, endDate);
    const summary = transactionQueries.getSummaryForRange(locationId, startDate, endDate);
    const totalTransactions = summary?.total_transactions || 0;
    const totalRevenue = summary?.total_revenue || 0;
    const avgPerTrx = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    const allMethods = this.getAll();
    const activeCount = allMethods.filter(m => m.is_active).length;

    // Calculate method breakdown percentages
    const processedBreakdown = breakdown.map((item, idx) => {
      const pct = totalTransactions > 0 ? Math.round((item.transaction_count / totalTransactions) * 100) : 0;
      const revPct = totalRevenue > 0 ? Math.round((item.total_amount / totalRevenue) * 100) : 0;
      return {
        ...item,
        pct,
        revPct,
        rank: idx + 1
      };
    });

    const dominantMethod = processedBreakdown[0] || (allMethods[0] ? {
      payment_method_name: allMethods[0].name,
      pct: 0,
      transaction_count: 0,
      total_amount: 0
    } : null);

    return {
      totalTransactions,
      totalRevenue,
      avgPerTrx,
      breakdown: processedBreakdown,
      dominantMethod,
      activeChannelsCount: activeCount,
      totalChannelsCount: allMethods.length
    };
  },

  // Settlement & reconciliation history from closings and cashier sessions
  getSettlementLogs(locationId, limit = 20) {
    const closings = closingQueries.getByFilters(locationId, { limit });
    const logs = [];

    for (const c of closings) {
      const details = closingQueries.getDetails(c.id);
      
      // QRIS Auto-settlement log
      const qrisDetail = details.find(d => (d.payment_method_name || '').toLowerCase().includes('qris'));
      if (qrisDetail && qrisDetail.total_amount > 0) {
        logs.push({
          id: `stl-qris-${c.id}`,
          closing_id: c.id,
          type: 'qris',
          title: 'QRIS Batch Settlement (Sesi Closing)',
          badge: 'Berhasil',
          badgeClass: 'success',
          date: c.closed_at,
          subtitle: `Rekening Penampung BCA Bisnis (***482) • Sesi ${c.id}`,
          amount: qrisDetail.total_amount,
          note: 'Ditransfer otomatis'
        });
      }

      // Cash Deposit / Handover log
      const cashDetail = details.find(d => (d.payment_method_name || '').toLowerCase().includes('cash') || (d.payment_method_name || '').toLowerCase().includes('tunai'));
      if (cashDetail && cashDetail.total_amount > 0) {
        logs.push({
          id: `stl-cash-${c.id}`,
          closing_id: c.id,
          type: 'cash',
          title: `Setoran Tunai Closing Kasir #${c.id}`,
          badge: 'Terverifikasi',
          badgeClass: 'success',
          date: c.closed_at,
          subtitle: 'Fisik Diserahkan ke Brankas Outlet',
          amount: cashDetail.total_amount,
          note: `Kasir ID: POS-${c.location_id || 1}`
        });
      }

      // EDC / Card settlement
      const edcDetail = details.find(d => (d.payment_method_name || '').toLowerCase().includes('edc') || (d.payment_method_name || '').toLowerCase().includes('debit') || (d.payment_method_name || '').toLowerCase().includes('transfer'));
      if (edcDetail && edcDetail.total_amount > 0) {
        logs.push({
          id: `stl-edc-${c.id}`,
          closing_id: c.id,
          type: 'edc',
          title: `${edcDetail.payment_method_name} Settlement & Kliring`,
          badge: 'Selesai',
          badgeClass: 'info',
          date: c.closed_at,
          subtitle: `Terminal EDC-ABP-088 • Rekonsiliasi Otomatis`,
          amount: edcDetail.total_amount,
          note: 'Kliring Bank H+0'
        });
      }
    }

    return logs.slice(0, limit);
  }
};

// ══════════════════════════════════════════
//  TRANSACTION QUERIES
// ══════════════════════════════════════════

export const transactionQueries = {
  create(locationId, paymentMethodId, paymentId, totalAmount, paidAmount, changeAmount, items) {
    runQuery(
      `INSERT INTO transactions (location_id, payment_method_id, payment_id, total_amount, paid_amount, change_amount) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [locationId, paymentMethodId, paymentId, totalAmount, paidAmount, changeAmount]
    );
    const txId = getLastInsertId();

    for (const item of items) {
      runQuery(
        `INSERT INTO transaction_items (transaction_id, menu_item_id, size_id, quantity, unit_price, subtotal, menu_name, size_name) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [txId, item.menuItemId, item.sizeId, item.quantity, item.unitPrice, item.subtotal, item.menuName, item.sizeName]
      );

      // Deduct inventory
      inventoryQueries.deductForOrder(item.menuItemId, item.quantity, locationId);
    }

    return txId;
  },

  getTodayTransactions(locationId) {
    return execQuery(`
      SELECT t.*, pm.name as payment_method_name 
      FROM transactions t 
      LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id 
      WHERE t.location_id = ? 
        AND date(t.created_at) = date('now','localtime')
      ORDER BY t.created_at DESC
    `, [locationId]);
  },

  getTransactionItems(transactionId) {
    return execQuery(`
      SELECT ti.*, m.image_data 
      FROM transaction_items ti 
      LEFT JOIN menu_items m ON ti.menu_item_id = m.id 
      WHERE ti.transaction_id = ?
    `, [transactionId]);
  },

  getTodaySummary(locationId) {
    return execSingle(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM transactions 
      WHERE location_id = ? 
        AND date(created_at) = date('now','localtime')
        AND status = 'completed'
    `, [locationId]);
  },

  getTodayByPaymentMethod(locationId) {
    return execQuery(`
      SELECT 
        pm.id as payment_method_id,
        pm.name as payment_method_name,
        COUNT(*) as transaction_count,
        COALESCE(SUM(t.total_amount), 0) as total_amount
      FROM transactions t 
      JOIN payment_methods pm ON t.payment_method_id = pm.id 
      WHERE t.location_id = ? 
        AND date(t.created_at) = date('now','localtime')
        AND t.status = 'completed'
      GROUP BY pm.id
      ORDER BY pm.sort_order
    `, [locationId]);
  },

  deleteTransaction(id) {
    runQuery('DELETE FROM transaction_items WHERE transaction_id = ?', [id]);
    runQuery('DELETE FROM transactions WHERE id = ?', [id]);
  },

  // Report queries
  getRevenueByDateRange(locationId, startDate, endDate) {
    return execQuery(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as transactions,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM transactions 
      WHERE location_id = ? 
        AND date(created_at) >= ? 
        AND date(created_at) <= ?
        AND status = 'completed'
      GROUP BY date(created_at)
      ORDER BY date(created_at)
    `, [locationId, startDate, endDate]);
  },

  getRevenueByMonth(locationId, year) {
    return execQuery(`
      SELECT 
        strftime('%m', created_at) as month,
        COUNT(*) as transactions,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM transactions 
      WHERE location_id = ? 
        AND strftime('%Y', created_at) = ?
        AND status = 'completed'
      GROUP BY strftime('%m', created_at)
      ORDER BY month
    `, [locationId, String(year)]);
  },

  getTopSellingItems(locationId, startDate, endDate, limit = 20) {
    return execQuery(`
      SELECT 
        ti.menu_name,
        COALESCE(c.name, 'Coffee') as category_name,
        SUM(ti.quantity) as total_qty,
        SUM(ti.subtotal) as total_revenue
      FROM transaction_items ti 
      JOIN transactions t ON ti.transaction_id = t.id 
      LEFT JOIN menu_items m ON ti.menu_item_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE t.location_id = ? 
        AND date(t.created_at) >= ? 
        AND date(t.created_at) <= ?
        AND t.status = 'completed'
      GROUP BY ti.menu_name
      ORDER BY total_qty DESC
      LIMIT ?
    `, [locationId, startDate, endDate, limit]);
  },

  getLeastSellingItems(locationId, startDate, endDate, limit = 10) {
    return execQuery(`
      SELECT 
        ti.menu_name,
        COALESCE(c.name, 'Coffee') as category_name,
        SUM(ti.quantity) as total_qty,
        SUM(ti.subtotal) as total_revenue
      FROM transaction_items ti 
      JOIN transactions t ON ti.transaction_id = t.id 
      LEFT JOIN menu_items m ON ti.menu_item_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE t.location_id = ? 
        AND date(t.created_at) >= ? 
        AND date(t.created_at) <= ?
        AND t.status = 'completed'
      GROUP BY ti.menu_name
      ORDER BY total_qty ASC
      LIMIT ?
    `, [locationId, startDate, endDate, limit]);
  },

  // Get total items sold grouped by drink vs food
  getTotalItemsSold(locationId, startDate, endDate) {
    return execSingle(`
      SELECT
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(c.name, '')) LIKE '%makan%' OR LOWER(COALESCE(c.name, '')) LIKE '%snack%' OR LOWER(COALESCE(c.name, '')) LIKE '%food%' OR LOWER(COALESCE(c.name, '')) LIKE '%pastry%' THEN ti.quantity ELSE 0 END), 0) as food_qty,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(c.name, '')) NOT LIKE '%makan%' AND LOWER(COALESCE(c.name, '')) NOT LIKE '%snack%' AND LOWER(COALESCE(c.name, '')) NOT LIKE '%food%' AND LOWER(COALESCE(c.name, '')) NOT LIKE '%pastry%' THEN ti.quantity ELSE 0 END), 0) as drink_qty,
        COALESCE(SUM(ti.quantity), 0) as total_qty,
        COALESCE(SUM(ti.subtotal), 0) as total_revenue
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      LEFT JOIN menu_items m ON ti.menu_item_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE t.location_id = ?
        AND date(t.created_at) >= ?
        AND date(t.created_at) <= ?
        AND t.status = 'completed'
    `, [locationId, startDate, endDate]);
  },

  // Revenue breakdown by payment method
  getRevenueByPaymentMethod(locationId, startDate, endDate) {
    return execQuery(`
      SELECT
        pm.id as payment_method_id,
        pm.name as payment_method_name,
        pm.type as payment_type,
        COUNT(*) as transaction_count,
        COALESCE(SUM(t.total_amount), 0) as total_amount
      FROM transactions t
      JOIN payment_methods pm ON t.payment_method_id = pm.id
      WHERE t.location_id = ?
        AND date(t.created_at) >= ?
        AND date(t.created_at) <= ?
        AND t.status = 'completed'
      GROUP BY pm.id
      ORDER BY total_amount DESC
    `, [locationId, startDate, endDate]);
  },

  // Get summary for a given date range (total transactions, revenue)
  getSummaryForRange(locationId, startDate, endDate) {
    return execSingle(`
      SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM transactions
      WHERE location_id = ?
        AND date(created_at) >= ?
        AND date(created_at) <= ?
        AND status = 'completed'
    `, [locationId, startDate, endDate]);
  }
};

// ══════════════════════════════════════════
//  CLOSING QUERIES
// ══════════════════════════════════════════

export const closingQueries = {
  create(locationId, openedAt) {
    const summary = transactionQueries.getTodaySummary(locationId);
    const byMethod = transactionQueries.getTodayByPaymentMethod(locationId);

    runQuery(
      'INSERT INTO closings (location_id, opened_at, total_transactions, total_revenue) VALUES (?, ?, ?, ?)',
      [locationId, openedAt, summary?.total_transactions || 0, summary?.total_revenue || 0]
    );
    const closingId = getLastInsertId();

    for (const pm of byMethod) {
      runQuery(
        'INSERT INTO closing_details (closing_id, payment_method_id, payment_method_name, total_amount, transaction_count) VALUES (?, ?, ?, ?, ?)',
        [closingId, pm.payment_method_id, pm.payment_method_name, pm.total_amount, pm.transaction_count]
      );
    }

    return closingId;
  },

  getAll(locationId) {
    return execQuery(`
      SELECT * FROM closings 
      WHERE location_id = ? 
      ORDER BY closed_at DESC
    `, [locationId]);
  },

  getDetails(closingId) {
    return execQuery('SELECT * FROM closing_details WHERE closing_id = ?', [closingId]);
  },

  getRecent(locationId, limit = 50) {
    return execQuery(`
      SELECT * FROM closings 
      WHERE location_id = ? 
      ORDER BY closed_at DESC 
      LIMIT ?
    `, [locationId, limit]);
  },

  getByFilters(locationId, { dateFilter = '', monthFilter = '', limit = 50 } = {}) {
    let query = `SELECT * FROM closings WHERE location_id = ?`;
    const params = [locationId];

    if (dateFilter) {
      query += ` AND date(closed_at) = ?`;
      params.push(dateFilter);
    } else if (monthFilter) {
      query += ` AND strftime('%Y-%m', closed_at) = ?`;
      params.push(monthFilter);
    }

    query += ` ORDER BY closed_at DESC LIMIT ?`;
    params.push(limit);

    return execQuery(query, params);
  },

  delete(id) {
    runQuery('DELETE FROM closing_details WHERE closing_id = ?', [id]);
    runQuery('DELETE FROM closings WHERE id = ?', [id]);
  }
};

// ══════════════════════════════════════════
//  SETTINGS QUERIES
// ══════════════════════════════════════════

export const settingsQueries = {
  get(key) {
    const result = execSingle('SELECT value FROM app_settings WHERE key = ?', [key]);
    return result?.value || null;
  },

  set(key, value) {
    const existing = execSingle('SELECT key FROM app_settings WHERE key = ?', [key]);
    if (existing) {
      runQuery('UPDATE app_settings SET value = ? WHERE key = ?', [value, key]);
    } else {
      runQuery('INSERT INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
    }
  }
};
