// Asks the OSRM routing service for the road path between two points.
// from / to are [latitude, longitude]
export async function fetchRoute(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Route request failed');

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');

  return {
    // OSRM gives [lng, lat], Leaflet needs [lat, lng]
    points: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    minutes: Math.max(1, Math.round(route.duration / 60)),
   km: route.distance / 1000,
  };
}