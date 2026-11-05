import { useEffect, useRef, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import TrackingMap from './TrackingMap';
import SearchingScreen from './SearchingScreen';
import { useBooking } from '../../context/BookingContext';
import { useDriverLocationAge, getCrewLocation } from '../../hooks/useGpsPublisher';
import { hospitals } from '../../mock/hospitals';
import { fetchRoute } from '../../utils/route';
import './Tracking.scss';
import TripProgress from '../../components/TripProgress';
const STEPS = 30; // each route is walked in 30 steps, one every 2 seconds
// Demo drive time for each leg (station → patient, patient → hospital). Change to make it slower/faster.
const DRIVE_MS = STEPS * 2000; // 60 seconds
const FALLBACK_MINUTES = 8;

const TITLES = {
  requested: 'Finding the nearest ambulance…',
  accepted: 'Ambulance is on the way',
  reached: 'Ambulance has reached you',
  picked: 'On the way to the hospital',
  hospital: 'Reached the hospital',
};

export default function Tracking() {
  const navigate = useNavigate();
  const { booking, clearBooking , completeBooking } = useBooking();
  const status = booking?.status;
  const driverAge = useDriverLocationAge();

   const unit = booking?.status === 'requested' ? null : booking?.ambulance;
  const spot = booking?.pickup;
  // The crew picks the hospital when the patient is picked up.
  // Before that the saved hospital is only a suggestion, so do not show it.
  const hospitalChosen = status === 'picked' || status === 'hospital';
  const hospital = hospitals.find((h) => h.id === booking?.hospitalId);

  const start = unit ? [unit.lat, unit.lng] : null;
  const patient = spot ? [spot.lat, spot.lng] : null;
  const hospitalPos = hospital ? [hospital.lat, hospital.lng] : null;

  const [step, setStep] = useState(unit ? 'map' : 'confirmed'); // 'confirmed' or 'map'
  // When each drive started (fallback if the booking has no timestamp)
  const driveStart = useRef({ accepted: Date.now(), picked: Date.now() });
  const [now, setNow] = useState(() => Date.now()); // ticks every second for the ETA text

  // A driver accepted: show the green tick for a moment, then open the live map
  const [found, setFound] = useState(false);
  useEffect(() => {
    if (!unit || step === 'map') return;
    setFound(true);
    if (navigator.vibrate) navigator.vibrate([60, 60, 120]);
    const t = setTimeout(() => setStep('map'), 1600);
    return () => clearTimeout(t);
  }, [unit, step]);

  // Until the real roads load, each route is a straight line
  const [toPatient, setToPatient] = useState({
    points: start && patient ? [start, patient] : [],
    minutes: FALLBACK_MINUTES,
  });
  const [toHospital, setToHospital] = useState({
    points: patient && hospitalPos ? [patient, hospitalPos] : [],
    minutes: FALLBACK_MINUTES,
  });

  const sLat = unit?.lat;
  const sLng = unit?.lng;
  const pLat = spot?.lat;
  const pLng = spot?.lng;
  const hLat = hospital?.lat;
  const hLng = hospital?.lng;

  // Route 1: ambulance station -> patient
  useEffect(() => {
    if (sLat === undefined || pLat === undefined) return;
    let cancelled = false;
    fetchRoute([sLat, sLng], [pLat, pLng])
      .then((r) => !cancelled && setToPatient(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sLat, sLng, pLat, pLng]);

  // Route 2: patient -> hospital
  useEffect(() => {
    if (pLat === undefined || hLat === undefined) return;
    let cancelled = false;
    fetchRoute([pLat, pLng], [hLat, hLng])
      .then((r) => !cancelled && setToHospital(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pLat, pLng, hLat, hLng]);

  // The ambulance glides along the road (TrackingMap animates it); this tick only updates the ETA text
  useEffect(() => {
    if (step !== 'map') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  // No booking (cancelled, finished or old data): go back home
  if (!booking || !patient) return <Navigate to="/" replace />;
  // Which route and progress to show for the current status
  const onTrip = status === 'picked' || status === 'hospital';
   const current = onTrip ? toHospital : toPatient;
  // Straight line until the real road has loaded
  const route =
    current.points.length > 1
      ? current
      : { ...current, points: onTrip ? [patient, hospitalPos] : [start, patient] };
  const legStart = onTrip
    ? booking.pickedAt || driveStart.current.picked
    : booking.acceptedAt || driveStart.current.accepted;
  const legDone = status === 'reached' || status === 'hospital';
  const progress = legDone ? 1 : Math.max(0, Math.min(1, (now - legStart) / DRIVE_MS));
  const minutesLeft = Math.max(1, Math.ceil(route.minutes * (1 - progress)));

  const etaText = {
    requested: 'Searching',
    accepted: progress >= 0.98 ? 'Arriving now' : `${minutesLeft} min away`,
    reached: 'Now',
    picked: progress >= 0.98 ? 'Arriving at hospital' : `${minutesLeft} min to hospital`,
    hospital: 'Done',
  }[status];

    const handleCall = () => {
    if (!unit?.phone) {
      alert('Driver number is not available.');
      return;
    }
    window.location.href = `tel:+91${unit.phone}`;
  };
 

    // Ambulance position: the driver's real GPS if it is fresh,
  // otherwise the spot on the route where the app shows it
  const ambulancePlace = () => {
    const gps = getCrewLocation();
    if (gps && Date.now() - gps.at < 30000) return [gps.lat, gps.lng];
    const pts = route.points;
    return pts[Math.round(progress * (pts.length - 1))] || start;
  };

  const mapLink = ([lat, lng]) => `https://www.google.com/maps?q=${lat},${lng}`;

  const buildShareText = () => {
    const lines = [
      `🚑 Emergency! An ambulance has been requested (Trip ${booking.tripId}).`,
      `Status: ${TITLES[status]}${etaText ? ` (${etaText})` : ''}`,
      `Ambulance ${unit.number}, driver ${unit.driver}`,
      `Ambulance location now: ${mapLink(ambulancePlace())}`,
      `Pickup point (${spot.address}): ${mapLink(patient)}`,
    ];
    if (hospitalChosen) lines.push(`Going to: ${booking.hospital}`);
    return lines.join('\n');
  };

  // Opens the phone's own share menu (WhatsApp, Instagram, Messages, Mail...)
  const handleShare = async () => {
    const text = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ambulance on the way', text });
      } catch {
        /* the person closed the share menu */
      }
      return;
    }

    // Browsers with no share menu (most desktops): fall back to WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
   
};
  const handleCancel = () => {
    clearBooking();
    navigate('/');
  };
  // Trip finished: save it to "Your trips" first
  const handleDone = () => {
    completeBooking();
    navigate('/');
  };
   // While waiting for a driver, show the searching screen.
  // As soon as a driver accepts (unit is assigned), automatically show the live map.
  if (step !== 'map') {
    return <SearchingScreen booking={booking} found={found} unit={unit} onCancel={handleCancel} />;
  }

  // ---------- Stage 2: live map ----------
  return (
    <div className="track">
      <TrackingMap
        path={route.points}
        startAt={legStart}
        durationMs={DRIVE_MS}
        done={legDone}
        patient={patient}
        hospital={hospitalChosen && hospital ? { name: hospital.name, position: hospitalPos } : null}
      />

      <button className="track__back" onClick={() => navigate('/')}>
        <i className="bi bi-chevron-left" />
      </button>

      <div className="track__card">
        <div className="track__status">
          <h3>{TITLES[status]}</h3>
          <span className="track__eta">{etaText}</span>
        </div>
        <div className="track__progress"><TripProgress status={status} /></div>
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
          <div className="track__avatar">{unit.driver.charAt(0)}</div>
          <div className="track__driver-info">
            <h4>{unit.driver}</h4>
            <p>{unit.station}</p>
          </div>
          <span className="track__plate">{unit.number}</span>
        </div>

        {hospitalChosen && (
          <p className="track__hospital">
            <i className="bi bi-hospital-fill" /> Going to: {booking.hospital}
          </p>
        )}

        <div className="track__buttons">
          <button className="track__call" onClick={handleCall}>
            <i className="bi bi-telephone-fill" /> Call
          </button>
          <button className="track__share" onClick={handleShare}>
            <i className="bi bi-share-fill" /> Share
          </button>
        </div>
              
        <button
          className="track__aid"
          onClick={() => navigate('/first-aid', { state: { id: booking.type } })}
        >
          <i className="bi bi-heart-pulse-fill" /> <span>First aid tips while you wait</span>
          <i className="bi bi-chevron-right" />
        </button>

        <button
          className={`track__cancel ${status === 'hospital' ? 'track__cancel--done' : ''}`}
          onClick={status === 'hospital' ? handleDone : handleCancel}
        >
          {status === 'hospital' ? 'Done' : 'Cancel request'}
        </button>
      </div>
    </div>
  );
}