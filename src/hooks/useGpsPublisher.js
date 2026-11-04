import { useEffect, useState } from 'react';

const KEY = 'ambulance_crew_location';
const PUBLISH_EVERY = 7000; // 7 seconds

export function getCrewLocation() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

function ageOf(loc) {
  return loc ? Math.max(0, Math.round((Date.now() - loc.at) / 1000)) : null;
}

// Used on the citizen screen: seconds since the driver's last GPS update
export function useDriverLocationAge() {
  const [age, setAge] = useState(() => ageOf(getCrewLocation()));

  useEffect(() => {
    const id = setInterval(() => setAge(ageOf(getCrewLocation())), 1000);
    return () => clearInterval(id);
  }, []);

  return age;
}

// Used on the crew screen: reads the phone's GPS and saves it every 7 seconds
export default function useGpsPublisher(active) {
  const [state, setState] = useState('searching'); // searching | ok | denied | error
  const [lastAt, setLastAt] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const supported = 'geolocation' in navigator;

  useEffect(() => {
    if (!active || !supported) return;

    let latest = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        latest = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setState('ok');
      },
      (err) => setState(err.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    // Publish the latest position every 7 seconds (skipped while offline)
    const publishTimer = setInterval(() => {
      if (!latest || !navigator.onLine) return;
      const entry = { ...latest, at: Date.now() };
      localStorage.setItem(KEY, JSON.stringify(entry));
      setLastAt(entry.at);
    }, PUBLISH_EVERY);

    // Makes "updated Ns ago" count up every second
    const clockTimer = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(publishTimer);
      clearInterval(clockTimer);
    };
  }, [active, supported]);

  if (!supported) return { state: 'unsupported', ageSec: null };

  return {
    state: active ? state : 'idle',
    ageSec: lastAt ? Math.max(0, Math.round((now - lastAt) / 1000)) : null,
  };
}
// Used on the crew screen: the driver's latest saved position, refreshed every 3 seconds
export function useCrewPosition() {
  const [pos, setPos] = useState(getCrewLocation);

  useEffect(() => {
    const id = setInterval(() => setPos(getCrewLocation()), 3000);
    return () => clearInterval(id);
  }, []);

  return pos; // { lat, lng, ... } or null
}