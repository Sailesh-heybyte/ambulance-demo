import { emergencyTypes } from '../mock/emergencies';
const KEY = 'ambulance_trips';

export function getTrips() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addTrip(trip) {
  const list = [{ ...trip, id: Date.now(), status: 'booked' }, ...getTrips()];
  save(list);
  return list;
}
// Saves a finished SOS trip so it shows under "Your trips"
export function addCompletedTrip(booking) {
  const list = getTrips();
  // Both the driver and the citizen can finish a trip, so never save it twice
  if (list.some((t) => t.tripId === booking.tripId)) return list;

  const label = emergencyTypes.find((t) => t.id === booking.type)?.label;
  const trip = {
    id: Date.now(),
    kind: 'emergency',
    status: 'completed',
    tripId: booking.tripId,
    title: label ? `Emergency · ${label}` : 'Emergency trip',
    pickup: booking.pickup?.address || '',
    destination: booking.hospital,
    driver: booking.ambulance
      ? `${booking.ambulance.driver} · ${booking.ambulance.number}`
      : '',
    whenText: new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }),
  };

  const next = [trip, ...list];
  save(next);
  return next;
}
export function cancelTrip(id) {
  const list = getTrips().map((t) =>
    t.id === id ? { ...t, status: 'cancelled' } : t
  );
  save(list);
  return list;
}