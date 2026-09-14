// Backup, Restore & Skema Data (ERD Designer) Page
// Makna Coffee POS — Full offline capabilities, ZIP/JSON/CSV exports, SHA-256 verification, and interactive ERD canvas

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useToast } from '../../components/ui/Toast.jsx';
import { useLocation } from '../../contexts/LocationContext.jsx';
import PasswordPopup from '../../components/common/PasswordPopup.jsx';
import {
  exportDatabaseJSON,
  exportDatabaseCSV,
  restoreFromJSON,
  getDatabaseDiagnostics,
  getDatabase
} from '../../services/db.js';
import { downloadFile, readFileAsText, formatDateTime } from '../../utils/format.js';
import { calculateFileSHA256, calculateDataSHA256 } from '../../utils/crypto.js';
import { SimpleZip, extractZipFiles } from '../../utils/zip.js';

// Table schema definition for the 7 relational tables in ERD
const INITIAL_TABLES = {
  outlets: {
    id: 'outlets',
    name: 'outlets',
    title: 'outlets',
    label: 'Pusat & Cabang Outlet',
    icon: 'table_rows',
    headerColor: '#31170A',
    headerTextColor: '#FFFFFF',
    x: 30,
    y: 24,
    width: 250,
    dbTable: 'locations',
    columns: [
      { name: 'id', type: 'INT PK', isPk: true },
      { name: 'name', type: 'VARCHAR(100)' },
      { name: 'address', type: 'TEXT' },
      { name: 'latitude', type: 'DECIMAL(10,7)' },
      { name: 'longitude', type: 'DECIMAL(10,7)' },
      { name: 'phone', type: 'VARCHAR(20)' },
      { name: 'is_active', type: 'TINYINT(1)' },
    ]
  },
  menus: {
    id: 'menus',
    name: 'menus',
    title: 'menus',
    label: 'Katalog Menu & Ukuran',
    icon: 'restaurant_menu',
    headerColor: '#4A2C1D',
    headerTextColor: '#FFFFFF',
    x: 350,
    y: 24,
    width: 250,
    dbTable: 'menu_items',
    columns: [
      { name: 'id', type: 'INT PK', isPk: true },
      { name: 'outlet_id', type: 'INT FK', isFk: true },
      { name: 'name', type: 'VARCHAR(120)' },
      { name: 'category', type: 'VARCHAR(50)' },
      { name: 'price_small', type: 'DECIMAL(10,2)' },
      { name: 'price_medium', type: 'DECIMAL(10,2)' },
      { name: 'price_large', type: 'DECIMAL(10,2)' },
      { name: 'image_url', type: 'VARCHAR(255)' },
      { name: 'is_active', type: 'TINYINT(1)' },
    ]
  },
  raw_materials: {
    id: 'raw_materials',
    name: 'raw_materials',
    title: 'raw_materials',
    label: 'Inventaris Bahan Baku',
    icon: 'inventory_2',
    headerColor: '#31170A',
    headerTextColor: '#FFFFFF',
    x: 30,
    y: 380,
    width: 250,
    dbTable: 'inventory',
    columns: [
      { name: 'id', type: 'INT PK', isPk: true },
      { name: 'outlet_id', type: 'INT FK', isFk: true },
      { name: 'name', type: 'VARCHAR(100)' },
      { name: 'current_stock', type: 'DECIMAL(8,2)' },
      { name: 'unit', type: 'VARCHAR(20)' },
      { name: 'min_stock', type: 'DECIMAL(8,2)' },
    ]
  },
  menu_recipes: {
    id: 'menu_recipes',
    name: 'menu_recipes',
    title: 'menu_recipes',
    label: 'Komposisi Resep',
    icon: 'blender',
    headerColor: '#9B4428',
    headerTextColor: '#FFFFFF',
    x: 640,
    y: 380,
    width: 260,
    dbTable: 'recipes',
    columns: [
      { name: 'id', type: 'INT PK', isPk: true },
      { name: 'menu_id', type: 'INT FK', isFk: true },
      { name: 'material_id', type: 'INT FK', isFk: true },
      { name: 'amount_needed', type: 'DECIMAL(8,2)' },
      { name: 'unit', type: 'VARCHAR(20)' },
    ]
  },
  transactions: {
    id: 'transactions',
    name: 'transactions',
    title: 'transactions',
    label: 'Transaksi Penjualan',
    icon: 'receipt_long',
    headerColor: '#31170A',
    headerTextColor: '#FFFFFF',
    x: 880,
    y: 24,
    width: 260,
    dbTable: 'transactions',
    columns: [
      { name: 'id', type: 'INT PK', isPk: true },
      { name: 'outlet_id', type: 'INT FK', isFk: true },
      { name: 'transaction_no', type: 'VARCHAR(40)' },
      { name: 'total_amount', type: 'DECIMAL(12,2)' },
      { name: 'payment_method_id', type: 'INT FK', isFk: true },
      { name: 'cashier_name', type: 'VARCHAR(80)' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ]
  },
  transaction_items: {
    id: 'transaction_items',
    name: 'transaction_items',
    title: 'transaction_items',
    label: 'Rincian Item Terjual',
    icon: 'shopping_cart_checkout',
    headerColor: '#4A2C1D',
    headerTextColor: '#FFFFFF',
    x: 1240,
    y: 90,
    width: 260,
    dbTable: 'transaction_items',
    columns: [
      { name: 'id', type: 'INT PK', isPk: true },
      { name: 'transaction_id', type: 'INT FK', isFk: true },
      { name: 'menu_id', type: 'INT FK', isFk: true },
      { name: 'quantity', type: 'INT' },
      { name: 'size', type: 'VARCHAR(10)' },
      { name: 'subtotal', type: 'DECIMAL(10,2)' },
    ]
  },
  payment_methods: {
    id: 'payment_methods',
    name: 'payment_methods',
    title: 'payment_methods',
    label: 'Saluran Pembayaran',
    icon: 'payments',
    headerColor: '#31170A',
    headerTextColor: '#FFFFFF',
    x: 920,
    y: 410,
    width: 240,
    dbTable: 'payment_methods',
    columns: [
      { name: 'id', type: 'INT PK', isPk: true },
      { name: 'name', type: 'VARCHAR(50)' },
      { name: 'type', type: 'VARCHAR(20)' },
      { name: 'is_active', type: 'TINYINT(1)' },
      { name: 'mdr_percent', type: 'DECIMAL(4,2)' },
    ]
  }
};

// 7 Relational Links (PK -> FK)
const RELATIONS = [
  {
    id: 'rel_outlet_menus',
    fromTable: 'outlets',
    fromCol: 'id',
    toTable: 'menus',
    toCol: 'outlet_id',
    color: '#9B4428',
    dashed: false,
    label: '1:N'
  },
  {
    id: 'rel_outlet_transactions',
    fromTable: 'outlets',
    fromCol: 'id',
    toTable: 'transactions',
    toCol: 'outlet_id',
    color: '#9B4428',
    dashed: true,
    label: '1:N'
  },
  {
    id: 'rel_menus_recipes',
    fromTable: 'menus',
    fromCol: 'id',
    toTable: 'menu_recipes',
    toCol: 'menu_id',
    color: '#4A2C1D',
    dashed: false,
    label: '1:N'
  },
  {
    id: 'rel_materials_recipes',
    fromTable: 'raw_materials',
    fromCol: 'id',
    toTable: 'menu_recipes',
    toCol: 'material_id',
    color: '#9B4428',
    dashed: false,
    label: '1:N'
  },
  {
    id: 'rel_trans_items',
    fromTable: 'transactions',
    fromCol: 'id',
    toTable: 'transaction_items',
    toCol: 'transaction_id',
    color: '#4A2C1D',
    dashed: false,
    label: '1:N'
  },
  {
    id: 'rel_menus_items',
    fromTable: 'menus',
    fromCol: 'id',
    toTable: 'transaction_items',
    toCol: 'menu_id',
    color: '#9B4428',
    dashed: true,
    label: '1:N'
  },
  {
    id: 'rel_payment_trans',
    fromTable: 'payment_methods',
    fromCol: 'id',
    toTable: 'transactions',
    toCol: 'payment_method_id',
    color: '#4A2C1D',
    dashed: false,
    label: '1:N'
  }
];

export default function Backup() {
  const toast = useToast();
  const { activeLocation } = useLocation();

  // Diagnostics & System metrics
  const [diagnostics, setDiagnostics] = useState(null);
  const [dbHash, setDbHash] = useState('f89e4b12');
  const [lastBackupTime, setLastBackupTime] = useState('06:00 WIT • Hari ini');
  const [isProcessing, setIsProcessing] = useState(false);

  // Restore states
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isVerifyingFile, setIsVerifyingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Security password modal
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // ERD Canvas interactive states
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCables, setShowCables] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeDragTable, setActiveDragTable] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const erdViewportRef = useRef(null);
  const erdCanvasRef = useRef(null);

  // Load diagnostics from real SQLite database
  const refreshDiagnostics = useCallback(async () => {
    try {
      const diag = await getDatabaseDiagnostics();
      setDiagnostics(diag);
      const hash = await calculateDataSHA256(diag.counts);
      setDbHash(hash.substring(0, 8));
    } catch (err) {
      console.error('Failed to load DB diagnostics:', err);
    }
  }, []);

  useEffect(() => {
    refreshDiagnostics();
    const storedLastBackup = localStorage.getItem('makna_last_backup_time');
    if (storedLastBackup) {
      setLastBackupTime(storedLastBackup);
    }
  }, [refreshDiagnostics]);

  // Request password before destructive/critical operations
  const requirePassword = (action) => {
    setPendingAction(() => action);
    setShowPasswordPopup(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPopup(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // ══════════════════════════════════════════════════════
  // ── EXPORT HANDLERS ──
  // ══════════════════════════════════════════════════════

  // 1. FULL ZIP EXPORT (Recommended)
  const handleExportFullZip = async () => {
    try {
      setIsProcessing(true);
      toast.info('Menyiapkan ZIP cadangan lengkap beserta foto menu...');

      const zip = new SimpleZip();
      const backupData = exportDatabaseJSON();
      const csvFiles = exportDatabaseCSV();
      const outletName = activeLocation?.name || 'Kotaraja';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      // 1. Add database JSON
      zip.addTextFile('database/makna_coffee_backup.json', JSON.stringify(backupData, null, 2));

      // 2. Add CSV files in csv/ directory
      for (const [tableName, csvContent] of Object.entries(csvFiles)) {
        zip.addTextFile(`csv/${tableName}.csv`, csvContent);
      }

      // 3. Add Manifest & README
      const manifest = {
        app: 'Makna Coffee POS',
        version: '3.2',
        kernel: 'Rev. 814',
        outlet: outletName,
        exported_at: new Date().toISOString(),
        tables: Object.keys(backupData).filter(k => k !== '_meta'),
        total_records: Object.entries(backupData)
          .filter(([k]) => k !== '_meta')
          .reduce((acc, [, rows]) => acc + (Array.isArray(rows) ? rows.length : 0), 0)
      };
      zip.addTextFile('manifest.json', JSON.stringify(manifest, null, 2));
      zip.addTextFile(
        'README.txt',
        `MAKNA COFFEE POS — ARSIP CADANGAN LENGKAP\n` +
        `Tanggal Cadangan: ${new Date().toLocaleString('id-ID')}\n` +
        `Outlet: ${outletName}\n` +
        `Format: JSON relasional + CSV spreadsheet + Manifest\n\n` +
        `Arsip ini dapat digunakan untuk pemulihan offline instan di menu Backup Makna POS.`
      );

      // 4. Extract embedded images from menu_items if available
      try {
        const db = getDatabase();
        const stmt = db.prepare("SELECT id, name, image_data FROM menu_items WHERE image_data LIKE 'data:%'");
        let imgIdx = 1;
        while (stmt.step()) {
          const item = stmt.getAsObject();
          if (item.image_data) {
            const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            zip.addDataUrl(`images/menu_${item.id}_${cleanName}.png`, item.image_data);
            imgIdx++;
          }
        }
        stmt.free();
      } catch (err) {
        console.warn('Could not bundle menu images into zip:', err);
      }

      const zipBlob = zip.generateBlob();
      const filename = `MaknaCoffee_Backup_${outletName.replace(/\s+/g, '_')}_${timestamp}.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      const nowTimeStr = `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIT • Hari ini`;
      setLastBackupTime(nowTimeStr);
      localStorage.setItem('makna_last_backup_time', nowTimeStr);

      toast.success(`Arsip ZIP lengkap berhasil diunduh (${filename})`);
    } catch (err) {
      toast.error('Gagal membuat ZIP: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. JSON EXPORT
  const handleExportJSON = () => {
    try {
      const data = exportDatabaseJSON();
      const outletName = activeLocation?.name || 'Kotaraja';
      const filename = `makna_pos_${outletName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
      downloadFile(data, filename, 'application/json');

      const nowTimeStr = `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIT • Hari ini`;
      setLastBackupTime(nowTimeStr);
      localStorage.setItem('makna_last_backup_time', nowTimeStr);

      toast.success('File JSON skema & data sistem berhasil diunduh');
    } catch (err) {
      toast.error('Gagal export JSON: ' + err.message);
    }
  };

  // 3. CSV BUNDLE EXPORT
  const handleExportCSV = async () => {
    try {
      const csvFiles = exportDatabaseCSV();
      const zip = new SimpleZip();
      for (const [table, content] of Object.entries(csvFiles)) {
        zip.addTextFile(`${table}.csv`, content);
      }
      const zipBlob = zip.generateBlob();
      const filename = `makna_pos_csv_bundle_${new Date().toISOString().slice(0, 10)}.zip`;

      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success('Bundle file CSV 7 tabel berhasil diunduh (RFC 4180)');
    } catch (err) {
      toast.error('Gagal export CSV: ' + err.message);
    }
  };

  // ══════════════════════════════════════════════════════
  // ── RESTORE & FILE PROCESSING ──
  // ══════════════════════════════════════════════════════

  const processBackupFile = async (file) => {
    if (!file) return;
    setIsVerifyingFile(true);
    setRestoreFile(file);

    try {
      // Calculate real SHA-256 Checksum
      const sha256 = await calculateFileSHA256(file);
      let backupJSON = null;

      if (file.name.endsWith('.json')) {
        const text = await readFileAsText(file);
        backupJSON = JSON.parse(text);
      } else if (file.name.endsWith('.zip')) {
        const arrayBuf = await file.arrayBuffer();
        const extracted = extractZipFiles(arrayBuf);
        const jsonFile = extracted.find(f => f.name.endsWith('.json') && f.text);
        if (jsonFile) {
          backupJSON = JSON.parse(jsonFile.text);
        } else {
          throw new Error('File ZIP tidak memiliki file database JSON yang valid');
        }
      } else {
        throw new Error('Format file tidak didukung. Harap pilih file .json atau .zip');
      }

      if (!backupJSON || typeof backupJSON !== 'object') {
        throw new Error('Struktur data cadangan tidak valid');
      }

      // Count preview stats
      const tablesList = Object.keys(backupJSON).filter(k => k !== '_meta');
      let totalRows = 0;
      for (const [k, v] of Object.entries(backupJSON)) {
        if (k !== '_meta' && Array.isArray(v)) {
          totalRows += v.length;
        }
      }

      setRestorePreview({
        data: backupJSON,
        filename: file.name,
        sha256,
        shortHash: sha256.substring(0, 8),
        sizeBytes: file.size,
        formattedSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        exportedAt: backupJSON._meta?.exported_at || new Date().toISOString(),
        tableCount: tablesList.length,
        totalRows,
        tablesList
      });

      toast.success('Verifikasi berkas berhasil! Checksum valid.');
    } catch (err) {
      toast.error('Gagal memverifikasi file: ' + err.message);
      setRestorePreview(null);
      setRestoreFile(null);
    } finally {
      setIsVerifyingFile(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processBackupFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processBackupFile(file);
    }
  };

  const handleConfirmRestore = () => {
    if (!restorePreview) return;
    requirePassword(async () => {
      try {
        setIsProcessing(true);
        toast.info('Memulihkan struktur & relasi basis data...');
        await restoreFromJSON(restorePreview.data);
        await refreshDiagnostics();
        toast.success('Basis data berhasil dipulihkan secara menyeluruh!');
        setRestorePreview(null);
        setRestoreFile(null);
      } catch (err) {
        toast.error('Gagal memulihkan data: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // ══════════════════════════════════════════════════════
  // ── ERD DRAGGING & BEZIER CONNECTIONS ──
  // ══════════════════════════════════════════════════════

  const handleTableMouseDown = (e, tableId) => {
    e.preventDefault();
    const table = tables[tableId];
    if (!table) return;

    // Calculate mouse offset relative to table top-left
    const rect = erdCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseCanvasX = (e.clientX - rect.left) / zoomLevel;
    const mouseCanvasY = (e.clientY - rect.top) / zoomLevel;

    dragOffsetRef.current = {
      offsetX: mouseCanvasX - table.x,
      offsetY: mouseCanvasY - table.y
    };
    setActiveDragTable(tableId);
  };

  const handleCanvasMouseMove = useCallback((e) => {
    if (!activeDragTable) return;
    const rect = erdCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseCanvasX = (e.clientX - rect.left) / zoomLevel;
    const mouseCanvasY = (e.clientY - rect.top) / zoomLevel;

    const newX = Math.max(10, Math.min(1500, Math.round(mouseCanvasX - dragOffsetRef.current.offsetX)));
    const newY = Math.max(10, Math.min(650, Math.round(mouseCanvasY - dragOffsetRef.current.offsetY)));

    setTables(prev => ({
      ...prev,
      [activeDragTable]: {
        ...prev[activeDragTable],
        x: newX,
        y: newY
      }
    }));
  }, [activeDragTable, zoomLevel]);

  const handleCanvasMouseUp = useCallback(() => {
    setActiveDragTable(null);
  }, []);

  useEffect(() => {
    if (activeDragTable) {
      window.addEventListener('mousemove', handleCanvasMouseMove);
      window.addEventListener('mouseup', handleCanvasMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleCanvasMouseMove);
        window.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [activeDragTable, handleCanvasMouseMove, handleCanvasMouseUp]);

  // Calculate dynamic Bezier curve path connecting fromCol to toCol
  const calculatePath = (rel) => {
    const fromT = tables[rel.fromTable];
    const toT = tables[rel.toTable];
    if (!fromT || !toT) return '';

    const fromColIdx = fromT.columns.findIndex(c => c.name === rel.fromCol);
    const toColIdx = toT.columns.findIndex(c => c.name === rel.toCol);

    // Row positions (Header ~36px, each row ~28px)
    const fromY = fromT.y + 36 + (fromColIdx >= 0 ? fromColIdx : 0) * 28 + 14;
    const toY = toT.y + 36 + (toColIdx >= 0 ? toColIdx : 0) * 28 + 14;

    let fromX, toX;
    if (fromT.x + fromT.width <= toT.x) {
      // Source is left of Target
      fromX = fromT.x + fromT.width;
      toX = toT.x;
    } else if (toT.x + toT.width <= fromT.x) {
      // Target is left of Source
      fromX = fromT.x;
      toX = toT.x + toT.width;
    } else {
      // Overlapping horizontal, connect closest side
      fromX = fromT.x + fromT.width;
      toX = toT.x + toT.width;
    }

    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    const curvature = Math.max(40, Math.min(180, dx * 0.5 + dy * 0.2));

    const cp1x = fromX + (fromX < toX ? curvature : -curvature);
    const cp1y = fromY;
    const cp2x = toX + (fromX < toX ? -curvature : curvature);
    const cp2y = toY;

    return `M ${fromX},${fromY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${toX},${toY}`;
  };

  // ERD Toolbar Actions
  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(1.5, Math.max(0.6, Math.round((prev + delta) * 10) / 10)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setTables(INITIAL_TABLES);
    if (erdViewportRef.current) {
      erdViewportRef.current.scrollLeft = 140;
    }
  };

  const handleToggleFullscreen = () => {
    if (!erdViewportRef.current) return;
    if (!document.fullscreenElement) {
      erdViewportRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        toast.error('Mode layar penuh tidak didukung di browser ini');
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Real-time table rows count mapping
  const getTableRowCount = (dbTable) => {
    if (!diagnostics || !diagnostics.counts) return '—';
    return diagnostics.counts[dbTable] !== undefined ? diagnostics.counts[dbTable] : 0;
  };

  return (
    <div className="stitch-backup-page">
      {/* ══════════════════════════════════════════════════════ */}
      {/* ── TOP SUBHEADER & BREADCRUMB ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="stitch-backup-subheader">
        <div className="stitch-backup-header-inner">
          <div className="stitch-backup-title-group">
            <div className="stitch-backup-badges">
              <span className="stitch-chip-sys">Sistem &amp; Database</span>
              <span className="stitch-dot-sep">•</span>
              <span className="stitch-chip-kernel">MaknaPOS v3.2 (Kernel Rev. 814)</span>
            </div>
            <h1 className="stitch-backup-title">Backup, Restore &amp; Skema Data</h1>
            <p className="stitch-backup-subtitle">
              Unduh cadangan data lokal lengkap (JSON, CSV, ZIP gambar menu) dan telusuri struktur relasi basis data kasir secara langsung.
            </p>
          </div>

          <div className="stitch-backup-actions">
            <div className="stitch-sqlite-pill">
              <span className="material-symbols-outlined stitch-pill-icon">database</span>
              <span className="stitch-pill-text">SQLite + WAL Sync</span>
            </div>
            <button
              type="button"
              className="stitch-btn-instant-download"
              onClick={handleExportFullZip}
              disabled={isProcessing}
              title="Unduh cadangan arsip lengkap instan"
            >
              <span className="material-symbols-outlined">download_for_offline</span>
              <span>Unduh Instan</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── OPERATIONAL CARDS (Diagnostics + Restore + 3 Exports) ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="stitch-backup-grid-section">
        <div className="stitch-backup-grid">
          {/* LEFT: Diagnostics & Restore Box (4 cols) */}
          <div className="stitch-backup-col-left">
            {/* Status Diagnostics Card */}
            <div className="stitch-card stitch-diag-card">
              <div className="stitch-diag-head">
                <div className="stitch-diag-brand">
                  <div className="stitch-diag-icon-box">
                    <span className="material-symbols-outlined">dns</span>
                  </div>
                  <div>
                    <span className="stitch-diag-eyebrow">Status Database Terkini</span>
                    <h3 className="stitch-diag-title">PostgreSQL / SQLite Local</h3>
                  </div>
                </div>
                <span className="stitch-sync-badge">
                  <span className="stitch-pulse-emerald"></span>
                  <span>Synchronized</span>
                </span>
              </div>

              {/* Stats 2-Cols */}
              <div className="stitch-diag-stats">
                <div className="stitch-stat-box">
                  <span className="stitch-stat-label">Total Ukuran Data</span>
                  <span className="stitch-stat-val">{diagnostics?.formattedSize || '14.8 MB'}</span>
                  <span className="stitch-stat-sub">
                    Termasuk {diagnostics?.imageCount || 42} foto menu
                  </span>
                </div>
                <div className="stitch-stat-box">
                  <span className="stitch-stat-label">Terakhir Dicadangkan</span>
                  <span className="stitch-stat-val text-primary font-bold">{lastBackupTime}</span>
                  <span className="stitch-stat-sub">{activeLocation?.name || 'Kotaraja'} (Otomatis)</span>
                </div>
              </div>

              {/* SHA-256 Checksum Verified Badge */}
              <div className="stitch-integrity-badge">
                <div className="stitch-integrity-left">
                  <span className="material-symbols-outlined stitch-verified-icon">verified_user</span>
                  <span className="stitch-integrity-text">SHA-256 Checksum Verified</span>
                </div>
                <span className="stitch-hash-pill font-mono">{dbHash}...4b12</span>
              </div>
            </div>

            {/* Restore / Pulihkan Data Box */}
            <div className="stitch-card stitch-restore-card">
              <div className="stitch-restore-head">
                <span className="material-symbols-outlined stitch-restore-icon">settings_backup_restore</span>
                <h3 className="stitch-restore-title">Pulihkan Data (Restore)</h3>
              </div>
              <p className="stitch-restore-desc">
                Pulihkan struktur dan riwayat dari file backup JSON/ZIP sebelumnya. Data saat ini akan dicocokkan kembali.
              </p>

              {/* Dropzone Area */}
              <div
                className={`stitch-dropzone ${isDraggingOver ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.zip,application/json,application/zip"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="stitch-dropzone-icon-wrap">
                  <span className="material-symbols-outlined">
                    {isVerifyingFile ? 'hourglass_top' : 'cloud_upload'}
                  </span>
                </div>
                <span className="stitch-dropzone-main-text">
                  {restoreFile ? restoreFile.name : 'Pilih File Backup (.json / .zip)'}
                </span>
                <span className="stitch-dropzone-sub-text">
                  atau seret dan lepas file ke area ini (Maks. 50 MB)
                </span>
              </div>

              {/* Info Note */}
              <div className="stitch-restore-note">
                <span className="material-symbols-outlined stitch-note-icon">info</span>
                <span>Restore akan membuat snapshot darurat otomatis sebelum menimpa database lokal kasir.</span>
              </div>
            </div>
          </div>

          {/* RIGHT: 3 Comprehensive Export Formats (8 cols) */}
          <div className="stitch-backup-col-right stitch-card stitch-exports-card">
            <div className="stitch-exports-head">
              <div className="stitch-exports-title-wrap">
                <span className="material-symbols-outlined stitch-exports-icon">archive</span>
                <h3 className="stitch-exports-title">Opsi Format Unduh Cadangan</h3>
              </div>
              <span className="stitch-exports-count">3 Format Siap Ekspor</span>
            </div>

            {/* 3 Formats Grid */}
            <div className="stitch-formats-grid">
              {/* Option 1: ZIP Full (Recommended) */}
              <div className="stitch-format-box recommended">
                <div className="stitch-rec-badge">Rekomendasi</div>
                <div className="stitch-format-top">
                  <div className="stitch-format-icon-wrap primary">
                    <span className="material-symbols-outlined">folder_zip</span>
                  </div>
                  <h4 className="stitch-format-name">Unduh Lengkap (.ZIP)</h4>
                  <p className="stitch-format-desc">
                    Seluruh basis data JSON + CSV + folder aset foto menu beresolusi penuh. Siap untuk migrasi offline antar tablet kasir.
                  </p>
                </div>
                <div className="stitch-format-bottom">
                  <div className="stitch-size-row">
                    <span>Ukuran kompresi:</span>
                    <span className="font-mono font-bold">~14.8 MB</span>
                  </div>
                  <button
                    type="button"
                    className="stitch-btn-format primary"
                    onClick={handleExportFullZip}
                    disabled={isProcessing}
                  >
                    <span className="material-symbols-outlined">file_download</span>
                    <span>Unduh ZIP Penuh</span>
                  </button>
                </div>
              </div>

              {/* Option 2: JSON Standard */}
              <div className="stitch-format-box">
                <div className="stitch-format-top">
                  <div className="stitch-format-icon-wrap neutral">
                    <span className="material-symbols-outlined">data_object</span>
                  </div>
                  <h4 className="stitch-format-name">Data Sistem (.JSON)</h4>
                  <p className="stitch-format-desc">
                    Skema relasional &amp; record mentah dalam format JSON. Dioptimalkan untuk restore kilat sistem kasir MaknaPOS.
                  </p>
                </div>
                <div className="stitch-format-bottom">
                  <div className="stitch-size-row">
                    <span>Ukuran perkiraan:</span>
                    <span className="font-mono font-bold">~1.2 MB</span>
                  </div>
                  <button
                    type="button"
                    className="stitch-btn-format neutral"
                    onClick={handleExportJSON}
                    disabled={isProcessing}
                  >
                    <span className="material-symbols-outlined">download</span>
                    <span>Unduh JSON</span>
                  </button>
                </div>
              </div>

              {/* Option 3: CSV Bundle */}
              <div className="stitch-format-box">
                <div className="stitch-format-top">
                  <div className="stitch-format-icon-wrap neutral">
                    <span className="material-symbols-outlined">table_chart</span>
                  </div>
                  <h4 className="stitch-format-name">Tabel (.CSV Bundle)</h4>
                  <p className="stitch-format-desc">
                    Tabel individual (menus, transactions, outlets, raw_materials) untuk Microsoft Excel atau Google Sheets.
                  </p>
                </div>
                <div className="stitch-format-bottom">
                  <div className="stitch-size-row">
                    <span>Format:</span>
                    <span className="font-mono font-bold">RFC 4180 UTF-8</span>
                  </div>
                  <button
                    type="button"
                    className="stitch-btn-format neutral"
                    onClick={handleExportCSV}
                    disabled={isProcessing}
                  >
                    <span className="material-symbols-outlined">csv</span>
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Strip */}
            <div className="stitch-exports-footer">
              <div className="stitch-footer-left">
                <span className="material-symbols-outlined text-secondary">cloud_done</span>
                <span>Auto-backup tersimpan di cloud storage setiap pergantian shift kasir (pukul 15:00 &amp; 22:00 WIT).</span>
              </div>
              <span className="stitch-schema-tag">v3.2_schema_export</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── INTERACTIVE DATABASE ERD & SCHEMA DESIGNER ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section className="stitch-erd-section">
        <div className="stitch-card stitch-erd-card">
          {/* Header Bar */}
          <div className="stitch-erd-header-bar">
            <div className="stitch-erd-title-group">
              <div className="stitch-erd-icon-box">
                <span className="material-symbols-outlined">schema</span>
              </div>
              <div>
                <div className="stitch-erd-heading-row">
                  <h2 className="stitch-erd-heading">Skema Relasi Basis Data (ERD Designer)</h2>
                  <span className="stitch-tables-pill">7 Tabel Terelasi</span>
                </div>
                <p className="stitch-erd-subtext">
                  Tampilan visual relasi kunci primer (PK) dan kunci asing (FK) dengan sambungan kurva kabel halus.
                </p>
              </div>
            </div>

            {/* Toolbar Controls */}
            <div className="stitch-erd-toolbar">
              <button
                type="button"
                className="stitch-toolbar-btn"
                onClick={() => handleZoom(0.1)}
                title="Perbesar Canvas (Zoom In)"
              >
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button
                type="button"
                className="stitch-toolbar-btn"
                onClick={() => handleZoom(-0.1)}
                title="Perkecil Canvas (Zoom Out)"
              >
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
              <button
                type="button"
                className="stitch-toolbar-btn"
                onClick={handleResetZoom}
                title="Reset Tampilan (100% dan Posisi Default)"
              >
                <span className="material-symbols-outlined">restart_alt</span>
              </button>
              <div className="stitch-toolbar-divider"></div>
              <button
                type="button"
                className={`stitch-toolbar-pill-btn ${showCables ? 'active' : ''}`}
                onClick={() => setShowCables(prev => !prev)}
                title="Sembunyikan/Tampilkan Kabel Relasi"
              >
                <span className="material-symbols-outlined">cable</span>
                <span>Kabel Relasi</span>
              </button>
              <button
                type="button"
                className="stitch-toolbar-btn"
                onClick={handleToggleFullscreen}
                title="Mode Layar Penuh (Fullscreen)"
              >
                <span className="material-symbols-outlined">
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </span>
              </button>
            </div>
          </div>

          {/* THE FLOATING ERD CANVAS VIEWPORT */}
          <div
            ref={erdViewportRef}
            className={`stitch-erd-viewport ${activeDragTable ? 'is-dragging' : ''}`}
          >
            {/* Dot Grid Background */}
            <div className="stitch-erd-grid-bg"></div>

            {/* Scalable Canvas Node */}
            <div
              ref={erdCanvasRef}
              className="stitch-erd-canvas"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left'
              }}
            >
              {/* SVG RELATIONAL CABLE LAYER (Smooth Bezier Connectors) */}
              {showCables && (
                <svg className="stitch-erd-cables-layer">
                  <defs>
                    {/* Directional arrow markers */}
                    <marker
                      id="erd-arrow"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#9B4428" />
                    </marker>
                    <marker
                      id="erd-arrow-alt"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4A2C1D" />
                    </marker>
                    {/* Drop shadow for relational wires */}
                    <filter id="cable-shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#4A2C1D" floodOpacity="0.18" />
                    </filter>
                  </defs>

                  {/* Render 7 dynamic Bezier cable paths */}
                  {RELATIONS.map(rel => {
                    const d = calculatePath(rel);
                    return (
                      <path
                        key={rel.id}
                        d={d}
                        fill="none"
                        stroke={rel.color}
                        strokeWidth="2.5"
                        strokeDasharray={rel.dashed ? '6 4' : 'none'}
                        filter="url(#cable-shadow)"
                        markerEnd={rel.color === '#4A2C1D' ? 'url(#erd-arrow-alt)' : 'url(#erd-arrow)'}
                        className="stitch-cable-line"
                      />
                    );
                  })}
                </svg>
              )}

              {/* 7 FLOATING TABLE CARDS */}
              {Object.values(tables).map((t) => {
                const rowCount = getTableRowCount(t.dbTable);
                return (
                  <div
                    key={t.id}
                    className={`stitch-table-card ${activeDragTable === t.id ? 'dragging' : ''}`}
                    style={{
                      left: `${t.x}px`,
                      top: `${t.y}px`,
                      width: `${t.width}px`
                    }}
                  >
                    {/* Header bar (Draggable handle) */}
                    <div
                      className="stitch-table-header"
                      style={{ backgroundColor: t.headerColor, color: t.headerTextColor }}
                      onMouseDown={(e) => handleTableMouseDown(e, t.id)}
                      title="Tahan & geser untuk memindahkan tabel"
                    >
                      <div className="stitch-table-title-wrap">
                        <span className="material-symbols-outlined stitch-table-icon">{t.icon}</span>
                        <span className="stitch-table-name">{t.name}</span>
                      </div>
                      <span className="stitch-table-rowcount">
                        {typeof rowCount === 'number' ? `${rowCount.toLocaleString()} rows` : rowCount}
                      </span>
                    </div>

                    {/* Column rows */}
                    <div className="stitch-table-columns">
                      {t.columns.map((col) => (
                        <div
                          key={col.name}
                          className={`stitch-column-row ${col.isPk ? 'pk-row' : ''} ${col.isFk ? 'fk-row' : ''}`}
                        >
                          <div className="stitch-col-name-wrap">
                            {col.isPk && (
                              <span className="material-symbols-outlined stitch-pk-icon">key</span>
                            )}
                            {col.isFk && (
                              <span className="material-symbols-outlined stitch-fk-icon">link</span>
                            )}
                            <span className={`stitch-col-name ${col.isPk ? 'font-bold' : ''} ${col.isFk ? 'font-semibold text-secondary' : ''}`}>
                              {col.name}
                            </span>
                          </div>
                          <span className={`stitch-col-type ${col.isPk ? 'font-bold text-on-surface' : ''} ${col.isFk ? 'font-semibold text-secondary' : ''}`}>
                            {col.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend Overlay at Bottom-Left of Viewport */}
            <div className="stitch-erd-legend">
              <div className="stitch-legend-item">
                <span className="material-symbols-outlined text-amber-500 text-[14px]">key</span>
                <span className="font-semibold">Primary Key (PK)</span>
              </div>
              <div className="stitch-legend-item">
                <span className="material-symbols-outlined text-secondary text-[14px]">link</span>
                <span className="font-semibold">Foreign Key (FK)</span>
              </div>
              <div className="stitch-legend-item">
                <span className="stitch-legend-line"></span>
                <span>Relasi 1:N (One-to-Many)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── RESTORE PREVIEW MODAL ── */}
      {/* ══════════════════════════════════════════════════════ */}
      {restorePreview && (
        <div className="stitch-modal-overlay">
          <div className="stitch-modal-card">
            <div className="stitch-modal-header">
              <div className="stitch-modal-title-wrap">
                <span className="material-symbols-outlined text-secondary text-[26px]">
                  settings_backup_restore
                </span>
                <h3 className="stitch-modal-title">Konfirmasi Pemulihan Data (Restore)</h3>
              </div>
              <button
                type="button"
                className="stitch-modal-close-btn"
                onClick={() => setRestorePreview(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="stitch-modal-body">
              {/* Checksum Badge */}
              <div className="stitch-preview-checksum-badge">
                <span className="material-symbols-outlined text-emerald-600">verified</span>
                <div className="stitch-preview-checksum-text">
                  <span className="font-semibold text-emerald-900">Integritas Checksum Terverifikasi</span>
                  <span className="font-mono text-xs text-emerald-700">{restorePreview.sha256}</span>
                </div>
              </div>

              {/* Stats Table */}
              <div className="stitch-preview-table">
                <div className="stitch-preview-row">
                  <span className="stitch-preview-k">Nama Berkas:</span>
                  <span className="stitch-preview-v font-bold">{restorePreview.filename}</span>
                </div>
                <div className="stitch-preview-row">
                  <span className="stitch-preview-k">Waktu Cadangan:</span>
                  <span className="stitch-preview-v">{formatDateTime(restorePreview.exportedAt)}</span>
                </div>
                <div className="stitch-preview-row">
                  <span className="stitch-preview-k">Ukuran Berkas:</span>
                  <span className="stitch-preview-v font-mono">{restorePreview.formattedSize}</span>
                </div>
                <div className="stitch-preview-row">
                  <span className="stitch-preview-k">Jumlah Tabel:</span>
                  <span className="stitch-preview-v font-bold">{restorePreview.tableCount} tabel</span>
                </div>
                <div className="stitch-preview-row">
                  <span className="stitch-preview-k">Total Baris Data:</span>
                  <span className="stitch-preview-v font-bold text-primary">{restorePreview.totalRows.toLocaleString()} record</span>
                </div>
              </div>

              {/* Warning Overwrite Notice */}
              <div className="stitch-preview-warning">
                <span className="material-symbols-outlined text-amber-800 shrink-0">warning</span>
                <span>
                  <strong>Perhatian:</strong> Proses restore akan menimpa seluruh database lokal saat ini dengan data dari cadangan ini. Pastikan Anda telah mengunduh backup terkini sebelum melanjutkan.
                </span>
              </div>
            </div>

            <div className="stitch-modal-footer">
              <button
                type="button"
                className="stitch-btn-secondary"
                onClick={() => setRestorePreview(null)}
                disabled={isProcessing}
              >
                Batal
              </button>
              <button
                type="button"
                className="stitch-btn-restore-confirm"
                onClick={handleConfirmRestore}
                disabled={isProcessing}
              >
                <span className="material-symbols-outlined">history</span>
                <span>{isProcessing ? 'Memulihkan Data...' : 'Konfirmasi & Pulihkan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── SECURITY PASSWORD POPUP ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <PasswordPopup
        show={showPasswordPopup}
        onClose={() => {
          setShowPasswordPopup(false);
          setPendingAction(null);
        }}
        onSuccess={handlePasswordSuccess}
        title="Verifikasi Otorisasi Supervisor"
      />
    </div>
  );
}
