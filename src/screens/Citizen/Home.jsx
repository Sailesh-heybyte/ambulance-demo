import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { user as mockUser } from '../../mock/user';
import { useAuth } from '../../context/AuthContext';
import EmergencySheet from './EmergencySheet';
import './Home.scss';
import { getProfile } from '../../utils/profile';
import SosButton from '../../components/SosButton';
import Sheet from '../../components/Sheet';
import { pickupSpots } from '../../mock/ambulance';
import { getPickup, savePickup } from '../../utils/dispatch';
import { useBooking } from '../../context/BookingContext';
export default function Home() {
    const { user: account } = useAuth();
  const user = { ...mockUser, name: account?.name || mockUser.name };
 
  const navigate = useNavigate();
    // How many profile items are still empty (ABHA, Aarogyasri, emergency contact)
  const profile = getProfile();
  const missing = [profile.abha, profile.aarogyasri, profile.contacts.length > 0].filter(
    (done) => !done
  ).length;
   const { createBooking } = useBooking();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickup, setPickup] = useState(getPickup);
  const [spotOpen, setSpotOpen] = useState(false);
  const handleConfirm = (booking) => {
    createBooking(booking);
    setSheetOpen(false);
    navigate('/tracking', { state: booking });
  };

  return (
    <div className="home">
      <header className="home__header">
        <div>
          <p className="home__welcome">Welcome back,</p>
          <h2 className="home__name">{user.name}</h2>
        </div>
               <button
          className="home__avatar"
          onClick={() => navigate('/profile')}
          aria-label="Open profile"
        >
          {user.name.charAt(0)}
          {missing > 0 && <span className="home__badge">{missing}</span>}
        </button>
      </header>

      <section className="home__main">
        <h1>Are you in emergency?</h1>
                <p>Press and hold the button for 2 seconds, help will reach you soon.</p>

        <div className="sos">
          <span className="sos__ring sos__ring--outer" />
          <span className="sos__ring sos__ring--inner" />
                    <SosButton onComplete={() => setSheetOpen(true)} />
        </div>
      </section>

            <button className="address-card" onClick={() => setSpotOpen(true)}>
        <div className="address-card__icon">
          <i className="bi bi-geo-alt-fill" />
        </div>
        <div className="address-card__text">
          <h4>Your current address</h4>
          <p>{pickup.address}</p>
        </div>
        <span className="address-card__change">Change</span>
      </button>

      <Sheet open={spotOpen} onClose={() => setSpotOpen(false)} title="Where are you?">
        <div className="spots">
          {pickupSpots.map((s) => (
            <button
              key={s.id}
              className={`spots__item ${pickup.id === s.id ? 'spots__item--active' : ''}`}
              onClick={() => {
                savePickup(s.id);
                setPickup(s);
                setSpotOpen(false);
              }}
            >
              <i className="bi bi-geo-alt-fill" />
              <span>{s.address}</span>
            </button>
          ))}
        </div>
      </Sheet>
            <EmergencySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}