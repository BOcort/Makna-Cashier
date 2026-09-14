// Bottom Navigation Bar matching Stitch design with Material Symbols
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Kasir', icon: 'point_of_sale' },
  { to: '/menu', label: 'Menu', icon: 'restaurant_menu' },
  { to: '/report', label: 'Report', icon: 'bar_chart' },
  { to: '/payment', label: 'Bayar', icon: 'payments' },
  { to: '/location', label: 'Lokasi', icon: 'near_me' },
  { to: '/backup', label: 'Backup', icon: 'cloud_sync' },
];

export default function Footer() {
  return (
    <nav className="stitch-bottom-nav" aria-label="Main Navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `stitch-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <span className="material-symbols-outlined stitch-nav-icon">
            {item.icon}
          </span>
          <span className="stitch-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
