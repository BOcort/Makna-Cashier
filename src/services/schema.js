// Database schema definitions and seed data for Makna Coffee POS

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = `
  -- Users table for authentication
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    qr_code TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  -- Locations / cafe branches
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    address TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  -- Menu categories
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0
  );

  -- Menu items
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    sku TEXT DEFAULT '',
    description TEXT DEFAULT '',
    badge TEXT DEFAULT '',
    image_data TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  -- Size definitions (e.g., Regular, Large, X-Large)
  CREATE TABLE IF NOT EXISTS sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0
  );

  -- Menu item pricing per size
  CREATE TABLE IF NOT EXISTS menu_sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id INTEGER NOT NULL,
    size_id INTEGER NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE,
    UNIQUE(menu_item_id, size_id)
  );

  -- Inventory / supply items
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT '',
    unit TEXT NOT NULL DEFAULT 'gr',
    current_stock REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    cost_per_unit REAL DEFAULT 0,
    location_id INTEGER,
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (location_id) REFERENCES locations(id)
  );

  -- Recipe definitions (ingredients per menu item)
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id INTEGER NOT NULL,
    inventory_id INTEGER NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
  );

  -- Inventory log (stock changes)
  CREATE TABLE IF NOT EXISTS inventory_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    change_amount REAL NOT NULL,
    reason TEXT DEFAULT '',
    location_id INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
  );

  -- Payment methods
  CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'other',
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  );

  -- Transactions (orders)
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    payment_method_id INTEGER,
    payment_id TEXT DEFAULT '',
    total_amount INTEGER DEFAULT 0,
    paid_amount INTEGER DEFAULT 0,
    change_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (location_id) REFERENCES locations(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
  );

  -- Transaction line items
  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    size_id INTEGER,
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER DEFAULT 0,
    subtotal INTEGER DEFAULT 0,
    menu_name TEXT DEFAULT '',
    size_name TEXT DEFAULT '',
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    FOREIGN KEY (size_id) REFERENCES sizes(id)
  );

  -- Closing records (daily cash register close)
  CREATE TABLE IF NOT EXISTS closings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    opened_at TEXT NOT NULL,
    closed_at TEXT DEFAULT (datetime('now','localtime')),
    total_transactions INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    FOREIGN KEY (location_id) REFERENCES locations(id)
  );

  -- Closing breakdown by payment method
  CREATE TABLE IF NOT EXISTS closing_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    closing_id INTEGER NOT NULL,
    payment_method_id INTEGER NOT NULL,
    payment_method_name TEXT DEFAULT '',
    total_amount INTEGER DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    FOREIGN KEY (closing_id) REFERENCES closings(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
  );

  -- App metadata / settings
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT ''
  );
`;

export const SEED_DATA = `
  -- Default payment methods
  INSERT OR IGNORE INTO payment_methods (id, name, type, sort_order) VALUES (1, 'Cash', 'cash', 1);
  INSERT OR IGNORE INTO payment_methods (id, name, type, sort_order) VALUES (2, 'QRIS', 'digital', 2);
  INSERT OR IGNORE INTO payment_methods (id, name, type, sort_order) VALUES (3, 'Transfer', 'digital', 3);

  -- Default locations
  INSERT OR IGNORE INTO locations (id, name, address) VALUES (1, 'Abepura', 'Abepura, Jayapura');
  INSERT OR IGNORE INTO locations (id, name, address) VALUES (2, 'Kotaraja', 'Kotaraja, Jayapura');

  -- Default sizes
  INSERT OR IGNORE INTO sizes (id, name, sort_order) VALUES (1, 'Regular', 1);
  INSERT OR IGNORE INTO sizes (id, name, sort_order) VALUES (2, 'Large', 2);
  INSERT OR IGNORE INTO sizes (id, name, sort_order) VALUES (3, 'X-Large', 3);

  -- Default categories
  INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (1, 'Signature', 1);
  INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (2, 'Coffee', 2);
  INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (3, 'Non-Coffee', 3);
  INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (4, 'Snack', 4);
  INSERT OR IGNORE INTO categories (id, name, sort_order) VALUES (5, 'Makanan', 5);

  -- Schema version
  INSERT OR IGNORE INTO app_settings (key, value) VALUES ('schema_version', '${SCHEMA_VERSION}');
  INSERT OR IGNORE INTO app_settings (key, value) VALUES ('app_name', 'Makna Coffee');
`;
