// Reusable Modal component
import { useEffect, useRef } from 'react';

export default function Modal({ show, onClose, title, children, footer, size = 'default' }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      onClose?.();
    }
  };

  return (
    <div className="modal-backdrop show" ref={backdropRef} onClick={handleBackdropClick}>
      <div className={`modal ${size === 'large' ? 'modal-lg' : ''}`}>
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">×</button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
