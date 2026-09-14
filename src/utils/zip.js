// Pure JavaScript ZIP Writer and Reader for Makna Coffee POS
// Runs 100% offline in browser without external dependencies

// ── CRC-32 Table & Calculator ──
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

export function calculateCRC32(uint8Array) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < uint8Array.length; i++) {
    crc = crcTable[(crc ^ uint8Array[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Convert Date to DOS time/date format
function getDosDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const time = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  return { time, date: dosDate };
}

export class SimpleZip {
  constructor() {
    this.files = []; // { name, data (Uint8Array), date }
  }

  /**
   * Add a text file or JSON to the ZIP archive
   */
  addTextFile(filename, textContent) {
    const encoder = new TextEncoder();
    const data = encoder.encode(textContent);
    this.files.push({
      name: filename,
      data,
      date: new Date()
    });
  }

  /**
   * Add a binary file (Uint8Array or ArrayBuffer)
   */
  addBinaryFile(filename, binaryData) {
    const data = binaryData instanceof Uint8Array 
      ? binaryData 
      : new Uint8Array(binaryData);
    this.files.push({
      name: filename,
      data,
      date: new Date()
    });
  }

  /**
   * Add a base64 or DataURL file
   */
  addDataUrl(filename, dataUrl) {
    const base64Data = dataUrl.split(',')[1] || dataUrl;
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    this.addBinaryFile(filename, bytes);
  }

  /**
   * Generate complete ZIP Blob
   */
  generateBlob() {
    const encoder = new TextEncoder();
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    for (const file of this.files) {
      const nameBytes = encoder.encode(file.name);
      const crc = calculateCRC32(file.data);
      const size = file.data.length;
      const { time, date } = getDosDateTime(file.date);

      // Local file header (30 bytes + filename + data)
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true); // Local header signature
      lv.setUint16(4, 20, true);         // Version needed: 2.0
      lv.setUint16(6, 0x0800, true);     // Flags: UTF-8 filename
      lv.setUint16(8, 0, true);          // Compression: Store (0)
      lv.setUint16(10, time, true);      // Mod time
      lv.setUint16(12, date, true);      // Mod date
      lv.setUint32(14, crc, true);       // CRC32
      lv.setUint32(18, size, true);      // Compressed size
      lv.setUint32(22, size, true);      // Uncompressed size
      lv.setUint16(26, nameBytes.length, true); // Filename length
      lv.setUint16(28, 0, true);         // Extra field length
      localHeader.set(nameBytes, 30);

      localHeaders.push(localHeader, file.data);

      // Central directory header (46 bytes + filename)
      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(centralHeader.buffer);
      cv.setUint32(0, 0x02014b50, true); // Central header signature
      cv.setUint16(4, 63, true);         // Version made by
      cv.setUint16(6, 20, true);         // Version needed: 2.0
      cv.setUint16(8, 0x0800, true);     // Flags: UTF-8
      cv.setUint16(10, 0, true);         // Compression: Store (0)
      cv.setUint16(12, time, true);      // Mod time
      cv.setUint16(14, date, true);      // Mod date
      cv.setUint32(16, crc, true);       // CRC32
      cv.setUint32(20, size, true);      // Compressed size
      cv.setUint32(24, size, true);      // Uncompressed size
      cv.setUint16(28, nameBytes.length, true); // Filename length
      cv.setUint16(30, 0, true);         // Extra field length
      cv.setUint16(32, 0, true);         // File comment length
      cv.setUint16(34, 0, true);         // Disk number start
      cv.setUint16(36, 0, true);         // Internal attributes
      cv.setUint32(38, 0, true);         // External attributes
      cv.setUint32(42, offset, true);    // Relative offset of local header
      centralHeader.set(nameBytes, 46);

      centralHeaders.push(centralHeader);

      offset += localHeader.length + file.data.length;
    }

    const centralDirOffset = offset;
    let centralDirSize = 0;
    for (const ch of centralHeaders) {
      centralDirSize += ch.length;
    }

    // End of central directory record (22 bytes)
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);            // EOCD signature
    ev.setUint16(4, 0, true);                     // Disk number
    ev.setUint16(6, 0, true);                     // Disk where CD starts
    ev.setUint16(8, this.files.length, true);     // Total entries on disk
    ev.setUint16(10, this.files.length, true);    // Total entries
    ev.setUint32(12, centralDirSize, true);       // Central dir size
    ev.setUint32(16, centralDirOffset, true);     // Offset of CD
    ev.setUint16(20, 0, true);                    // Comment length

    const allChunks = [...localHeaders, ...centralHeaders, eocd];
    return new Blob(allChunks, { type: 'application/zip' });
  }
}

/**
 * Extract files from an uncompressed or standard ZIP ArrayBuffer
 * Returns array of { name, text, data }
 */
export function extractZipFiles(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder();
  const extracted = [];

  let pos = 0;
  while (pos < bytes.length - 30) {
    const sig = view.getUint32(pos, true);
    if (sig === 0x04034b50) {
      // Local file header
      const compression = view.getUint16(pos + 8, true);
      const compSize = view.getUint32(pos + 18, true);
      const uncompSize = view.getUint32(pos + 22, true);
      const nameLen = view.getUint16(pos + 26, true);
      const extraLen = view.getUint16(pos + 28, true);

      const nameBytes = bytes.subarray(pos + 30, pos + 30 + nameLen);
      const filename = decoder.decode(nameBytes);

      const dataStart = pos + 30 + nameLen + extraLen;
      const fileData = bytes.subarray(dataStart, dataStart + compSize);

      let textContent = null;
      if (compression === 0) {
        try {
          textContent = decoder.decode(fileData);
        } catch {
          textContent = null;
        }
      }

      extracted.push({
        name: filename,
        data: fileData,
        text: textContent,
        uncompressedSize: uncompSize,
        compression
      });

      pos = dataStart + compSize;
    } else {
      pos++;
    }
  }

  return extracted;
}
