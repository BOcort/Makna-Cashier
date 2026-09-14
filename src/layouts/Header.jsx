// Header component matching exact Stitch Makna Coffee design
import { useClock } from '../hooks/useClock.js';
import { useLocation } from '../contexts/LocationContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Header() {
  const { timeStr, shortDateStr } = useClock();
  const { activeLocation } = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="stitch-header">
      <div className="stitch-header-inner">
        {/* Brand & Branch */}
        <div className="stitch-header-left">
          <div className="stitch-header-logo-wrap">
            <img
              alt="Makna Coffee Logo"
              className="stitch-header-logo-img"
              src="https://lh3.googleusercontent.com/aida/AEtjO1W9PS-i_pN7kmcjDAYmhyRQjc8nY_jzTWPePLFzeL2kPRtlSIJOBmOHy1wx-tGdbqIaWWLvvwDfCf69EiuWFWvdodxOyH4Z3vkjFn8qT45jgweARPQitcyhIlRUDo0Y044zrI7LBgMMkPbwvGzgvzDYi-BQ-hz-6dnVFb22kSCN__JoZof6NIL-vc7kDlcragybyUTjIYgJg4ARQTnpAOxcUxDUKCDAKgM_QWPtnCtetu685F12LEFTwDin"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span className="stitch-header-logo-fallback" style={{ display: 'none' }}>☕</span>
          </div>

          <div className="stitch-brand-info">
            <h1 className="stitch-brand-title">Makna Coffee</h1>
            <span className="stitch-brand-divider">/</span>
            <div className="stitch-branch-pill">
              <span className="material-symbols-outlined stitch-branch-icon">storefront</span>
              <span className="stitch-branch-name">{activeLocation?.name || 'Abepura'}</span>
            </div>
          </div>
        </div>

        {/* Status, Clock, Profile */}
        <div className="stitch-header-right">
          <div className="stitch-clock-wrap">
            <span className="material-symbols-outlined stitch-clock-icon">schedule</span>
            <span className="stitch-clock-text">{timeStr}, {shortDateStr}</span>
          </div>

          <div className="stitch-online-badge">
            <span className="stitch-pulse-dot"></span>
            <span className="stitch-online-text">ONLINE</span>
          </div>

          <button
            type="button"
            className="stitch-avatar-btn"
            title={user ? `Login sebagai ${user.username} (Klik untuk Logout)` : 'Admin / Kasir'}
            onClick={() => {
              if (user && window.confirm('Apakah Anda ingin keluar (logout)?')) {
                logout();
              }
            }}
          >
            <span className="material-symbols-outlined stitch-avatar-icon">person</span>
          </button>
        </div>
      </div>
    </header>
  );
}
