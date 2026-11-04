export default function AmbulanceArt() {
  return (
    <svg viewBox="0 0 220 120" width="210" role="img" aria-label="Ambulance">
      {/* speed lines */}
      <g stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6">
        <line x1="4" y1="46" x2="34" y2="46" />
        <line x1="12" y1="60" x2="40" y2="60" />
        <line x1="2" y1="74" x2="30" y2="74" />
      </g>

      {/* body and cab */}
      <rect x="44" y="26" width="120" height="58" rx="8" fill="#fff" />
      <path
        d="M164 40 h24 q8 0 12 8 l10 18 q2 4 2 8 v10 h-48 z"
        fill="#fff"
      />
      <path d="M170 46 h16 q4 0 6 4 l7 13 h-29 z" fill="#f4b6b8" />

      {/* red stripe and cross */}
      <rect x="44" y="62" width="120" height="8" fill="#e8474c" />
      <rect x="90" y="34" width="8" height="22" rx="2" fill="#e8474c" />
      <rect x="83" y="41" width="22" height="8" rx="2" fill="#e8474c" />

      {/* siren */}
      <rect x="98" y="16" width="20" height="10" rx="3" fill="#ffd54f" />

      {/* wheels */}
      <circle cx="80" cy="92" r="13" fill="#1f2937" />
      <circle cx="80" cy="92" r="5" fill="#cfd3d8" />
      <circle cx="178" cy="92" r="13" fill="#1f2937" />
      <circle cx="178" cy="92" r="5" fill="#cfd3d8" />
    </svg>
  );
}