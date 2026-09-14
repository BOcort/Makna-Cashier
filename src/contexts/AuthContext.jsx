// Auth context — manages user authentication state
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userQueries } from '../services/queries.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const count = userQueries.count();
        if (count === 0) {
          const defaultUsername = import.meta.env.VITE_INITIAL_USERNAME || 'admin';
          const defaultPassword = import.meta.env.VITE_INITIAL_PASSWORD || 'makna2024';
          const defaultQR = import.meta.env.VITE_QR_SECRET || 'MAKNA-QR-2024-SECRET';
          const hash = await hashPassword(defaultPassword);
          userQueries.create(defaultUsername, hash, defaultQR);
        }

        // Check session
        const sessionUser = sessionStorage.getItem('makna_user');
        if (sessionUser) {
          try {
            setUser(JSON.parse(sessionUser));
          } catch {
            sessionStorage.removeItem('makna_user');
          }
        }
      } catch (err) {
        console.error('Failed to init auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const setupUser = useCallback(async (username, password, qrCode) => {
    const hash = await hashPassword(password);
    const id = userQueries.create(username, hash, qrCode);
    const userData = { id, username };
    setUser(userData);
    setIsFirstTime(false);
    sessionStorage.setItem('makna_user', JSON.stringify(userData));
    return userData;
  }, []);

  const login = useCallback(async (usernameOrPassword, password) => {
    let userToCheck = null;
    let passToCheck = '';

    if (password !== undefined) {
      // login(username, password)
      const cleanUsername = (usernameOrPassword || '').trim();
      passToCheck = password;
      userToCheck = userQueries.getByUsername(cleanUsername);

      // Fallback check against .env if user not found in DB
      const defaultUsername = import.meta.env.VITE_INITIAL_USERNAME || 'admin';
      const defaultPassword = import.meta.env.VITE_INITIAL_PASSWORD || 'makna2024';
      if (!userToCheck && cleanUsername.toLowerCase() === defaultUsername.toLowerCase() && passToCheck === defaultPassword) {
        const defaultQR = import.meta.env.VITE_QR_SECRET || 'MAKNA-QR-2024-SECRET';
        const hash = await hashPassword(defaultPassword);
        const id = userQueries.create(defaultUsername, hash, defaultQR);
        userToCheck = { id, username: defaultUsername, password_hash: hash };
      }
    } else {
      // login(password) fallback
      passToCheck = usernameOrPassword;
      const hash = await hashPassword(passToCheck);
      const users = userQueries.getAll();
      for (const u of users) {
        const full = userQueries.getByUsername(u.username);
        if (full && full.password_hash === hash) {
          userToCheck = full;
          break;
        }
      }
    }

    if (!userToCheck) return null;

    const isValid = await verifyPassword(passToCheck, userToCheck.password_hash);
    if (isValid) {
      const userData = { id: userToCheck.id, username: userToCheck.username };
      setUser(userData);
      sessionStorage.setItem('makna_user', JSON.stringify(userData));
      return userData;
    }
    return null;
  }, []);

  const loginWithQR = useCallback((qrCode) => {
    const found = userQueries.getByQRCode(qrCode);
    if (found) {
      const userData = { id: found.id, username: found.username };
      setUser(userData);
      sessionStorage.setItem('makna_user', JSON.stringify(userData));
      return userData;
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('makna_user');
  }, []);

  const verifyAccess = useCallback(async (password) => {
    if (!user) return false;
    let full = userQueries.getByUsername(user.username);
    if (!full) {
      const defaultUsername = import.meta.env.VITE_INITIAL_USERNAME || 'admin';
      const defaultPassword = import.meta.env.VITE_INITIAL_PASSWORD || 'makna2024';
      if (user.username.toLowerCase() === defaultUsername.toLowerCase()) {
        return password === defaultPassword;
      }
      return false;
    }
    return await verifyPassword(password, full.password_hash);
  }, [user]);

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{
      user,
      isFirstTime,
      isAuthenticated: !!user,
      setupUser,
      login,
      loginWithQR,
      logout,
      verifyAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
