// Search bar component
import { useRef } from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Cari menu...' }) {
  const inputRef = useRef(null);

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
      {value && (
        <button 
          className="search-clear" 
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          type="button"
          aria-label="Hapus pencarian"
        >
          ×
        </button>
      )}
    </div>
  );
}
