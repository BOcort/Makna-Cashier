// Application routes
import { Route, Routes, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useLocation } from '../contexts/LocationContext.jsx';
import {
  Home, Menu, Report, Payment, Location, Backup, Login, NotFound
} from '../pages';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;
  return children;
}

function RequireLocation({ children }) {
  const { hasLocation } = useLocation();
  if (!hasLocation) return <Navigate to="/location" replace />;
  return children;
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          index
          element={
            <RequireLocation>
              <Home />
            </RequireLocation>
          }
        />
        <Route path="menu" element={<Menu />} />
        <Route path="report" element={<Report />} />
        <Route path="payment" element={<Payment />} />
        <Route path="location" element={<Location />} />
        <Route path="backup" element={<Backup />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
