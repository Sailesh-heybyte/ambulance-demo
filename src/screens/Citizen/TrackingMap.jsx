import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const makeIcon = (cls, icon) =>
  L.divIcon({
    className: '',
    html: `<div class="map-pin ${cls}"><i class="bi ${icon}"></i></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

// path = list of [lat, lng] points, progress = 0 (start) to 1 (arrived)
export default function TrackingMap({ path, progress, hospital, patient }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const lineRef = useRef(null);
  const markerRef = useRef(null);

  // Create the map once
  useEffect(() => {
    const map = L.map(mapEl.current, { zoomControl: false });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    lineRef.current = L.polyline(path, { color: '#e8474c', weight: 5 }).addTo(map);

    L.marker(patient, {
      icon: makeIcon('map-pin--patient', 'bi-person-fill'),
    })
      .addTo(map)
      .bindTooltip('You are here', {
        permanent: true,
        direction: 'top',
        offset: [0, -22],
        className: 'map-label',
      });

    markerRef.current = L.marker(path[0], {
      icon: makeIcon('map-pin--ambulance', 'bi-truck-front-fill'),
    })
      .addTo(map)
      .bindTooltip('1st Responder', {
        permanent: true,
        direction: 'top',
        offset: [0, -22],
        className: 'map-label',
      });

    map.fitBounds(lineRef.current.getBounds(), { padding: [70, 70] });

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the road path arrives (or changes), redraw the line
  useEffect(() => {
    if (!lineRef.current || !mapRef.current) return;
    lineRef.current.setLatLngs(path);
    mapRef.current.fitBounds(lineRef.current.getBounds(), { padding: [70, 70] });
  }, [path]);

  // Move the ambulance along the path
  useEffect(() => {
    if (!markerRef.current) return;
    const i = Math.round(progress * (path.length - 1));
    markerRef.current.setLatLng(path[i]);
  }, [path, progress]);

  return <div ref={mapEl} className="tracking-map" />;
}