// NotFound page
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-inner" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>☕</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '8px', color: 'var(--wood-dark)' }}>
        Halaman Tidak Ditemukan
      </h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>
        Maaf, halaman yang kamu cari tidak ada.
      </p>
      <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
        Kembali ke Kasir
      </Link>
    </div>
  );
}
