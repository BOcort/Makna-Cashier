// Login page — username & password authentication
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const usernameInputRef = useRef(null);

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Masukkan username');
      return;
    }
    if (!password) {
      setError('Masukkan password');
      return;
    }

    setLoading(true);
    try {
      const result = await login(username.trim(), password);
      if (!result) {
        setError('Username atau password salah');
      }
    } catch {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">☕</div>
        <h1 className="login-title">Makna Coffee</h1>
        <p className="login-subtitle">Masuk ke sistem kasir</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              ref={usernameInputRef}
              type="text"
              className="text-input"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={loading}
              spellCheck={false}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="text-input"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <p className="field-error">{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}

