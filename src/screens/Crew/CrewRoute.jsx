import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRoute } from '../../utils/route';
import { distanceKm } from '../../utils/geo';

const pin = (cls, icon) =>
  L.divIcon({
    className: '',
    html: `<div class="map-pin ${cls}"><i class="bi ${icon}"></i></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

// Green route map for the driver. from / to are [lat, lng].
export default function CrewRoute({ from, to, title, fromPin, toPin }) {
  const mapEl = useRef(null);
  const [route, setRoute] = useState(null);
  const [failed, setFailed] = useState(false);

  const [fLat, fLng] = from;
  const [tLat, tLng] = to;
  const straightKm = distanceKm([fLat, fLng], [tLat, tLng]);

  useEffect(() => {
    const map = L.map(mapEl.current, { zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Straight line first, replaced by the real road when it loads
    const line = L.polyline([[fLat, fLng], [tLat, tLng]], {
      color: '#16a34a',
      weight: 6,
    }).addTo(map);
    L.marker([fLat, fLng], { icon: pin(fromPin.cls, fromPin.icon) }).addTo(map);
    L.marker([tLat, tLng], { icon: pin(toPin.cls, toPin.icon) }).addTo(map);
    map.fitBounds(line.getBounds(), { padding: [50, 50] });

    let cancelled = false;
    fetchRoute([fLat, fLng], [tLat, tLng])
      .then((r) => {
        if (cancelled) return;
        line.setLatLngs(r.points);
        map.fitBounds(line.getBounds(), { padding: [50, 50] });
        setRoute(r);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fLat, fLng, tLat, tLng]);

  const km = route ? route.km : straightKm;

  return (
    <div className="croute">
      <div className="croute__head">
        <strong>{title}</strong>
        <span>
          {km.toFixed(1)} km{route ? ` · ${route.minutes} min` : ''}
        </span>
      </div>
      {failed && <p className="croute__warn">Road route not available. Showing a straight line.</p>}
      <div ref={mapEl} className="croute__map" />
    </div>
  );
}