import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { user as mockUser } from '../../mock/user';
import { useAuth } from '../../context/AuthContext';
import Sheet from '../../components/Sheet';
import { pickupSpots } from '../../mock/ambulance';
import { getPickup, savePickup } from '../../utils/dispatch';
import { useBooking } from '../../context/BookingContext';
import ProtocolLeaders from '../../components/ProtocolLeaders';
import './Home.scss';

export default function Home() {
  const { user: account, logout } = useAuth();
  const user = { ...mockUser, name: account?.name || mockUser.name || 'Suresh' };
  const navigate = useNavigate();
  const { booking, createBooking } = useBooking();

  const [pickup, setPickup] = useState(getPickup);
  const [spotOpen, setSpotOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState('te'); // 'te' (Telugu) | 'en' (English)

  // Active booking detection
  const isBooked = Boolean(booking && booking.status && booking.status !== 'completed');

  // Direct 1-tap SOS: immediately creates the booking and navigates straight to tracking
  const handleSosClick = () => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    createBooking({ type: 'emergency', forWhom: 'me' });
    navigate('/tracking');
  };

  const handleServiceSelect = (serviceType) => {
    setServicesOpen(false);
    createBooking({ type: serviceType, forWhom: 'me' });
    navigate('/tracking');
  };

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'te' ? 'en' : 'te'));
  };

  return (
    <div className="home-screen">
      {/* --- Top Official Protocol Leadership Ribbon --- */}
      <div className="home-screen__protocol-wrapper">
        <ProtocolLeaders variant="ribbon" size="lg" />
      </div>

      {/* --- Top App Bar (108 Ambulance + Language + Menu) --- */}
      <header className="home-screen__navbar">
        <div className="home-screen__brand">
          <div className="home-screen__cross-badge">
            <i className="bi bi-plus-lg" />
          </div>
          <span className="home-screen__brand-name">108 Ambulance</span>
        </div>

        <div className="home-screen__nav-actions">
          <button
            type="button"
            className="home-screen__lang-btn"
            onClick={toggleLanguage}
            aria-label="Toggle language"
          >
            {lang === 'te' ? 'తెలుగు' : 'English'}
          </button>

          <button
            type="button"
            className="home-screen__menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <i className="bi bi-list" />
          </button>
        </div>
      </header>

      {/* --- Greeting & User Identity --- */}
      <section className="home-screen__greeting-section">
        <p className="home-screen__salutation">
          {lang === 'te' ? 'Namaskaram,' : 'Good day,'}
        </p>
        <h1 className="home-screen__user-name">{user.name}</h1>

        {/* Location Chip */}
        <button
          type="button"
          className="home-screen__location-chip"
          onClick={() => setSpotOpen(true)}
        >
          <i className="bi bi-geo-alt-fill home-screen__location-pin" />
          <span className="home-screen__location-text">{pickup.address}</span>
        </button>
      </section>

      {/* --- Main Red Emergency Card (Fills down to the bottom edge) --- */}
      <section className="home-screen__emergency-card">
        {/* Pulsing Outer Concentric Rings */}
        <div className="home-screen__pulse-container">
          <span className="home-screen__pulse-ring home-screen__pulse-ring--outer" />
          <span className="home-screen__pulse-ring home-screen__pulse-ring--mid" />

          {/* Center Circle: Shows 'Ambulance requested' if booked, or 'SOS' if idle */}
          {isBooked ? (
            <button
              type="button"
              className="home-screen__sos-button home-screen__sos-button--requested"
              onClick={() => navigate('/tracking')}
              aria-label="Ambulance requested. Tap to view live tracking."
            >
              <span className="home-screen__status-dot" />
              <span className="home-screen__requested-title">
                Ambulance<br />requested
              </span>
              <span className="home-screen__view-link">
                View <i className="bi bi-chevron-right" />
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="home-screen__sos-button"
              onClick={handleSosClick}
              aria-label="Emergency SOS. Tap once to book an ambulance."
            >
              <span className="home-screen__sos-label">SOS</span>
              <span className="home-screen__sos-sublabel">
                {lang === 'te' ? 'Tap once' : 'Tap once'}
              </span>
            </button>
          )}
        </div>

        {/* Card Typography */}
        <div className="home-screen__card-info">
          <h2 className="home-screen__card-heading">An ambulance comes to you</h2>
          <p className="home-screen__card-subheading">
            {isBooked
              ? 'Your live location is shared automatically'
              : 'ఒక్కసారి నొక్కండి - అంబులెన్స్ మీ దగ్గరకు'}
          </p>
        </div>

        {/* Bottom Actions Row (Dual Black Pills) */}
        <div className="home-screen__action-row">
          <a
            href="tel:108"
            className="home-screen__action-pill"
            aria-label="Direct call 108 emergency service"
          >
            <i className="bi bi-telephone-fill" />
            <span>Call 108</span>
          </a>

          <button
            type="button"
            className="home-screen__action-pill"
            onClick={() => setServicesOpen(true)}
            aria-label="View more emergency services"
          >
            <span>More services</span>
            <i className="bi bi-arrow-right" />
          </button>
        </div>
      </section>

      {/* --- Location Selector Sheet --- */}
      <Sheet open={spotOpen} onClose={() => setSpotOpen(false)} title="Where are you?">
        <div className="spots">
          {pickupSpots.map((s) => (
            <button
              key={s.id}
              type="button"
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

      {/* --- More Services Sheet --- */}
      <Sheet open={servicesOpen} onClose={() => setServicesOpen(false)} title="Emergency Services">
        <div className="services-grid">
          <div className="service-card" onClick={() => handleServiceSelect('general')}>
            <div className="service-card__icon service-card__icon--red"><i className="bi bi-truck-front-fill" /></div>
            <div>
              <h4>Basic Life Support (BLS)</h4>
              <p>For immediate stabilization and fast transport.</p>
            </div>
          </div>
          <div className="service-card" onClick={() => handleServiceSelect('cardiac')}>
            <div className="service-card__icon service-card__icon--blue"><i className="bi bi-heart-pulse-fill" /></div>
            <div>
              <h4>Advanced Cardiac Care (ALS)</h4>
              <p>Equipped with ventilators, monitors &amp; paramedics.</p>
            </div>
          </div>
          <div className="service-card" onClick={() => { setServicesOpen(false); navigate('/first-aid'); }}>
            <div className="service-card__icon service-card__icon--green"><i className="bi bi-shield-plus" /></div>
            <div>
              <h4>First Aid Guide</h4>
              <p>Step-by-step CPR and immediate emergency guides.</p>
            </div>
          </div>
        </div>
      </Sheet>

      {/* --- Quick Side Drawer / Menu Sheet --- */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="108 Emergency Portal">
        <div className="menu-list">
          <button type="button" className="menu-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
            <i className="bi bi-person-circle" />
            <span>My Profile ({user.name})</span>
          </button>
          <button type="button" className="menu-item" onClick={() => { setMenuOpen(false); navigate('/trips'); }}>
            <i className="bi bi-clock-history" />
            <span>Trip &amp; Dispatch History</span>
          </button>
          <button type="button" className="menu-item" onClick={() => { setMenuOpen(false); navigate('/first-aid'); }}>
            <i className="bi bi-heart-pulse" />
            <span>First Aid &amp; CPR Guides</span>
          </button>
          <button type="button" className="menu-item" onClick={() => { setMenuOpen(false); navigate('/crew'); }}>
            <i className="bi bi-shield-shaded" />
            <span>Crew Responder Portal</span>
          </button>
          <button type="button" className="menu-item" onClick={() => { setMenuOpen(false); navigate('/hospital'); }}>
            <i className="bi bi-hospital" />
            <span>Hospital ER Dashboard</span>
          </button>
          <button type="button" className="menu-item menu-item--danger" onClick={() => { setMenuOpen(false); logout(); }}>
            <i className="bi bi-box-arrow-right" />
            <span>Sign Out</span>
          </button>
        </div>
      </Sheet>
    </div>
  );
}
