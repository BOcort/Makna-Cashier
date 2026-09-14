// Formatting utilities for Makna Coffee POS

/**
 * Format number as Indonesian Rupiah
 */
export function formatRupiah(amount) {
  if (amount === null || amount === undefined) return 'Rp0';
  return 'Rp' + Number(amount).toLocaleString('id-ID');
}

/**
 * Format date string to locale display
 */
export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date to short format (DD/MM/YYYY)
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format time from date string
 */
export function formatTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Format datetime
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return `${formatDateShort(dateStr)} ${formatTime(dateStr)}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayISO() {
  const now = new Date();
  return now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
}

/**
 * Get date N days ago as YYYY-MM-DD
 */
export function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/**
 * Get first day of current month
 */
export function getFirstDayOfMonth() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-01';
}

/**
 * Month name in Indonesian
 */
export function getMonthName(monthNum) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[parseInt(monthNum, 10) - 1] || '';
}

/**
 * Download a file from data
 */
export function downloadFile(data, filename, mimeType = 'application/json') {
  const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read file as text
 */
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Read file as base64 data URL
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
