// Database context — provides initialized database to all components
import { createContext, useContext, useState, useEffect } from 'react';
import { initDatabase } from '../services/db.js';

const DatabaseContext = createContext(null);

export function DatabaseProvider({ children }) {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch(err => {
        console.error('Database init failed:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="db-error-screen">
        <div className="db-error-card">
          <span className="db-error-icon">⚠️</span>
          <h2>Database Error</h2>
          <p>Gagal menginisialisasi database: {error}</p>
          <p className="db-error-hint">Pastikan browser mendukung IndexedDB dan WebAssembly.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!dbReady) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo">☕</div>
          <h2 className="loading-title">Makna Coffee</h2>
          <div className="loading-spinner"></div>
          <p className="loading-text">Memuat database...</p>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ dbReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}

export default DatabaseContext;
