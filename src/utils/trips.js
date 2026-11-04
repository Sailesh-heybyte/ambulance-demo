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

export function cancelTrip(id) {
  const list = getTrips().map((t) =>
    t.id === id ? { ...t, status: 'cancelled' } : t
  );
  save(list);
  return list;
}