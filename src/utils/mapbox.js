import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { distanceKm } from './geo';

// Paste your token in the .env file at the project root:
//   VITE_MAPBOX_TOKEN=pk.xxxxxxxx
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
export const hasMapbox = Boolean(MAPBOX_TOKEN);

// Light, clean map that lets the red route and markers stand out
const STYLE_URL = 'mapbox://styles/mapbox/light-v11';

// With no token yet, show a plain background so the screen still works
const BLANK_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#EEF0F3' } }],
};

if (hasMapbox) mapboxgl.accessToken = MAPBOX_TOKEN;

// Everything in the app uses [lat, lng]; Mapbox uses [lng, lat]
export const toLngLat = ([lat, lng]) => [lng, lat];

export function createMap(container, { center, zoom = 14, interactive = true } = {}) {
  const map = new mapboxgl.Map({
    container,
    style: hasMapbox ? STYLE_URL : BLANK_STYLE,
    center: center ? toLngLat(center) : [81.7843, 17.0005],
    zoom,
    interactive,
    attributionControl: false,
    pitchWithRotate: false,
    dragRotate: false,
    touchPitch: false,
  });
  map.touchZoomRotate?.disableRotation();
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
  return map;
}

// Runs fn once the style is ready (immediately if it already is)
export function whenReady(map, fn) {
  if (map.isStyleLoaded()) fn();
  else map.once('load', fn);
}

// A marker from an HTML string. anchor 'center' or 'bottom'.
export function htmlMarker(html, { anchor = 'center', className = '' } = {}) {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = html;
  return new mapboxgl.Marker({ element: el, anchor });
}

export function boundsOf(points) {
  const b = new mapboxgl.LngLatBounds();
  points.forEach((p) => b.extend(toLngLat(p)));
  return b;
}

export const lineFeature = (points) => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'LineString', coordinates: points.map(toLngLat) },
});

// Adds (or updates) a GeoJSON line layer
export function setLine(map, id, points, paint, before) {
  const data = lineFeature(points.length > 1 ? points : []);
  const src = map.getSource(id);
  if (src) {
    src.setData(data);
    return;
  }
  map.addSource(id, { type: 'geojson', data });
  map.addLayer(
    { id, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint },
    before && map.getLayer(before) ? before : undefined
  );
}

// ---------------- Mapbox web services ----------------

const API = 'https://api.mapbox.com';

// Driving route between two [lat, lng] points.
// Returns { points, minutes, km, steps } (same shape as the old OSRM helper)
export async function mapboxRoute(from, to) {
  const url =
    `${API}/directions/v5/mapbox/driving-traffic/${from[1]},${from[0]};${to[1]},${to[0]}` +
    `?overview=full&geometries=geojson&steps=true&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Route request failed');
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');
  const legSteps = route.legs?.[0]?.steps || [];
  return {
    points: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    minutes: Math.max(1, Math.round(route.duration / 60)),
    km: route.distance / 1000,
    steps: legSteps.slice(1).map((s, i) => ({
      text: s.maneuver.instruction,
      modifier: s.maneuver.modifier,
      type: s.maneuver.type,
      distance: legSteps[i].distance,
    })),
  };
}

// Drive time (minutes) from each unit to the pickup, nearest first.
// Uses the Mapbox Matrix API; falls back to straight-line distance at ~25 km/h.
export async function rankByDriveTime(units, pickup) {
  const roughly = () =>
    units
      .map((u) => {
        const km = distanceKm([u.lat, u.lng], [pickup.lat, pickup.lng]);
        return { ...u, km, minutes: Math.max(2, Math.round((km * 1.4 * 60) / 25) + 1) };
      })
      .sort((a, b) => a.minutes - b.minutes);

  if (!hasMapbox || units.length === 0) return roughly();
  try {
    const coords = [[pickup.lng, pickup.lat], ...units.map((u) => [u.lng, u.lat])]
      .map((c) => c.join(','))
      .join(';');
    const sources = units.map((_, i) => i + 1).join(';');
    const url =
      `${API}/directions-matrix/v1/mapbox/driving-traffic/${coords}` +
      `?sources=${sources}&destinations=0&annotations=duration,distance&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('matrix failed');
    const data = await res.json();
    return units
      .map((u, i) => ({
        ...u,
        minutes: Math.max(1, Math.round((data.durations[i][0] ?? 0) / 60)),
        km: (data.distances?.[i]?.[0] ?? 0) / 1000,
      }))
      .sort((a, b) => a.minutes - b.minutes);
  } catch {
    return roughly();
  }
}

// Short address for a point ("Danavai Peta, Rajahmundry")
export async function reverseGeocode([lat, lng]) {
  if (!hasMapbox) return null;
  try {
    const url = `${API}/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&limit=1&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    const p = data.features?.[0]?.properties;
    if (!p) return null;
    return { name: p.name, address: p.full_address || p.place_formatted || p.name };
  } catch {
    return null;
  }
}

// Place search for the drop location, biased to near the pickup and limited to India
export async function searchPlaces(query, near) {
  if (!hasMapbox || query.trim().length < 3) return [];
  try {
    const prox = near ? `&proximity=${near[1]},${near[0]}` : '';
    const url =
      `${API}/search/geocode/v6/forward?q=${encodeURIComponent(query)}&country=in&limit=6${prox}` +
      `&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.features || []).map((f) => ({
      id: f.id,
      name: f.properties.name,
      address: f.properties.full_address || f.properties.place_formatted || f.properties.name,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
    }));
  } catch {
    return [];
  }
}
