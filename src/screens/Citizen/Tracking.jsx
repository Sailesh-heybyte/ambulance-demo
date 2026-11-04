import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import TrackingMap from './TrackingMap';
import AmbulanceArt from '../../components/AmbulanceArt';
import { useBooking } from '../../context/BookingContext';
import { useDriverLocationAge, getCrewLocation } from '../../hooks/useGpsPublisher';
import { getProfile } from '../../utils/profile';
import { hospitals } from '../../mock/hospitals';
import { fetchRoute } from '../../utils/route';
import './Tracking.scss';
import TripProgress from '../../components/TripProgress';
const STEPS = 30; // each route is walked in 30 steps, one every 2 seconds
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

  const [step, setStep] = useState('confirmed'); // 'confirmed' or 'map'
  const [pickupIdx, setPickupIdx] = useState(0); // progress: station -> patient
  const [tripIdx, setTripIdx] = useState(0); // progress: patient -> hospital
const [sharedIds, setSharedIds] = useState([]); // contacts already messaged
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

  // The ambulance moves along route 1 after the driver accepts
  useEffect(() => {
    if (step !== 'map' || status !== 'accepted') return;
    const timer = setInterval(() => setPickupIdx((i) => (i < STEPS ? i + 1 : i)), 2000);
    return () => clearInterval(timer);
  }, [step, status]);

  // ...and along route 2 after the patient is picked up
  useEffect(() => {
    if (step !== 'map' || status !== 'picked') return;
    const timer = setInterval(() => setTripIdx((i) => (i < STEPS ? i + 1 : i)), 2000);
    return () => clearInterval(timer);
  }, [step, status]);
const [shareNote, setShareNote] = useState('');
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
  const progress = onTrip
    ? (status === 'hospital' ? STEPS : tripIdx) / STEPS
    : (status === 'reached' ? STEPS : pickupIdx) / STEPS;
  const minutesLeft = Math.max(1, Math.ceil(route.minutes * (1 - progress)));

  const etaText = {
    requested: 'Searching',
    accepted: `${minutesLeft} min away`,
    reached: 'Now',
    picked: `${minutesLeft} min to hospital`,
    hospital: 'Done',
  }[status];

  const handleCall = () => {
    alert('Connecting through a masked number. You and the driver will not see each other’s real number.');
  };

  const handleMessage = () => {
    alert('Message sent through the app. The driver will not see your number.');
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
      `🚑 Emergency! I have requested an ambulance (Trip ${booking.tripId}).`,
      `Status: ${TITLES[status]}${etaText ? ` (${etaText})` : ''}`,
      `Ambulance ${unit.number}, driver ${unit.driver}`,
      `Ambulance location now: ${mapLink(ambulancePlace())}`,
      `My pickup point (${spot.address}): ${mapLink(patient)}`,
    ];
    if (hospitalChosen) lines.push(`Going to: ${booking.hospital}`);
    return lines.join('\n');
  };

  // The existing "Share" button: phone share sheet, or WhatsApp as a fallback
   // Opens the phone's own share sheet (WhatsApp, Instagram, Mail, Messages...)
  const handleShare = async () => {
    const text = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ambulance on the way', text });
      } catch {
        /* the person closed the share sheet */
      }
      return;
    }

    // Browsers with no share sheet (most desktops): copy the message instead
    try {
      await navigator.clipboard.writeText(text);
      setShareNote('Message copied. Paste it in any app.');
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  // One tap per contact: opens WhatsApp to that person's number
  const shareWithContact = (c) => {
    window.open(`https://wa.me/91${c.phone}?text=${encodeURIComponent(buildShareText())}`, '_blank');
    setSharedIds((ids) => (ids.includes(c.id) ? ids : [...ids, c.id]));
  };

  const contacts = getProfile().contacts;
  const handleCancel = () => {
    clearBooking();
    navigate('/');
  };
  // Trip finished: save it to "Your trips" first
  const handleDone = () => {
    completeBooking();
    navigate('/');
  };
   // No driver yet? Stay on this screen and show no driver details.
  if (step === 'confirmed' || !unit) {
    return (
      <div className="confirmed">
        <button className="confirmed__back" onClick={handleCancel}>
          <i className="bi bi-chevron-left" />
        </button>

        <div className="confirmed__art">
        <AmbulanceArt />
        </div>

        <div className="confirmed__text">
                   <h1>
            {unit ? 'Ambulance and responders are on a way' : 'Looking for the nearest ambulance'}
          </h1>
          <p>
            {unit
              ? 'Stay calm and speak gently to the patient until help arrives. The nearest ambulance has been alerted.'
              : 'Your request has been sent to all ambulances on duty. Stay calm and speak gently to the patient. Driver details will appear here as soon as a driver accepts.'}
          </p>
        </div>

        <div className="confirmed__actions">
                   <button className="confirmed__primary" disabled={!unit} onClick={() => setStep('map')}>
            {unit ? 'See responders on map' : 'Waiting for a driver…'}
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
      <TrackingMap
        path={route.points}
        progress={progress}
        patient={patient}
        hospital={hospitalChosen && hospital ? { name: hospital.name, position: hospitalPos } : null}
      />

      <button className="track__back" onClick={() => setStep('confirmed')}>
        <i className="bi bi-chevron-left" />
      </button>

      <div className="track__card">
        <div className="track__status">
          <h3>{TITLES[status]}</h3>
          <span className="track__eta">{etaText}</span>
        </div>
        <TripProgress status={status} />
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
          <div>
            <h4>{unit.driver}</h4>
            <p>Ambulance {unit.number}</p>
            <p>From {unit.station}</p>
          </div>
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
          <button className="track__msg" onClick={handleMessage}>
            <i className="bi bi-chat-dots-fill" /> Message
          </button>
          <button className="track__share" onClick={handleShare}>
            <i className="bi bi-share-fill" /> Share
          </button>
        </div>
                {booking.forWhom === 'me' && (
          <div className="share">
            <h4 className="share__title">
              <i className="bi bi-people-fill" /> Share with family &amp; friends
            </h4>
            <p className="share__hint">
              Choose any app: WhatsApp, Instagram, Messages, Mail and more.
            </p>

            <button className="share__main" onClick={handleShare}>
              <i className="bi bi-share-fill" /> Share ambulance location
            </button>
            {shareNote && <p className="share__note">{shareNote}</p>}

            {contacts.length > 0 ? (
              <>
                <p className="share__or">or send directly to</p>
                <div className="share__list">
                  {contacts.map((c) => {
                    const sent = sharedIds.includes(c.id);
                    return (
                      <button key={c.id} className="share__row" onClick={() => shareWithContact(c)}>
                        <span className="share__avatar">{c.name.charAt(0)}</span>
                        <span className="share__who">
                          <strong>{c.name}</strong>
                          <small>{c.relation || c.phone}</small>
                        </span>
                        <span className={`share__send ${sent ? 'is-sent' : ''}`}>
                          {sent ? (
                            <><i className="bi bi-check2" /> Sent</>
                          ) : (
                            <><i className="bi bi-whatsapp" /> Send</>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <button className="share__add" onClick={() => navigate('/profile')}>
                <i className="bi bi-person-plus-fill" /> Add emergency contacts
              </button>
            )}
          </div>
        )} 
        <button
          className="track__aid"
          onClick={() => navigate('/first-aid', { state: { id: booking.type } })}
        >
          <i className="bi bi-heart-pulse-fill" /> First aid tips while you wait
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