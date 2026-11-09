import { pickupSpots, ambulanceUnits } from '../mock/ambulance';
import { distanceKm } from './geo';

const KEY = 'ambulance_pickup';

// The pick-up point the citizen chose. It is either one of the demo spots
// (saved as its id) or a pin dropped on the map (saved as JSON).
export function getPickup() {
  const saved = localStorage.getItem(KEY);
  if (saved && saved.startsWith('{')) {
    try {
      const p = JSON.parse(saved);
      if (typeof p.lat === 'number' && typeof p.lng === 'number') return p;
    } catch {
      /* use the default below */
    }
  }
  return pickupSpots.find((s) => s.id === saved) || pickupSpots[0];
}

// Accepts a spot id or a { name, address, lat, lng } object
export function savePickup(spot) {
  if (typeof spot === 'string') localStorage.setItem(KEY, spot);
  else localStorage.setItem(KEY, JSON.stringify({ id: 'pin', ...spot }));
}

// The ambulance station closest to the pick-up spot (straight-line distance)
export function nearestAmbulance(pickup) {
  return ambulanceUnits
    .map((u) => ({ ...u, km: distanceKm([u.lat, u.lng], [pickup.lat, pickup.lng]) }))
    .sort((a, b) => a.km - b.km)[0];
}
