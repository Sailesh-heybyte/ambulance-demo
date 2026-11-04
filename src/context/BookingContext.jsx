import { createContext, useContext, useEffect, useState } from 'react';
import { recommendHospital } from '../utils/beds';
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

  // status: requested -> accepted -> reached -> picked -> hospital
    const createBooking = ({ type, forWhom }) => {
    const hospital = recommendHospital(type);
    const profile = getProfile();
    save({
      type,
      forWhom,
      status: 'requested',
      hospital: hospital.name,
      hospitalId: hospital.id,
      notified: profile.contacts.map((c) => c.name), // contacts alerted
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