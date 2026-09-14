// Crypto utilities for Makna Coffee POS
// Uses Web Crypto API (SHA-256) — runs in browser natively

/**
 * Hash a password using SHA-256
 * Returns hex string
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate SHA-256 checksum from a File or Blob
 * Returns hex string
 */
export async function calculateFileSHA256(fileOrBlob) {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate SHA-256 checksum from text or object data
 * Returns hex string
 */
export async function calculateDataSHA256(data) {
  const encoder = new TextEncoder();
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  const encoded = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against stored hash
 */
export async function verifyPassword(password, storedHash) {
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

/**
 * Generate a random QR code identifier
 */
export function generateQRCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = crypto.getRandomValues(new Uint8Array(24));
  let result = 'MAKNA-';
  for (let i = 0; i < randomValues.length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

