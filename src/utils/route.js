// Turns one OSRM turn into a sentence for the driver
function stepText(m, name) {
  const road = name ? ` onto ${name}` : '';
  if (m.type === 'arrive') return 'You have arrived';
  if (m.type === 'roundabout' || m.type === 'rotary') return `Take the roundabout${road}`;
  const dir = m.modifier || 'straight';
  if (dir === 'uturn') return `Make a U-turn${road}`;
  if (dir === 'straight') return `Continue straight${road}`;
  return `Turn ${dir}${road}`;
}

// Asks the OSRM routing service for the road path between two points.
// from / to are [latitude, longitude]
export async function fetchRoute(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Route request failed');

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');

  // The turn at the END of step i is described by step i + 1
  const legSteps = route.legs?.[0]?.steps || [];
  const steps = legSteps.slice(1).map((s, i) => ({
    text: stepText(s.maneuver, s.name),
    modifier: s.maneuver.modifier,
    type: s.maneuver.type,
    distance: legSteps[i].distance, // metres of road before this turn
  }));

  return {
    // OSRM gives [lng, lat], Leaflet needs [lat, lng]
    points: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    minutes: Math.max(1, Math.round(route.duration / 60)),
    km: route.distance / 1000,
    steps,
  };
}