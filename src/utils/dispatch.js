import { pickupSpots, ambulanceUnits } from '../mock/ambulance';
import { distanceKm } from './geo';

const KEY = 'ambulance_pickup';

// The pick-up spot the citizen chose (first one by default)
export function getPickup() {
  const id = localStorage.getItem(KEY);
  return pickupSpots.find((s) => s.id === id) || pickupSpots[0];
}

export function savePickup(id) {
  localStorage.setItem(KEY, id);
}

// The ambulance station closest to the pick-up spot (straight-line distance)
export function nearestAmbulance(pickup) {
  return ambulanceUnits
    .map((u) => ({ ...u, km: distanceKm([u.lat, u.lng], [pickup.lat, pickup.lng]) }))
    .sort((a, b) => a.km - b.km)[0];
}