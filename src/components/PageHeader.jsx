import ProtocolLeaders from './ProtocolLeaders';
import './PageHeader.scss';

// Top of the inner citizen pages: the official Govt. strip, then the page title.
export default function PageHeader({ title, sub, icon, onBack }) {
  return (
    <header className="page-head">
      <ProtocolLeaders variant="ribbon" />
      <div className="page-head__row">
        {onBack && (
          <button className="page-head__back" onClick={onBack} aria-label="Back">
            <i className="bi bi-chevron-left" />
          </button>
        )}
        {icon && !onBack && <span className="page-head__icon"><i className={`bi ${icon}`} /></span>}
        <div className="page-head__text">
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </div>
      </div>
    </header>
  );
}
