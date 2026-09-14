// Password verification popup component
import { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function PasswordPopup({ show, onClose, onSuccess, title = 'Verifikasi Akses' }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const { verifyAccess } = useAuth();

  useEffect(() => {
    if (show) {
      setPassword('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Masukkan password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const valid = await verifyAccess(password);
      if (valid) {
        setPassword('');
        setError('');
        onSuccess?.();
      } else {
        setError('Password salah');
        setPassword('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        <div className="password-popup-content">
          <div className="password-popup-icon">🔒</div>
          <p className="password-popup-text">Masukkan password untuk melanjutkan</p>
          <input
            ref={inputRef}
            type="password"
            className="text-input password-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
          />
          {error && <p className="field-error">{error}</p>}
        </div>
        <div className="modal-buttons">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
