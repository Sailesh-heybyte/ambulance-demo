import { useState } from 'react';
import './GovtEmblem.scss';

// Official Govt. of Andhra Pradesh logo.
// Put the official file at  public/ap-govt-logo.png  (transparent PNG, square, 300px+).
// Until then a clean gold-ring placeholder is shown.
export default function GovtEmblem({ size = 96, className = '' }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`govt-emblem ${className}`}
      style={{ width: size, height: size, fontSize: typeof size === 'number' ? Math.max(6, size * 0.075) : undefined }}
    >
      {!failed ? (
        <img src="/ap-govt-logo.png" alt="Government of Andhra Pradesh" onError={() => setFailed(true)} />
      ) : (
        <span className="govt-emblem__placeholder" role="img" aria-label="Government of Andhra Pradesh">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" fill="#DC2626" />
            <path d="M11 7h2v4h4v2h-4v4h-2v-4H7v-2h4V7z" fill="#FFFFFF" />
          </svg>
          <span className="govt-emblem__label">GOVT. OF A.P.</span>
        </span>
      )}
    </span>
  );
}
