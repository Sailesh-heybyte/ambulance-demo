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
    if (!mapEl.current) return;

    const map = L.map(mapEl.current, {
      zoomControl: false,
      attributionControl: true,
      maxZoom: 19,
    });
    mapRef.current = map;

    // CartoDB Voyager Bright Tiles (Modern, clean, bright streets with zero clutter)
    const primaryTiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
      }
    );

    // Fallback in case of tile network failure
    primaryTiles.on('tileerror', () => {
      console.warn('Primary tiles failed to load a tile.');
    });

    primaryTiles.addTo(map);

    lineRef.current = L.polyline(path || [], {
      color: '#e8474c',
      weight: 6,
      opacity: 0.9,
    }).addTo(map);

    if (patient) {
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
    }

    if (path && path.length > 0) {
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

      try {
        map.fitBounds(lineRef.current.getBounds(), { padding: [70, 70] });
      } catch (e) {
        map.setView(path[0], 15);
      }
    }

    // Force size recalculation to guarantee map renders immediately
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the road path arrives (or changes), redraw the line
  useEffect(() => {
    if (!lineRef.current || !mapRef.current || !path || path.length === 0) return;
    lineRef.current.setLatLngs(path);
    try {
      mapRef.current.fitBounds(lineRef.current.getBounds(), { padding: [70, 70] });
    } catch (e) {
      // ignore empty bounds
    }
  }, [path]);

  // Move the ambulance along the path
  useEffect(() => {
    if (!markerRef.current || !path || path.length === 0) return;
    const i = Math.round(progress * (path.length - 1));
    if (path[i]) {
      markerRef.current.setLatLng(path[i]);
    }
  }, [path, progress]);

  return <div ref={mapEl} className="tracking-map" />;
}
