import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { user as mockUser } from '../../mock/user';
import { useAuth } from '../../context/AuthContext';
import EmergencySheet from './EmergencySheet';
import './Home.scss';
import { useBooking } from '../../context/BookingContext';
export default function Home() {
    const { user: account } = useAuth();
  const user = { ...mockUser, name: account?.name || mockUser.name };
  const navigate = useNavigate();
   const { createBooking } = useBooking();
  const [sheetOpen, setSheetOpen] = useState(false);

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
        <div className="home__avatar">
          {user.name.charAt(0)}
          <span className="home__badge">2</span>
        </div>
      </header>

      <section className="home__main">
        <h1>Are you in emergency?</h1>
        <p>Press the button below, help will reach you soon.</p>

        <div className="sos">
          <span className="sos__ring sos__ring--outer" />
          <span className="sos__ring sos__ring--inner" />
          <button className="sos__button" onClick={() => setSheetOpen(true)}>
            SOS
          </button>
        </div>
      </section>

      <section className="address-card">
        <div className="address-card__icon">
          <i className="bi bi-geo-alt-fill" />
        </div>
        <div>
          <h4>Your current address</h4>
          <p>{user.address}</p>
        </div>
      </section>
            <EmergencySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}