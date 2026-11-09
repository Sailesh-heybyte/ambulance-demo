import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import Sheet from '../../components/Sheet';
import BrandLogo from '../../components/BrandLogo';
import ProtocolLeaders, { LEADERS } from '../../components/ProtocolLeaders';
import AmbulanceArt from '../../components/AmbulanceArt';
import HomeMap from '../../components/HomeMap';
import BookingSheet from './BookingSheet';
import useNearestAmbulances from '../../hooks/useNearestAmbulances';
import { pickupSpots } from '../../mock/ambulance';
import { facilities, notSupported, stats, crew } from '../../mock/ambulanceInfo';
import { getPickup, savePickup } from '../../utils/dispatch';
import { reverseGeocode } from '../../utils/mapbox';
import { addTrip } from '../../utils/trips';
import './Home.scss';

const TEXT = {
  en: {
    in: 'Ambulance in',
    minutes: (n) => `${n} minute${n === 1 ? '' : 's'}`,
    finding: 'Finding ambulances…',
    busy: 'All ambulances busy',
    request: 'Request Ambulance',
    lang: 'తెలుగు',
  },
  te: {
    in: 'అంబులెన్స్',
    minutes: (n) => `${n} నిమిషాల్లో`,
    finding: 'అంబులెన్స్ కోసం వెతుకుతోంది…',
    busy: 'అంబులెన్స్‌లు అందుబాటులో లేవు',
    request: 'అంబులెన్స్ బుక్ చేయండి',
    lang: 'English',
  },
};

// Counts up to a number when it scrolls into view
function CountUp({ to }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - start) / 1400);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return <span ref={ref}>{n.toLocaleString('en-IN')}</span>;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { booking, createBooking } = useBooking();

  const [lang, setLang] = useState('en');
  const t = TEXT[lang];
  const [pickup, setPickup] = useState(getPickup);
  const [bookOpen, setBookOpen] = useState(false);
  const [spotOpen, setSpotOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [officialOpen, setOfficialOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const { nearest, others, loading } = useNearestAmbulances(pickup, booking);
  const isBooked = Boolean(booking && booking.status && booking.status !== 'completed');

  const choosePickup = (spot) => {
    savePickup(spot.id === 'pin' || !spot.id ? spot : spot.id);
    setPickup(spot);
    setSpotOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const at = [pos.coords.latitude, pos.coords.longitude];
        const place = (await reverseGeocode(at)) || { name: 'Current location', address: 'Your current location' };
        setLocating(false);
        choosePickup({ id: 'pin', lat: at[0], lng: at[1], ...place });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Emergency: save the pin as the pickup, create the booking, go to live tracking
  const handleEmergency = ({ pickup: spot }) => {
    savePickup(spot);
    setPickup({ id: 'pin', ...spot });
    navigator.vibrate?.([200, 100, 200]);
    createBooking({ type: 'emergency', forWhom: 'me' });
    setBookOpen(false);
    navigate('/tracking');
  };

  // Planned transfer: saved as a booked trip (free), shown under Trips
  const handlePlanned = ({ pickup: spot, drop, when }) => {
    addTrip({
      kind: 'scheduled',
      title: 'Planned transfer',
      patient: user?.name || '',
      pickup: spot.address,
      destination: drop.name,
      whenText: when.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
    });
    setBookOpen(false);
    navigate('/trips', { state: { banner: 'Your planned transfer is booked. It is free of cost.' } });
  };

  return (
    <div className="ahome">
      {/* ---------- Header ---------- */}
      <header className="ahome__head">
        <div className="ahome__bar">
          <button type="button" className="ahome__brand" onClick={() => setOfficialOpen(true)} aria-label="About this service">
            <BrandLogo size={30} layout="pair" sub="Govt. of A.P." />
          </button>
          <div className="ahome__actions">
            <button type="button" className="ahome__lang" onClick={() => setLang(lang === 'en' ? 'te' : 'en')}>
              {t.lang}
            </button>
            <button type="button" className="ahome__icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <i className="bi bi-person-fill" />
            </button>
          </div>
        </div>

        {loading ? (
          <h1 className="ahome__eta ahome__eta--muted">{t.finding}</h1>
        ) : nearest ? (
          <>
            <p className="ahome__eta-label">{t.in}</p>
            <h1 className="ahome__eta">{t.minutes(nearest.minutes)}</h1>
          </>
        ) : (
          <h1 className="ahome__eta ahome__eta--muted">{t.busy}</h1>
        )}

        <button type="button" className="ahome__address" onClick={() => setSpotOpen(true)}>
          <span>{pickup.name || pickup.address}</span>
          <i className="bi bi-caret-down-fill" />
        </button>
      </header>

      {/* ---------- Map ---------- */}
      <div className="ahome__map">
        <HomeMap pickup={pickup} nearest={nearest} others={others} onPickupClick={() => setBookOpen(true)} />
      </div>

      {/* ---------- Request card ---------- */}
      <section className="ahome__request">
        {isBooked ? (
          <button type="button" className="ahome__booked" onClick={() => navigate('/tracking')}>
            <span className="ahome__booked-dot" />
            <span>
              <strong>Ambulance requested</strong>
              <small>Tap to see live tracking</small>
            </span>
            <i className="bi bi-chevron-right" />
          </button>
        ) : (
          <button type="button" className="ahome__cta" onClick={() => setBookOpen(true)}>
            {t.request}
          </button>
        )}
        <p className="ahome__free">
          <b>FREE</b> for all emergencies
        </p>
        <p className="ahome__free-sub">Planned transfers for OPD visits &amp; discharge are free too</p>
        <a className="ahome__call" href="tel:108">
          <i className="bi bi-telephone-fill" /> Can't book? Call 108
        </a>
      </section>

      {/* ---------- On-board facilities ---------- */}
      <section className="ahome__section">
        <h2>On-board facilities</h2>
        <div className="ahome__row">
          {facilities.map((f) => (
            <div key={f.id} className="tile">
              <span className="tile__art"><i className={`bi ${f.icon}`} /></span>
              <span className="tile__badge tile__badge--yes"><i className="bi bi-check-lg" /></span>
              <p>{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Not supported ---------- */}
      <section className="ahome__section">
        <h2>We do not support</h2>
        <div className="ahome__row">
          {notSupported.map((f) => (
            <div key={f.id} className="tile tile--no">
              <span className="tile__art"><i className={`bi ${f.icon}`} /></span>
              <span className="tile__badge tile__badge--no"><i className="bi bi-x-lg" /></span>
              <p>{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="ahome__stats">
        <p className="ahome__stats-num"><CountUp to={stats.total} /></p>
        <p className="ahome__stats-title">Safe transfers so far</p>
        <p className="ahome__stats-area">{stats.area}</p>
        <div className="ahome__stat-tiles">
          {stats.tiles.map((s) => (
            <div key={s.id} className="ahome__stat">
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Crew ---------- */}
      <section className="ahome__crew">
        <div className="ahome__art"><AmbulanceArt blob={false} /></div>
        <div className="ahome__crew-card">
          <h2>Ambulance staff</h2>
          <p className="ahome__crew-sub">Trained and ready to give expert care</p>
          {crew.map((c) => (
            <div key={c.id} className="ahome__member">
              <span className="ahome__avatar">
                <i className={`bi ${c.icon}`} />
                <i className="bi bi-patch-check-fill ahome__verified" />
              </span>
              <span>
                <strong>{c.title}</strong>
                <small>{c.text}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      <button type="button" className="ahome__official" onClick={() => setOfficialOpen(true)}>
        <ProtocolLeaders variant="ribbon" size="md" />
      </button>

      {/* ---------- Booking flow ---------- */}
      {bookOpen && (
        <BookingSheet
          initialPickup={pickup}
          booking={booking}
          onClose={() => setBookOpen(false)}
          onEmergency={handleEmergency}
          onPlanned={handlePlanned}
        />
      )}

      {/* ---------- Where are you? ---------- */}
      <Sheet open={spotOpen} onClose={() => setSpotOpen(false)} title="Where are you?">
        <div className="spots">
          <button type="button" className="spots__item spots__item--gps" onClick={useMyLocation}>
            <i className="bi bi-crosshair" />
            <span>{locating ? 'Getting your location…' : 'Use my current location'}</span>
          </button>
          <button
            type="button"
            className="spots__item"
            onClick={() => {
              setSpotOpen(false);
              setBookOpen(true);
            }}
          >
            <i className="bi bi-pin-map-fill" />
            <span>Set location on map</span>
          </button>
          {pickupSpots.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`spots__item ${pickup.id === s.id ? 'spots__item--active' : ''}`}
              onClick={() => choosePickup(s)}
            >
              <i className="bi bi-geo-alt-fill" />
              <span>{s.address}</span>
            </button>
          ))}
        </div>
      </Sheet>

      {/* ---------- Official service info ---------- */}
      <Sheet open={officialOpen} onClose={() => setOfficialOpen(false)} title="Official Government Service">
        <div className="official-card">
          <div className="official-card__head">
            <BrandLogo size={52} layout="pair" showText={false} />
            <div>
              <b>Government of Andhra Pradesh</b>
              <span>Department of Health, Medical &amp; Family Welfare</span>
            </div>
          </div>
          <div className="official-card__leaders">
            {LEADERS.map((l) => (
              <div key={l.id} className="official-card__leader">
                <span className="official-card__photo">
                  <img src={l.src} alt={l.name} />
                </span>
                <b>{l.name}</b>
                <span>{l.title}</span>
              </div>
            ))}
          </div>
          <ul className="official-card__facts">
            <li><i className="bi bi-shield-check" /> 108 Emergency Response Service</li>
            <li><i className="bi bi-currency-rupee" /> Free of cost for every citizen</li>
            <li><i className="bi bi-clock-history" /> Available 24 × 7 across Andhra Pradesh</li>
          </ul>
        </div>
      </Sheet>

      {/* ---------- Menu ---------- */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="108 Emergency Portal">
        <div className="menu-list">
          <button type="button" className="menu-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
            <i className="bi bi-person-circle" />
            <span>My Profile{user?.name ? ` (${user.name})` : ''}</span>
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
