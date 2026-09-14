// Selectable Chip component
export default function Chip({ label, active, onClick, variant = 'default', image, icon }) {
  const cls = [
    'chip',
    active ? 'active' : '',
    variant === 'payment' ? 'pm-chip' : '',
    image ? 'chip-with-img' : ''
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} onClick={onClick} type="button">
      {image && (
        <span className="chip-img">
          <img src={image} alt="" />
        </span>
      )}
      {icon && <span className="chip-icon">{icon}</span>}
      {label}
    </button>
  );
}
