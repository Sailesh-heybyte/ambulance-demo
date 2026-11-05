import React from 'react';

export default function AmbulanceHero({ className = '' }) {
  return (
    <div className={`ambulance-hero ${className}`}>
      <svg
        viewBox="0 0 340 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="ambulance-hero__svg"
      >
        <defs>
          {/* Beacon Glow Filter */}
          <filter id="beaconGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Ground Shadow Gradient */}
          <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* --- Siren Flash Waves --- */}
        <g className="ambulance-hero__siren-glow">
          <circle cx="150" cy="52" r="18" fill="#EF4444" opacity="0.35" filter="url(#beaconGlow)" />
          <path d="M140 38 L130 26" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          <path d="M150 34 L150 20" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          <path d="M160 38 L170 26" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* --- Ground Baseline (matching reference line) --- */}
        <line
          x1="30"
          y1="205"
          x2="310"
          y2="205"
          stroke="#1E293B"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* --- Ground Shadow --- */}
        <ellipse cx="170" cy="204" rx="100" ry="8" fill="url(#shadowGrad)" />

        {/* --- Ambulance Vehicle Group (with subtle idle float animation) --- */}
        <g className="ambulance-hero__vehicle">
          {/* Siren Lights Mount & Bulbs */}
          <rect x="138" y="54" width="24" height="8" rx="3" fill="#334155" />
          <path d="M140 54 C140 47, 148 47, 148 54 Z" fill="#EF4444" />
          <path d="M152 54 C152 47, 160 47, 160 54 Z" fill="#3B82F6" />

          {/* Main Vehicle Body (Chunky, friendly rounded shape) */}
          <path
            d="M72 176 
               H244 
               C254 176, 262 168, 262 158 
               V126 
               C262 118, 256 112, 248 108 
               L220 94 
               C214 91, 206 88, 198 88 
               H80 
               C71 88, 64 95, 64 104 
               V168 
               C64 172.4, 67.6 176, 72 176 Z"
            fill="#FFFFFF"
            stroke="#1E293B"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Front Bumper */}
          <rect
            x="256"
            y="152"
            width="12"
            height="18"
            rx="5"
            fill="#E2E8F0"
            stroke="#1E293B"
            strokeWidth="3.5"
          />

          {/* Windshield / Cab Glass */}
          <path
            d="M198 96 
               H214 
               C218 96, 222 98, 225 101 
               L244 116 
               C247 119, 249 123, 249 127 
               V132 
               H192 
               V102 
               C192 98.7, 194.7 96, 198 96 Z"
            fill="#BAE6FD"
            stroke="#1E293B"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Windshield Shine Accent */}
          <path
            d="M206 102 L236 126"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Side Patient Window */}
          <rect
            x="80"
            y="98"
            width="42"
            height="32"
            rx="6"
            fill="#E0F2FE"
            stroke="#1E293B"
            strokeWidth="3.5"
          />
          <path
            d="M86 104 L114 124"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Bold Emergency Red Stripe */}
          <path
            d="M64 140 H261 V155 H64 Z"
            fill="#E53935"
          />
          <line
            x1="64"
            y1="140"
            x2="261"
            y2="140"
            stroke="#1E293B"
            strokeWidth="3.5"
          />
          <line
            x1="64"
            y1="155"
            x2="261"
            y2="155"
            stroke="#1E293B"
            strokeWidth="3.5"
          />

          {/* Medical Red Cross Badge */}
          <circle
            cx="154"
            cy="118"
            r="16"
            fill="#FFFFFF"
            stroke="#1E293B"
            strokeWidth="3"
          />
          {/* Cross Horizontal */}
          <rect x="144" y="115" width="20" height="6" rx="2" fill="#E53935" />
          {/* Cross Vertical */}
          <rect x="151" y="108" width="6" height="20" rx="2" fill="#E53935" />

          {/* Headlight */}
          <path
            d="M258 138 C263 138, 266 142, 266 146 C266 150, 263 154, 258 154 Z"
            fill="#FBBF24"
            stroke="#1E293B"
            strokeWidth="3"
          />

          {/* Door Line */}
          <line
            x1="186"
            y1="90"
            x2="186"
            y2="176"
            stroke="#1E293B"
            strokeWidth="3.5"
          />
          {/* Door Handle */}
          <rect x="194" y="145" width="10" height="4" rx="2" fill="#1E293B" />

          {/* Wheel Arches & Wheels */}
          {/* Rear Wheel Arch Cutout */}
          <circle cx="106" cy="176" r="22" fill="#FAF9F6" stroke="#1E293B" strokeWidth="3.5" />
          {/* Front Wheel Arch Cutout */}
          <circle cx="220" cy="176" r="22" fill="#FAF9F6" stroke="#1E293B" strokeWidth="3.5" />

          {/* Rear Wheel */}
          <g>
            <circle cx="106" cy="178" r="19" fill="#1E293B" />
            <circle cx="106" cy="178" r="9" fill="#E2E8F0" stroke="#64748B" strokeWidth="2.5" />
            <circle cx="106" cy="178" r="3" fill="#1E293B" />
          </g>

          {/* Front Wheel */}
          <g>
            <circle cx="220" cy="178" r="19" fill="#1E293B" />
            <circle cx="220" cy="178" r="9" fill="#E2E8F0" stroke="#64748B" strokeWidth="2.5" />
            <circle cx="220" cy="178" r="3" fill="#1E293B" />
          </g>
        </g>
      </svg>
    </div>
  );
}

