import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import TrackingMap from './TrackingMap';
import AmbulanceArt from '../../components/AmbulanceArt';
import { useBooking } from '../../context/BookingContext';
import { useDriverLocationAge } from '../../hooks/useGpsPublisher';
import { ambulance, routePoints, patientLocation } from '../../mock/ambulance';
import { fetchRoute } from '../../utils/route';
import './Tracking.scss';

const STEPS = 30; // the ambulance moves in 30 steps, one every 2 seconds
const FALLBACK_MINUTES = 8;
const ARRIVED = ['reached', 'picked', 'hospital'];

const TITLES = {
  requested: 'Finding the nearest ambulance…',
  accepted: 'Ambulance is on the way',
  reached: 'Ambulance has reached you',
  picked: 'On the way to the hospital',
  hospital: 'Reached the hospital',
};

export default function Tracking() {
  const navigate = useNavigate();
  const { booking, clearBooking } = useBooking();
  const [step, setStep] = useState('confirmed'); // 'confirmed' or 'map'
  const [index, setIndex] = useState(0);
  const [route, setRoute] = useState({ points: routePoints, minutes: FALLBACK_MINUTES });
  const driverAge = useDriverLocationAge();
  const status = booking?.status;

  // Ask for the real road path once. If it fails, we keep the straight demo line.
  useEffect(() => {
    let cancelled = false;
    fetchRoute(routePoints[0], patientLocation)
      .then((result) => {
        if (!cancelled) setRoute(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // The ambulance only moves after the driver accepts
  useEffect(() => {
    if (step !== 'map' || status !== 'accepted') return;
    const timer = setInterval(() => {
      setIndex((i) => (i < STEPS ? i + 1 : i));
    }, 2000);
    return () => clearInterval(timer);
  }, [step, status]);

  // No booking (cancelled or finished): go back home
  if (!booking) return <Navigate to="/" replace />;

  const shownIndex = ARRIVED.includes(status) ? STEPS : index;
  const progress = shownIndex / STEPS;
  const minutesLeft = Math.max(1, Math.ceil(route.minutes * (1 - progress)));

  const etaText = {
    requested: 'Searching',
    accepted: `${minutesLeft} min away`,
    reached: 'Now',
    picked: 'En route',
    hospital: 'Done',
  }[status];

  const handleCall = () => {
    alert('Connecting through a masked number. You and the driver will not see each other’s real number.');
  };

  const handleMessage = () => {
    alert('Message sent through the app. The driver will not see your number.');
  };

  const handleShare = () => {
    const text = `Track my ambulance live: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCancel = () => {
    clearBooking();
    navigate('/');
  };

  // ---------- Stage 1: red confirmation screen ----------
  if (step === 'confirmed') {
    return (
      <div className="confirmed">
        <button className="confirmed__back" onClick={handleCancel}>
          <i className="bi bi-chevron-left" />
        </button>

        <div className="confirmed__art">
          <AmbulanceArt />
        </div>

        <div className="confirmed__text">
          <h1>Ambulance and responders are on a way</h1>
          <p>
            Stay calm and speak gently to the patient until help arrives.
            The nearest ambulance has been alerted.
          </p>
        </div>

        <div className="confirmed__actions">
          <button className="confirmed__primary" onClick={() => setStep('map')}>
            See responders on map
          </button>
          <button className="confirmed__link" onClick={handleCancel}>
            Cancel request
          </button>
        </div>
      </div>
    );
  }

  // ---------- Stage 2: live map ----------
  return (
    <div className="track">
      <TrackingMap path={route.points} progress={progress} />

      <button className="track__back" onClick={() => setStep('confirmed')}>
        <i className="bi bi-chevron-left" />
      </button>

      <div className="track__card">
        <div className="track__status">
          <h3>{TITLES[status]}</h3>
          <span className="track__eta">{etaText}</span>
        </div>

        <p className="track__notified">
          <i className="bi bi-bell-fill" />{' '}
          {booking.notified?.length
            ? `Notified: ${booking.notified.join(', ')}`
            : 'No emergency contacts added. Add them in Profile.'}
        </p>

        {driverAge !== null && ['accepted', 'reached', 'picked'].includes(status) && (
          <p className="track__notified">
            <i className="bi bi-geo-alt-fill" />{' '}
            {driverAge > 30
              ? 'Driver location is not updating. The driver may be offline.'
              : `Driver location updated ${driverAge}s ago`}
          </p>
        )}

        <div className="track__driver">
          <div className="track__avatar">{ambulance.driver.charAt(0)}</div>
          <div>
            <h4>{ambulance.driver}</h4>
            <p>Ambulance {ambulance.number}</p>
          </div>
        </div>

        <p className="track__hospital">
          <i className="bi bi-hospital-fill" /> Going to: {booking.hospital}
        </p>

        <div className="track__buttons">
          <button className="track__call" onClick={handleCall}>
            <i className="bi bi-telephone-fill" /> Call
          </button>
          <button className="track__msg" onClick={handleMessage}>
            <i className="bi bi-chat-dots-fill" /> Message
          </button>
          <button className="track__share" onClick={handleShare}>
            <i className="bi bi-share-fill" /> Share
          </button>
        </div>

        <button
          className="track__aid"
          onClick={() => navigate('/first-aid', { state: { id: booking.type } })}
        >
          <i className="bi bi-heart-pulse-fill" /> First aid tips while you wait
        </button>

        <button className="confirmed__link track__cancel" onClick={handleCancel}>
          {status === 'hospital' ? 'Done' : 'Cancel request'}
        </button>
      </div>
    </div>
  );
}