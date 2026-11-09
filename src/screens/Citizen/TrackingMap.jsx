import { useEffect, useRef, useState } from 'react';
import { createMap, whenReady, htmlMarker, boundsOf, setLine, toLngLat, hasMapbox } from '../../utils/mapbox';
import { ambulanceHtml, labelledPinHtml, escapeHtml } from '../../utils/markers';

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
const fitPadding = () => ({ top: 90, left: 56, right: 56, bottom: cardSpace() });

// Gentle start and stop, steady in the middle (like a real vehicle)
const ease = (p) => (p < 0.08 ? (p * p) / 0.16 : p > 0.92 ? 0.92 - ((1 - p) * (1 - p)) / 0.16 : p - 0.04) / 0.92;

const LINE_BEHIND = { 'line-color': '#9AA3AF', 'line-width': 5, 'line-opacity': 0.55 };
const LINE_CASING = { 'line-color': '#FFFFFF', 'line-width': 9, 'line-opacity': 0.9 };
const LINE_AHEAD = { 'line-color': '#E8474C', 'line-width': 5.5, 'line-opacity': 0.95 };

// path = list of [lat, lng] points
// startAt / durationMs = when the drive started and how long it takes (the map animates itself)
// done = the ambulance has already arrived (crew tapped "Reached")
export default function TrackingMap({ path, startAt, durationMs = 60000, done = false, hospital, patient }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const hospitalRef = useRef(null);
  const routeRef = useRef(prepare(path || []));
  const headingRef = useRef(null);
  const timingRef = useRef({ startAt, durationMs, done });
  useEffect(() => {
    timingRef.current = { startAt, durationMs, done };
  }, [startAt, durationMs, done]);
  const [ready, setReady] = useState(false);

  const fitTo = (points, animate = true) => {
    const map = mapRef.current;
    if (!map || !points?.length) return;
    if (points.length === 1) {
      map.jumpTo({ center: toLngLat(points[0]), zoom: 15 });
      return;
    }
    map.fitBounds(boundsOf(points), { padding: fitPadding(), maxZoom: 17, duration: animate ? 800 : 0 });
  };

  // Create the map once
  useEffect(() => {
    if (!mapEl.current) return;
    const first = path?.[0] || patient;
    const map = createMap(mapEl.current, { center: first, zoom: 14 });
    mapRef.current = map;

    if (patient) {
      htmlMarker(labelledPinHtml('map-pin--patient', 'bi-person-fill', 'You are here'), { anchor: 'bottom' })
        .setLngLat(toLngLat(patient))
        .addTo(map);
    }
    if (path && path.length > 0) {
      markerRef.current = htmlMarker(ambulanceHtml()).setLngLat(toLngLat(path[0])).addTo(map);
    }

    whenReady(map, () => {
      // road already covered (grey) and road still ahead (red, with a white casing)
      setLine(map, 'trk-behind', [], LINE_BEHIND);
      setLine(map, 'trk-casing', path || [], LINE_CASING);
      setLine(map, 'trk-ahead', path || [], LINE_AHEAD);
      setReady(true);
    });

    // fit once the bottom card has its real height
    const timer = setTimeout(() => {
      map.resize();
      fitTo([...(path || []), ...(patient ? [patient] : [])], false);
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
    const map = mapRef.current;
    if (!map || !ready || !path || path.length === 0) return;
    setLine(map, 'trk-ahead', path, LINE_AHEAD);
    setLine(map, 'trk-casing', path, LINE_CASING);
    setLine(map, 'trk-behind', [], LINE_BEHIND);
    if (!markerRef.current) markerRef.current = htmlMarker(ambulanceHtml()).setLngLat(toLngLat(path[0])).addTo(map);
    fitTo(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ready]);

  // Hospital pin once the crew has chosen it
  const hLat = hospital?.position?.[0];
  const hLng = hospital?.position?.[1];
  const hName = hospital?.name;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    hospitalRef.current?.remove();
    hospitalRef.current = null;
    if (hLat !== undefined) {
      hospitalRef.current = htmlMarker(labelledPinHtml('map-pin--hospital', 'bi-hospital-fill', escapeHtml(hName)), {
        anchor: 'bottom',
      })
        .setLngLat([hLng, hLat])
        .addTo(map);
    }
  }, [hLat, hLng, hName]);

  // 60 fps animation: glide along the road, turn with it, follow it
  useEffect(() => {
    let raf;
    let lastFollow = 0;
    let lastLine = 0;
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
      marker.setLngLat(toLngLat(pos));

      // smooth turning: always rotate the short way round
      if (headingRef.current === null) headingRef.current = heading;
      const diff = ((heading - headingRef.current + 540) % 360) - 180;
      headingRef.current = (headingRef.current + diff * 0.12 + 360) % 360;
      const el = marker.getElement();
      const body = el?.querySelector('.amb-top__body');
      if (body) body.style.transform = `rotate(${headingRef.current}deg)`;
      el?.firstElementChild?.classList.toggle('amb-top--arrived', p >= 1);

      // covered road turns grey, the rest stays red (about 20 updates a second is plenty)
      if (map.isStyleLoaded() && now - lastLine > 50) {
        lastLine = now;
        const behind = route.path.slice(0, index).concat([pos]);
        const ahead = [pos].concat(route.path.slice(index));
        setLine(map, 'trk-behind', behind, LINE_BEHIND);
        setLine(map, 'trk-ahead', ahead, LINE_AHEAD);
        setLine(map, 'trk-casing', ahead, LINE_CASING);
      }

      // keep the ambulance in the visible part of the map, above the card (check twice a second)
      if (now - lastFollow > 500 && !map.isMoving()) {
        lastFollow = now;
        const { clientWidth: w, clientHeight: h } = map.getContainer();
        const bottom = h - cardSpace();
        const pt = map.project(toLngLat(pos));
        const margin = 60;
        if (pt.x < margin || pt.x > w - margin || pt.y < 90 || pt.y > bottom - margin) {
          map.panBy([pt.x - w / 2, pt.y - (90 + bottom) / 2], { duration: 1200 });
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="tracking-map">
      <div ref={mapEl} className="tracking-map__canvas" />
      {!hasMapbox && <span className="tracking-map__notice">Map preview · add VITE_MAPBOX_TOKEN to .env</span>}
    </div>
  );
}
