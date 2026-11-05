import { useId } from 'react';
import GovtEmblem from './GovtEmblem';
import './BrandLogo.scss';

// 108 Ambulance mark: red Star of Life with the rod of Asclepius.
// "seal" = round seal with ring text (for 56px and up), "icon" = plain round mark (small sizes).
export function AmbulanceMark({ size = 48, variant, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const kind = variant || (size >= 56 ? 'seal' : 'icon');

  if (kind === 'icon') {
    return (
      <svg className={`amb-mark ${className}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="108 Ambulance">
        <defs><rect id={`a${uid}`} x="-9.4" y="-36" width="18.8" height="72" rx="3.2" /></defs>
        <circle cx="60" cy="60" r="59" fill="#D4A73A" />
        <circle cx="60" cy="60" r="55" fill="#DC2626" />
        <g transform="translate(60 60)">
          <g fill="#fff">
            <use href={`#a${uid}`} />
            <use href={`#a${uid}`} transform="rotate(60)" />
            <use href={`#a${uid}`} transform="rotate(-60)" />
          </g>
          <line x1="0" y1="-26" x2="0" y2="27" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
          <path d="M-6.4,21.5 C8,17.8 8,11 0,8.8 C-8.1,6.6 -8.1,-0.5 0,-2.5 C8.1,-4.4 8.1,-11.5 0.7,-13.5" fill="none" stroke="#DC2626" strokeWidth="2.9" strokeLinecap="round" />
          <ellipse cx="-2" cy="-15.5" rx="3.6" ry="2.6" fill="#DC2626" transform="rotate(-18 -2 -15.5)" />
        </g>
      </svg>
    );
  }

  return (
    <svg className={`amb-mark ${className}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="108 Emergency Service, Andhra Pradesh">
      <defs>
        <path id={`t${uid}`} d="M 15.5,60 A 44.5,44.5 0 0,1 104.5,60" />
        <path id={`b${uid}`} d="M 10,60 A 50,50 0 0,0 110,60" />
        <rect id={`a${uid}`} x="-7.6" y="-29" width="15.2" height="58" rx="2.6" />
      </defs>
      <circle cx="60" cy="60" r="59" fill="#fff" />
      <circle cx="60" cy="60" r="57.6" fill="none" stroke="#D4A73A" strokeWidth="2.4" />
      <circle cx="60" cy="60" r="54.5" fill="#DC2626" />
      <circle cx="60" cy="60" r="53.2" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".6" />
      <g fill="#fff" fontFamily="'Plus Jakarta Sans','Segoe UI',Roboto,Arial,sans-serif" fontWeight="800" fontSize="7.6" letterSpacing=".4">
        <text><textPath href={`#t${uid}`} startOffset="50%" textAnchor="middle" textLength="116" lengthAdjust="spacing">108 EMERGENCY SERVICE</textPath></text>
        <text><textPath href={`#b${uid}`} startOffset="50%" textAnchor="middle" textLength="96" lengthAdjust="spacing">ANDHRA PRADESH</textPath></text>
      </g>
      <g fill="#F5D27A">
        <path d="M10.6,60 l1.6,-1.6 l1.6,1.6 l-1.6,1.6z" />
        <path d="M106.2,60 l1.6,-1.6 l1.6,1.6 l-1.6,1.6z" />
      </g>
      <circle cx="60" cy="60" r="40.2" fill="#fff" />
      <circle cx="60" cy="60" r="38.4" fill="none" stroke="#D4A73A" strokeWidth="1" />
      <g transform="translate(60 60)">
        <g fill="#DC2626">
          <use href={`#a${uid}`} />
          <use href={`#a${uid}`} transform="rotate(60)" />
          <use href={`#a${uid}`} transform="rotate(-60)" />
        </g>
        <line x1="0" y1="-21" x2="0" y2="22" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M-5.2,17.5 C6.5,14.5 6.5,9 0,7.2 C-6.6,5.4 -6.6,-0.4 0,-2 C6.6,-3.6 6.6,-9.4 0.6,-11" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" />
        <ellipse cx="-1.6" cy="-12.6" rx="2.9" ry="2.1" fill="#fff" transform="rotate(-18 -1.6 -12.6)" />
      </g>
    </svg>
  );
}

// Official lockup: Govt. of AP emblem | 108 Ambulance mark | wordmark.
// layout: 'horizontal' (app bars) | 'stacked' (splash, sign-in) | 'pair' (two marks overlapped, no text)
export default function BrandLogo({
  size = 44,
  layout = 'horizontal',
  showText = true, // shown in every layout
  sub = 'Govt. of Andhra Pradesh',
  className = '',
}) {
  const marks = (
    <span className="brand-logo__marks">
      <GovtEmblem size={size} className="brand-logo__emblem" />
      {layout !== 'pair' && <span className="brand-logo__divider" style={{ height: size * 0.7 }} />}
      <AmbulanceMark size={size} className="brand-logo__mark" />
    </span>
  );

  return (
    <div
      className={`brand-logo brand-logo--${layout} ${className}`}
      style={{ '--bl-size': `${size}px` }}
    >
      {marks}
      {showText && (
        <span className="brand-logo__text">
          <span className="brand-logo__word"><b>108</b> Ambulance</span>
          {sub && <span className="brand-logo__sub">{sub}</span>}
        </span>
      )}
    </div>
  );
}
