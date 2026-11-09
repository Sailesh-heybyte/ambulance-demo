// HTML for map markers, shared by the Home, booking and tracking maps

// Ambulance seen from above. Nose points UP (north), so rotate it by the heading.
export const AMBULANCE_SVG = `
<svg class="amb-top__svg" viewBox="0 0 40 72" width="26" height="46" aria-hidden="true">
  <rect x="5" y="7" width="30" height="60" rx="8" fill="rgba(0,0,0,.18)" transform="translate(1.5 2.5)"/>
  <rect x="5" y="5" width="30" height="62" rx="8" fill="#FFFFFF" stroke="#C9CED6" stroke-width="1"/>
  <path d="M9 13 Q20 6 31 13 L30 21 Q20 17 10 21 Z" fill="#253041"/>
  <rect x="9" y="27" width="22" height="5" rx="2" fill="#253041" opacity=".14"/>
  <rect x="9" y="27" width="5" height="5" rx="1.5" class="amb-top__light amb-top__light--red"/>
  <rect x="26" y="27" width="5" height="5" rx="1.5" class="amb-top__light amb-top__light--blue"/>
  <path d="M17.5 37h5v5h5v5h-5v5h-5v-5h-5v-5h5z" fill="#E8474C"/>
  <rect x="5" y="56" width="30" height="3.5" fill="#E8474C"/>
  <rect x="7.5" y="62" width="25" height="3" rx="1.5" fill="#C9CED6"/>
</svg>`;

export const ambulanceHtml = (extra = '') =>
  `<div class="amb-top ${extra}"><span class="amb-top__pulse"></span><div class="amb-top__body">${AMBULANCE_SVG}</div></div>`;

// Round pin with an icon (patient / hospital / drop)
export const pinHtml = (cls, icon) => `<div class="map-pin ${cls}"><i class="bi ${icon}"></i></div>`;

// Pin with a white label above it
export const labelledPinHtml = (cls, icon, label) =>
  `<div class="map-tag">${label ? `<span class="map-label">${label}</span>` : ''}${pinHtml(cls, icon)}</div>`;

// Compass bearing a → b in degrees (0 = north). Points are [lat, lng].
export function bearing(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b[1] - a[1])) * Math.cos(toRad(b[0]));
  const x =
    Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) -
    Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(toRad(b[1] - a[1]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
