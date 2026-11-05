import React from 'react';
import cbnImg from '@/assets/protocol/cbn.jpg';
import lokeshImg from '@/assets/protocol/lokesh.jpg';
import './ProtocolLeaders.scss';

const LEADERS = [
  {
    id: 'cbn',
    name: 'N. Chandrababu Naidu',
    title: 'Hon’ble Chief Minister',
    src: cbnImg,
    scale: 1.1,
  },
  {
    id: 'lokesh',
    name: 'Nara Lokesh',
    title: 'Hon’ble Minister',
    src: lokeshImg,
    scale: 1.1,
  },
];

export default function ProtocolLeaders({
  variant = 'ribbon', // 'ribbon' | 'banner' | 'card'
  size = 'md', // 'sm' | 'md' | 'lg'
  showBadge = true,
  className = '',
}) {
  const showSub = variant === 'ribbon';
  return (
    <div className={`protocol-leaders protocol-leaders--${variant} protocol-leaders--${size} ${className}`}>
      {/* State Insignia / Title */}
      {showBadge && (
        <div className="protocol-leaders__badge">
          <svg className="protocol-leaders__emblem" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
              fill="#DC2626"
            />
            <path d="M11 7h2v4h4v2h-4v4h-2v-4H7v-2h4V7z" fill="#FFFFFF" />
          </svg>
          <span className="protocol-leaders__titles">
            <span className="protocol-leaders__title">Govt. of Andhra Pradesh</span>
            {showSub && <span className="protocol-leaders__dept">Health &amp; Family Welfare Dept.</span>}
          </span>
        </div>
      )}

      {/* Row of Leader Portraits (CBN & Nara Lokesh) */}
      <div className="protocol-leaders__avatars" role="group" aria-label="Official Dignitaries">
        {LEADERS.map((leader) => (
          <div
            key={leader.id}
            className="protocol-leaders__avatar-wrap"
            title={`${leader.name} - ${leader.title}`}
          >
            <div className="protocol-leaders__img-frame">
              <img
                src={leader.src}
                alt={leader.name}
                className="protocol-leaders__img"
                style={{ transform: `scale(${leader.scale || 1})` }}
              />
            </div>
          </div>
        ))}
      </div>

      {variant === 'banner' && (
        <div className="protocol-leaders__info">
          <span className="protocol-leaders__subtitle">108 Emergency Medical Services Mission</span>
        </div>
      )}
    </div>
  );
}
