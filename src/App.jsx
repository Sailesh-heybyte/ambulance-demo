import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StaffProvider, useStaff } from './context/StaffAuthContext';
import { BookingProvider } from './context/BookingContext';
import Splash from './screens/Splash/Splash';
import SignIn from './screens/Auth/SignIn';
import StaffLogin from './screens/Auth/StaffLogin';
import Home from './screens/Citizen/Home';
import Tracking from './screens/Citizen/Tracking';
import FirstAid from './screens/Citizen/FirstAid';
import Trips from './screens/Citizen/Trips';
import Profile from './screens/Citizen/Profile';
import Crew from './screens/Crew/Crew';
import Hospital from './screens/Hospital/Hospital';
import BottomNav from './components/BottomNav';

function Layout() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const { crew, hospital } = useStaff();

  // Hospital portal: wide desktop page, needs a hospital login
  if (pathname === '/hospital') {
    return hospital ? <Hospital /> : <StaffLogin role="hospital" />;
  }

  // Crew app: phone-size, needs a crew login
  if (pathname === '/crew') {
    return (
      <div className="app-shell app-shell--full">
        {crew ? <Crew /> : <StaffLogin role="crew" />}
      </div>
    );
  }

  // Everything else is the citizen app, which needs the citizen sign-in
  if (!isAuthenticated) {
    return (
      <div className="app-shell app-shell--full">
        <SignIn />
      </div>
    );
  }

  const fullScreen = pathname === '/tracking';

  return (
    <div className={`app-shell ${fullScreen ? 'app-shell--full' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/first-aid" element={<FirstAid />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!fullScreen && <BottomNav />}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <Splash />;

  return (
    <BrowserRouter>
      <AuthProvider>
        <StaffProvider>
          <BookingProvider>
            <Layout />
          </BookingProvider>
        </StaffProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}