// Core database service — sql.js with IndexedDB persistence
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { CREATE_TABLES, SEED_DATA } from './schema.js';
import { ensureSeedData } from './seedData.js';

const DB_NAME = 'makna_coffee_db';
const DB_STORE = 'database';
const DB_KEY = 'main';

let dbInstance = null;
let saveTimeout = null;

// ──────────── IndexedDB helpers ────────────

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const idb = req.result;
      if (!idb.objectStoreNames.contains(DB_STORE)) {
        idb.createObjectStore(DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIDB() {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.get(DB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function saveToIDB(data) {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      const req = store.put(data, DB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save to IndexedDB:', err);
  }
}

// ──────────── Schema migrations ────────────

function runSchemaMigrations() {
  if (!dbInstance) return;
  // Safely add new columns — SQLite will throw if column already exists, we ignore those errors

  const migrations = [
    // Add sku to menu_items
    "ALTER TABLE menu_items ADD COLUMN sku TEXT DEFAULT ''",
    // Add category, min_stock, cost_per_unit to inventory
    "ALTER TABLE inventory ADD COLUMN category TEXT DEFAULT ''",
    "ALTER TABLE inventory ADD COLUMN min_stock REAL DEFAULT 0",
    "ALTER TABLE inventory ADD COLUMN cost_per_unit REAL DEFAULT 0",
    "ALTER TABLE inventory ADD COLUMN sku TEXT DEFAULT ''",
    "ALTER TABLE inventory ADD COLUMN purchase_price REAL DEFAULT 0",
    "ALTER TABLE inventory ADD COLUMN package_size REAL DEFAULT 0",
    "ALTER TABLE inventory ADD COLUMN storage_location TEXT DEFAULT 'Bar POS'",
    "ALTER TABLE inventory ADD COLUMN supplier TEXT DEFAULT ''",
    "ALTER TABLE inventory ADD COLUMN expiry_date TEXT DEFAULT ''",
    // Add columns to payment_methods
    "ALTER TABLE payment_methods ADD COLUMN description TEXT DEFAULT ''",
    "ALTER TABLE payment_methods ADD COLUMN account_number TEXT DEFAULT ''",
    "ALTER TABLE payment_methods ADD COLUMN mdr_rate TEXT DEFAULT ''",
    "ALTER TABLE payment_methods ADD COLUMN cash_limit INTEGER DEFAULT 0",
    "ALTER TABLE payment_methods ADD COLUMN terminal_id TEXT DEFAULT ''",
    "ALTER TABLE payment_methods ADD COLUMN badge TEXT DEFAULT ''",
    // Add columns to locations
    "ALTER TABLE locations ADD COLUMN latitude REAL DEFAULT -2.583120",
    "ALTER TABLE locations ADD COLUMN longitude REAL DEFAULT 140.672110",
    "ALTER TABLE locations ADD COLUMN plus_code TEXT DEFAULT 'CMMF+87 Jayapura, Papua'",
    "ALTER TABLE locations ADD COLUMN phone TEXT DEFAULT '+62 812-4829-1092'",
    "ALTER TABLE locations ADD COLUMN opening_hours TEXT DEFAULT '08:00 - 23:00 WIT (Buka)'",
    "ALTER TABLE locations ADD COLUMN rating REAL DEFAULT 4.9",
    "ALTER TABLE locations ADD COLUMN reviews_count INTEGER DEFAULT 184",
    "ALTER TABLE locations ADD COLUMN branch_code TEXT DEFAULT 'OUT-KTJ-01'",
    "ALTER TABLE locations ADD COLUMN status_operasional TEXT DEFAULT 'active'",
    "ALTER TABLE locations ADD COLUMN terminals_count INTEGER DEFAULT 3",
  ];

  for (const sql of migrations) {
    try {
      dbInstance.run(sql);
    } catch {
      // Column already exists — safe to ignore
    }
  }
}

// ──────────── Database initialization ────────────

export async function initDatabase() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl
  });

  // Try to load existing database from IndexedDB
  const savedData = await loadFromIDB();

  if (savedData) {
    dbInstance = new SQL.Database(new Uint8Array(savedData));
    // Run schema migrations to add new columns
    runSchemaMigrations();
    // Ensure table structure migrations and default seeds
    ensureSeedData();
    await persistDatabase();
  } else {
    dbInstance = new SQL.Database();
    // Initialize schema and seed data
    dbInstance.run(CREATE_TABLES);
    dbInstance.run(SEED_DATA);
    ensureSeedData();
    await persistDatabase();
  }

  return dbInstance;
}

export function getDatabase() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

// ──────────── Persistence ────────────

export async function persistDatabase() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  await saveToIDB(data.buffer);
}

// Debounced auto-save (300ms after last mutation)
export function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    persistDatabase();
  }, 300);
}

// ──────────── Query helpers ────────────

export function runQuery(sql, params = []) {
  const db = getDatabase();
  db.run(sql, params);
  scheduleSave();
}

export function execQuery(sql, params = []) {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function execSingle(sql, params = []) {
  const results = execQuery(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function getLastInsertId() {
  const db = getDatabase();
  const result = db.exec('SELECT last_insert_rowid() as id');
  return result[0]?.values[0]?.[0] || 0;
}

// ──────────── Backup & Restore ────────────

export function exportDatabaseJSON() {
  const db = getDatabase();
  const tables = execQuery(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );

  const backup = {};
  for (const { name } of tables) {
    backup[name] = execQuery(`SELECT * FROM ${name}`);
  }

  backup._meta = {
    exported_at: new Date().toISOString(),
    version: 1,
    app: 'Makna Coffee POS'
  };

  return backup;
}

export function exportDatabaseCSV() {
  const db = getDatabase();
  const tables = execQuery(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );

  const csvFiles = {};
  for (const { name } of tables) {
    const rows = execQuery(`SELECT * FROM ${name}`);
    if (rows.length === 0) {
      csvFiles[name] = '';
      continue;
    }
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];
    for (const row of rows) {
      const values = headers.map(h => {
        const v = row[h];
        if (v === null || v === undefined) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      });
      lines.push(values.join(','));
    }
    csvFiles[name] = lines.join('\n');
  }
  return csvFiles;
}

export async function getDatabaseDiagnostics() {
  const db = getDatabase();
  const tables = [
    'locations', 'menu_items', 'inventory', 'recipes',
    'transactions', 'transaction_items', 'payment_methods',
    'categories', 'sizes', 'users', 'closings'
  ];

  const counts = {};
  let totalRows = 0;

  for (const table of tables) {
    try {
      const res = execSingle(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = res?.count || 0;
      totalRows += counts[table];
    } catch {
      counts[table] = 0;
    }
  }

  // Count images
  let imageCount = 0;
  try {
    const imgRes = execSingle("SELECT COUNT(*) as count FROM menu_items WHERE image_data IS NOT NULL AND image_data != ''");
    imageCount = imgRes?.count || 0;
  } catch {
    imageCount = 0;
  }

  const exportedData = db.export();
  const dbSizeBytes = exportedData.byteLength || 0;
  
  // Calculate formatted size including database buffer + estimated image assets
  const totalSizeBytes = dbSizeBytes + (imageCount * 120 * 1024); // ~120KB avg per asset
  const formattedSize = (totalSizeBytes / (1024 * 1024)).toFixed(1) + ' MB';

  return {
    counts,
    totalRows,
    imageCount,
    dbSizeBytes,
    totalSizeBytes,
    formattedSize,
    sqliteVersion: '3.42.0 (WASM)'
  };
}

export async function restoreFromJSON(jsonData) {
  const db = getDatabase();

  // Get table names in the right order (respect foreign keys)
  const tableOrder = [
    'app_settings', 'users', 'locations', 'categories', 'sizes',
    'payment_methods', 'inventory', 'menu_items', 'menu_sizes',
    'recipes', 'inventory_log', 'transactions', 'transaction_items',
    'closings', 'closing_details'
  ];

  // Disable foreign keys temporarily
  db.run('PRAGMA foreign_keys = OFF');

  try {
    // Clear existing data in reverse order
    for (const table of [...tableOrder].reverse()) {
      if (jsonData[table]) {
        db.run(`DELETE FROM ${table}`);
      }
    }

    // Insert data
    for (const table of tableOrder) {
      const rows = jsonData[table];
      if (!rows || rows.length === 0) continue;

      for (const row of rows) {
        const cols = Object.keys(row);
        const placeholders = cols.map(() => '?').join(', ');
        const values = cols.map(c => row[c]);
        db.run(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`, values);
      }
    }
  } finally {
    db.run('PRAGMA foreign_keys = ON');
  }

  await persistDatabase();
}

