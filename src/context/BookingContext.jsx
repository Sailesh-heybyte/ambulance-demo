import { createContext, useContext, useEffect, useState } from 'react';
import { recommendHospital } from '../utils/beds';
import { getPickup, nearestAmbulance } from '../utils/dispatch';
import { getProfile } from '../utils/profile';
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
    const unit = nearestAmbulance(pickup);
    const hospital = recommendHospital(type, [pickup.lat, pickup.lng]);
    const profile = getProfile();

    save({
      type,
      forWhom,
      status: 'requested',
      hospital: hospital.name,
      hospitalId: hospital.id,
      pickup: {
        id: pickup.id,
        name: pickup.name,
        address: pickup.address,
        lat: pickup.lat,
        lng: pickup.lng,
      },
      ambulance: {
        id: unit.id,
        station: unit.station,
        driver: unit.driver,
        number: unit.number,
        lat: unit.lat,
        lng: unit.lng,
      },
      distanceText: `${unit.km.toFixed(1)} km away`,
      notified: profile.contacts.map((c) => c.name),
      abha: profile.abha,
    });
  };
  const updateStatus = (status) => save({ ...booking, status });
  const clearBooking = () => save(null);

  return (
    <BookingContext.Provider
      value={{ booking, createBooking, updateStatus, clearBooking }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}