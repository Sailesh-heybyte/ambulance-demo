import { createContext, useContext, useEffect, useState } from 'react';
import { recommendHospital } from '../utils/beds';
import { getPickup } from '../utils/dispatch';
import { getProfile } from '../utils/profile';
import { addCompletedTrip } from '../utils/trips';
const KEY = 'ambulance_booking';
const BookingContext = createContext(null);

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(read);

  // When ANOTHER tab changes the booking, update this tab too
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setBooking(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = (value) => {
    setBooking(value);
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  };

   const createBooking = ({ type, forWhom }) => {
    const pickup = getPickup();
    const hospital = recommendHospital(type, [pickup.lat, pickup.lng]);
    const profile = getProfile();
    const d = new Date();
    const tripId = `RJY-${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getFullYear()).slice(2)}-${Math.floor(1000 + Math.random() * 9000)}`;

    save({
      type,
      forWhom,
      status: 'requested',
      tripId,
      requestedAt: Date.now(),
      hospital: hospital.name,
      hospitalId: hospital.id,
      pickup: {
        id: pickup.id,
        name: pickup.name,
        address: pickup.address,
        lat: pickup.lat,
        lng: pickup.lng,
      },
      ambulance: null, // filled in by the first driver who accepts
      notified: profile.contacts.map((c) => c.name),
      abha: profile.abha,
    });
  };

  // The first driver to accept gets the job. It reads the newest saved
  // booking, so a second driver who taps Accept a moment later is refused.
  const acceptBooking = (unit, km) => {
    const latest = read();
    if (!latest || latest.status !== 'requested') return false;
    save({
      ...latest,
      status: 'accepted',
      ambulance: {
        id: unit.id,
        station: unit.station,
        driver: unit.driver,
                phone: unit.phone,
        number: unit.number,
        lat: unit.lat,
        lng: unit.lng,
      },
      distanceText: `${km.toFixed(1)} km away`,
    });
    return true;
  };
  const updateStatus = (status) => save({ ...booking, status });
   const updateBooking = (patch) => save({ ...booking, ...patch });
  const clearBooking = () => save(null);
  // Trip finished: keep it in "Your trips", then clear the live booking
  const completeBooking = () => {
    const latest = read();
    if (latest && latest.status === 'hospital') addCompletedTrip(latest);
    save(null);
  };
  return (
    <BookingContext.Provider
      value={{ booking, createBooking,acceptBooking, updateStatus,updateBooking, completeBooking,clearBooking }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}