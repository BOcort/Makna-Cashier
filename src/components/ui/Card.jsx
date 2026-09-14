// Reusable Card component
export default function Card({ title, children, className = '', action }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          {title && <div className="card-title">{title}</div>}
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}
