import { hospitals, defaultBeds, neededFacility } from '../mock/hospitals';

const KEY = 'ambulance_beds';

export function getBeds() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) return saved;
  } catch {
    // ignore and use the defaults
  }
  return defaultBeds;
}

export function saveBeds(beds) {
  localStorage.setItem(KEY, JSON.stringify(beds));
}

// Nearest hospital that has a free bed of the type this emergency needs
export function recommendHospital(typeId) {
  const beds = getBeds();
  const need = neededFacility[typeId] || 'icu';
  const byDistance = [...hospitals].sort((a, b) => a.distanceKm - b.distanceKm);
  const withBed = byDistance.filter((h) => beds[h.id]?.[need] > 0);
  return withBed[0] || byDistance[0]; // if none has a bed, use the nearest
}