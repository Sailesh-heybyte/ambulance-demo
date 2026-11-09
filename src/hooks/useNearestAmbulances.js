import { useEffect, useState } from 'react';
import { ambulanceUnits } from '../mock/ambulance';
import { rankByDriveTime } from '../utils/mapbox';

// Available ambulances ranked by drive time to the pickup point.
// A unit already on a live booking is not available.
// Refreshes every 30 seconds.
export default function useNearestAmbulances(pickup, booking) {
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);

  const busyId =
    booking && booking.status !== 'completed' && booking.status !== 'hospital' ? booking.ambulance?.id : null;
  const lat = pickup?.lat;
  const lng = pickup?.lng;

  useEffect(() => {
    if (lat === undefined) return;
    let cancelled = false;
    const run = async () => {
      const free = ambulanceUnits.filter((u) => u.id !== busyId);
      const list = await rankByDriveTime(free, { lat, lng });
      if (!cancelled) {
        setRanked(list);
        setLoading(false);
      }
    };
    run();
    const timer = setInterval(run, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [lat, lng, busyId]);

  return { nearest: ranked[0] || null, others: ranked.slice(1), all: ranked, loading };
}
