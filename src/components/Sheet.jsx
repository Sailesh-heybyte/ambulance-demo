import './Sheet.scss';

export default function Sheet({ open, onClose, title, children }) {
  return (
    <div className={`sheet ${open ? 'sheet--open' : ''}`}>
      <div className="sheet__overlay" onClick={onClose} />
      <div className="sheet__panel">
        <div className="sheet__handle" />
        <div className="sheet__head">
          <h3>{title}</h3>
          <button className="sheet__close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}