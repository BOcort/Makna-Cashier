// Main layout wrapper — header + content + bottom nav
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function MainLayout() {
  return (
    <div className="app">
      <Header />
      <div className="app-content">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
