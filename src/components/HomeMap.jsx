import { useEffect, useRef, useState } from 'react';
import { createMap, whenReady, htmlMarker, boundsOf, setLine, toLngLat, hasMapbox } from '../utils/mapbox';
import { ambulanceHtml, bearing, escapeHtml } from '../utils/markers';
import { fetchRoute } from '../utils/route';
import './HomeMap.scss';

// Home map: your pickup pin, the nearest ambulance with its road route and ETA,
// and every other available ambulance as a smaller marker.
export default function HomeMap({ pickup, nearest, others = [], onPickupClick }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const pickupMarker = useRef(null);
  const nearestMarker = useRef(null);
  const otherMarkers = useRef([]);
  const routeRef = useRef([]);
  const [ready, setReady] = useState(false);
  const clickRef = useRef(onPickupClick);
  useEffect(() => {
    clickRef.current = onPickupClick;
  }, [onPickupClick]);

  // Create the map once
  useEffect(() => {
    const map = createMap(elRef.current, { center: [pickup.lat, pickup.lng], zoom: 14 });
    mapRef.current = map;
    whenReady(map, () => setReady(true));
    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fit = () => {
    const map = mapRef.current;
    if (!map) return;
    const pts = [[pickup.lat, pickup.lng], ...routeRef.current];
    if (nearest) pts.push([nearest.lat, nearest.lng]);
    if (pts.length < 2) {
      map.easeTo({ center: toLngLat(pts[0]), zoom: 15 });
      return;
    }
    map.fitBounds(boundsOf(pts), { padding: { top: 60, bottom: 70, left: 50, right: 70 }, maxZoom: 16, duration: 700 });
  };

  // Pickup pin with its "Pick up" label
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pickupMarker.current?.remove();
    const html = `<button type="button" class="home-map__pickup">
        <span class="home-map__pickup-tag"><b>Pick up</b><span>${escapeHtml(pickup.name || pickup.address)}</span><i class="bi bi-chevron-right"></i></span>
        <span class="home-map__pickup-pin"><i class="bi bi-geo-alt-fill"></i></span>
      </button>`;
    const m = htmlMarker(html, { anchor: 'bottom' }).setLngLat([pickup.lng, pickup.lat]).addTo(map);
    m.getElement().addEventListener('click', () => clickRef.current?.());
    pickupMarker.current = m;
  }, [pickup.lat, pickup.lng, pickup.name, pickup.address]);

  // Other available ambulances
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    otherMarkers.current.forEach((m) => m.remove());
    otherMarkers.current = others.map((u, i) =>
      htmlMarker(ambulanceHtml('amb-top--idle'), { className: 'home-map__other' })
        .setLngLat([u.lng, u.lat])
        .setRotation((i * 67) % 360)
        .addTo(map)
    );
  }, [others]);

  // Nearest ambulance + route + ETA chip
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    nearestMarker.current?.remove();
    if (!nearest) {
      routeRef.current = [];
      setLine(map, 'home-route-casing', [], {});
      setLine(map, 'home-route', [], {});
      fit();
      return;
    }

    const from = [nearest.lat, nearest.lng];
    const to = [pickup.lat, pickup.lng];
    const marker = htmlMarker(ambulanceHtml(), { className: 'home-map__nearest' }).setLngLat([from[1], from[0]]).addTo(map);
    nearestMarker.current = marker;

    const draw = (pts) => {
      routeRef.current = pts;
      setLine(map, 'home-route-casing', pts, { 'line-color': '#FFFFFF', 'line-width': 9, 'line-opacity': 0.95 });
      setLine(map, 'home-route', pts, { 'line-color': '#E8474C', 'line-width': 5 });
      if (pts.length > 1) marker.setRotation(bearing(pts[0], pts[Math.min(3, pts.length - 1)]));
      fit();
    };

    draw([from, to]); // straight line until the road loads
    let cancelled = false;
    fetchRoute(from, to)
      .then((r) => !cancelled && draw(r.points))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, nearest?.id, nearest?.minutes, pickup.lat, pickup.lng]);

  return (
    <div className="home-map">
      <div ref={elRef} className="home-map__canvas" />
      {!hasMapbox && <span className="home-map__notice">Map preview · add VITE_MAPBOX_TOKEN to .env</span>}
      <button type="button" className="home-map__recenter" onClick={fit} aria-label="Show me and the nearest ambulance">
        <i className="bi bi-crosshair" />
      </button>
    </div>
  );
}
