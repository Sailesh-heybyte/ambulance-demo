import { createContext, useContext, useState } from 'react';

const KEYS = {
  crew: 'ambulance_crew_session',
  hospital: 'ambulance_hospital_session',
};

function read(role) {
  try {
    return JSON.parse(localStorage.getItem(KEYS[role]));
  } catch {
    return null;
  }
}

const StaffContext = createContext(null);

export function StaffProvider({ children }) {
  const [crew, setCrew] = useState(() => read('crew'));
  const [hospital, setHospital] = useState(() => read('hospital'));
  const setters = { crew: setCrew, hospital: setHospital };

  const login = (role, session) => {
    localStorage.setItem(KEYS[role], JSON.stringify(session));
    setters[role](session);
  };

  const logout = (role) => {
    localStorage.removeItem(KEYS[role]);
    setters[role](null);
  };

  return (
    <StaffContext.Provider value={{ crew, hospital, login, logout }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  return useContext(StaffContext);
}