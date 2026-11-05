import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Free OpenStreetMap tiles – no API key needed.
// (CARTO tiles now need an API key, which is why the map showed "API KEY REQUIRED".)
// The tiles are shown slightly muted (see .tracking-map in Tracking.scss) so the red route stands out.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const makeIcon = (cls, icon) =>
  L.divIcon({
    className: '',
    html: `<div class="map-pin ${cls}"><i class="bi ${icon}"></i></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

// Ambulance seen from above (like the bike/car in Rapido & Swiggy). Nose points UP (north).
const AMBULANCE_SVG = `
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

const ambulanceIcon = L.divIcon({
  className: '',
  html: `<div class="amb-top"><span class="amb-top__pulse"></span><div class="amb-top__body">${AMBULANCE_SVG}</div></div>`,
  iconSize: [56, 56],
  iconAnchor: [28, 28],
});

// ---------- geometry helpers ----------
const toRad = (d) => (d * Math.PI) / 180;
// metres between two [lat, lng] points (good enough for a city)
function metres(a, b) {
  const x = toRad(b[1] - a[1]) * Math.cos(toRad((a[0] + b[0]) / 2));
  const y = toRad(b[0] - a[0]);
  return Math.sqrt(x * x + y * y) * 6371000;
}
// compass bearing a → b (0 = north, 90 = east)
function bearing(a, b) {
  const y = Math.sin(toRad(b[1] - a[1])) * Math.cos(toRad(b[0]));
  const x = Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) - Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(toRad(b[1] - a[1]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Pre-compute distances along the road once per route
function prepare(path) {
  const cum = [0];
  for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + metres(path[i - 1], path[i]));
  return { path, cum, total: cum[cum.length - 1] || 0 };
}

// Exact position on the road at progress p (0 → 1), measured by distance (not by point count)
function pointAt(route, p) {
  const { path, cum, total } = route;
  if (path.length < 2 || total === 0) return { pos: path[0], heading: 0, index: 0 };
  const d = Math.max(0, Math.min(1, p)) * total;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const segLen = cum[i] - cum[i - 1] || 1;
  const t = Math.min(1, (d - cum[i - 1]) / segLen);
  const a = path[i - 1];
  const b = path[i];
  // look a little ahead for the heading, so tiny GPS wiggles don't make it twitch
  let j = i;
  while (j < path.length - 1 && metres(a, path[j]) < 12) j++;
  return { pos: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], heading: bearing(a, path[j]), index: i };
}

// Space the bottom card covers, so the route and ambulance stay in the visible part of the map
function cardSpace() {
  const card = document.querySelector('.track__card');
  return (card?.offsetHeight || 320) + 24;
}
const fitOpts = () => ({ paddingTopLeft: [56, 90], paddingBottomRight: [56, cardSpace()] });

// Gentle start and stop, steady in the middle (like a real vehicle)
const ease = (p) => (p < 0.08 ? (p * p) / 0.16 : p > 0.92 ? 0.92 - ((1 - p) * (1 - p)) / 0.16 : p - 0.04) / 0.92;

// path = list of [lat, lng] points
// startAt / durationMs = when the drive started and how long it takes (the map animates itself)
// done = the ambulance has already arrived (crew tapped "Reached")
export default function TrackingMap({ path, startAt, durationMs = 60000, done = false, hospital, patient }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const aheadRef = useRef(null);
  const behindRef = useRef(null);
  const casingRef = useRef(null);
  const markerRef = useRef(null);
  const hospitalRef = useRef(null);
  const routeRef = useRef(prepare(path || []));
  const headingRef = useRef(null);
  const timingRef = useRef({ startAt, durationMs, done });
  timingRef.current = { startAt, durationMs, done };

  // Create the map once
  useEffect(() => {
    if (!mapEl.current) return;

    const map = L.map(mapEl.current, { zoomControl: false, attributionControl: true, maxZoom: 19 });
    mapRef.current = map;
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);

    // road already covered (grey) and road still ahead (red, with a white casing)
    behindRef.current = L.polyline([], { color: '#9AA3AF', weight: 5, opacity: 0.55, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    casingRef.current = L.polyline(path || [], { color: '#FFFFFF', weight: 9, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    aheadRef.current = L.polyline(path || [], { color: '#E8474C', weight: 5.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);

    if (patient) {
      L.marker(patient, { icon: makeIcon('map-pin--patient', 'bi-person-fill'), zIndexOffset: 500 })
        .addTo(map)
        .bindTooltip('You are here', { permanent: true, direction: 'top', offset: [0, -22], className: 'map-label' });
    }

    if (path && path.length > 0) {
      markerRef.current = L.marker(path[0], { icon: ambulanceIcon, zIndexOffset: 1000, keyboard: false }).addTo(map);
      try {
        map.fitBounds(L.latLngBounds([...path, ...(patient ? [patient] : [])]), fitOpts());
      } catch {
        map.setView(path[0], 15);
      }
    }

    // re-fit once the bottom card has its real height
    const timer = setTimeout(() => {
      map.invalidateSize();
      try {
        if (path?.length) map.fitBounds(L.latLngBounds([...path, ...(patient ? [patient] : [])]), fitOpts());
      } catch {
        /* ignore */
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the real road arrives (or the route changes to the hospital), redraw and re-fit
  useEffect(() => {
    routeRef.current = prepare(path || []);
    headingRef.current = null;
    if (!aheadRef.current || !mapRef.current || !path || path.length === 0) return;
    aheadRef.current.setLatLngs(path);
    casingRef.current?.setLatLngs(path);
    behindRef.current.setLatLngs([]);
    try {
      mapRef.current.fitBounds(L.latLngBounds(path), fitOpts());
    } catch {
      /* empty bounds */
    }
  }, [path]);

  // Hospital pin once the crew has chosen it
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (hospitalRef.current) {
      hospitalRef.current.remove();
      hospitalRef.current = null;
    }
    if (hospital?.position) {
      hospitalRef.current = L.marker(hospital.position, { icon: makeIcon('map-pin--hospital', 'bi-hospital-fill'), zIndexOffset: 400 })
        .addTo(map)
        .bindTooltip(hospital.name, { permanent: true, direction: 'top', offset: [0, -22], className: 'map-label' });
    }
  }, [hospital?.position?.[0], hospital?.position?.[1], hospital?.name]);

  // 60 fps animation: glide along the road, turn with it, follow it
  useEffect(() => {
    let raf;
    let lastFollow = 0;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const route = routeRef.current;
      const marker = markerRef.current;
      const map = mapRef.current;
      if (!marker || !map || route.path.length < 2) return;

      const { startAt: s, durationMs: dur, done: isDone } = timingRef.current;
      const raw = isDone ? 1 : s ? (Date.now() - s) / dur : 0;
      const p = ease(Math.max(0, Math.min(1, raw)));
      const { pos, heading, index } = pointAt(route, p);
      marker.setLatLng(pos);

      // smooth turning: always rotate the short way round
      if (headingRef.current === null) headingRef.current = heading;
      const diff = ((heading - headingRef.current + 540) % 360) - 180;
      headingRef.current = (headingRef.current + diff * 0.12 + 360) % 360;
      const el = marker.getElement();
      const body = el?.querySelector('.amb-top__body');
      if (body) body.style.transform = `rotate(${headingRef.current}deg)`;
      el?.firstElementChild?.classList.toggle('amb-top--arrived', p >= 1);

      // covered road turns grey, the rest stays red
      const behind = route.path.slice(0, index).concat([pos]);
      const ahead = [pos].concat(route.path.slice(index));
      behindRef.current.setLatLngs(behind);
      aheadRef.current.setLatLngs(ahead);
      casingRef.current?.setLatLngs(ahead);

      // keep the ambulance in the visible part of the map, above the card (check twice a second)
      if (now - lastFollow > 500) {
        lastFollow = now;
        const size = map.getSize();
        const bottom = size.y - cardSpace();
        const pt = map.latLngToContainerPoint(pos);
        const margin = 60;
        if (pt.x < margin || pt.x > size.x - margin || pt.y < 90 || pt.y > bottom - margin) {
          const target = L.point(size.x / 2, (90 + bottom) / 2);
          map.panBy(pt.subtract(target), { animate: true, duration: 1.2, easeLinearity: 0.25 });
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div ref={mapEl} className="tracking-map" />;
}
