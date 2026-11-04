import { useEffect, useRef, useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import useOnline from '../../hooks/useOnline';
import { emergencyTypes } from '../../mock/emergencies';
import { hospitals, facilityLabels } from '../../mock/hospitals';
import { conditions } from '../../mock/conditions';
import HospitalPicker from './HospitalPicker';
import useGpsPublisher from '../../hooks/useGpsPublisher';
import './Crew.scss';
import { useStaff } from '../../context/StaffAuthContext';
const QUEUE_KEY = 'ambulance_crew_queue';

// For each status, which button the driver sees and what it changes to
const NEXT = {
  accepted: { label: 'Reached patient', next: 'reached' },
  picked: { label: 'Reached hospital', next: 'hospital' },
};

function gpsText(network, gps) {
  if (!network) return 'GPS updates paused (offline)';
  switch (gps.state) {
    case 'ok':
      return gps.ageSec === null ? 'GPS connected' : `GPS live · updated ${gps.ageSec}s ago`;
    case 'denied':
      return 'Location is blocked. Allow it in your browser settings.';
    case 'unsupported':
      return 'GPS is not available on this device';
    case 'error':
      return 'Cannot read your location';
    default:
      return 'Finding your location…';
  }
}

function StatusBar({ network, gps }) {
  return (
    <div className="crew-bar">
      {!network && (
        <div className="crew-bar__offline">
          <i className="bi bi-wifi-off" /> Offline. Updates will be sent when you reconnect.
        </div>
      )}
      <div className="crew-bar__gps">
        <i className="bi bi-geo-alt-fill" /> {gpsText(network, gps)}
      </div>
    </div>
  );
}

export default function Crew() {
   const { booking: anyBooking, updateStatus,updateBooking, clearBooking } = useBooking();
  const { crew, logout } = useStaff();

  // Only show a job if it was sent to THIS crew's ambulance
  const booking = anyBooking?.ambulance?.id === crew.unitId ? anyBooking : null;
  const network = useOnline();
  const [onDuty, setOnDuty] = useState(false);
 
  const [queued, setQueued] = useState(() => localStorage.getItem(QUEUE_KEY));
  const audioRef = useRef(null);
  const gps = useGpsPublisher(onDuty);

  // A status tapped while offline is shown right away, but not yet sent
  const status = (booking && queued) || booking?.status;
  const typeLabel = emergencyTypes.find((t) => t.id === booking?.type)?.label;
 
  // Send the saved status to the citizen and hospital
  const syncQueue = () => {
    const next = localStorage.getItem(QUEUE_KEY);
    if (!next) return;
    localStorage.removeItem(QUEUE_KEY);
    setQueued(null);
    if (booking) updateStatus(next);
  };

  // When the internet comes back, sync automatically
  useEffect(() => {
    window.addEventListener('online', syncQueue);
    return () => window.removeEventListener('online', syncQueue);
  });

  const handleStatus = (next) => {
    if (network) {
      updateStatus(next);
    } else {
      localStorage.setItem(QUEUE_KEY, next);
      setQueued(next);
    }
  };

  // Browsers only allow sound after a click, so we create it on "Go on duty"
  const goOnDuty = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioRef.current = new AudioCtx();
    setOnDuty(true);
    if (network) syncQueue();
  };

  // Loud beeping while a new job is waiting
  useEffect(() => {
    if (!onDuty || status !== 'requested') return;
    const ctx = audioRef.current;

    const beep = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    };

    beep();
    const id = setInterval(beep, 800);
    return () => clearInterval(id);
  }, [onDuty, status]);

   const openNavigation = () => {
    // Before pickup: go to the patient. After pickup: go to the hospital.
    const hospital = hospitals.find((h) => h.id === booking?.hospitalId);
    const [lat, lng] =
      status === 'picked' && hospital
        ? [hospital.lat, hospital.lng]
        : [booking.pickup.lat, booking.pickup.lng];
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank'
    );
  };

  const callPatient = () => {
    alert('Calling the caller through a masked number.');
  };
  const confirmPickup = (choice) => updateBooking({ ...choice, status: 'picked' });
  const bar = <StatusBar network={network} gps={gps} />;

  // ---------- 1. Off duty ----------
  if (!onDuty) {
    return (
      <div className="crew crew--center">
        <div className="crew__logo"><i className="bi bi-truck-front-fill" /></div>
        <h2>Ambulance Crew</h2>
                   <p>{crew.name} · {crew.number}</p>
        <button className="crew__big" onClick={goOnDuty}>Go on duty</button>
        <button className="crew__link" onClick={() => logout('crew')}>Log out</button>
      </div>
    );
  }

  // ---------- 2. On duty, no job ----------
  if (!booking) {
    return (
      <div className="crew crew--center">
        {bar}
        <div className="crew__pulse"><i className="bi bi-broadcast" /></div>
        <h2>You are on duty</h2>
        <p>Waiting for emergency calls…</p>
             <button className="crew__link" onClick={() => logout('crew')}>Log out</button>
      </div>
    );
  }

  // ---------- 3. New job alert ----------
  if (status === 'requested') {
    return (
      <div className="alert">
        {bar}
        <div className="alert__icon"><i className="bi bi-bell-fill" /></div>
        <h1>New emergency!</h1>
        <div className="alert__card">
          <h2>{typeLabel}</h2>
          <p><i className="bi bi-geo-alt-fill" /> {booking.pickup.address}</p>
          <p><i className="bi bi-signpost-fill" /> {booking.distanceText}</p>
          <p>For: {booking.forWhom === 'me' ? 'The caller' : 'Someone else'}</p>
        </div>
        <div className="alert__buttons">
          <button className="alert__reject" disabled={!network} onClick={clearBooking}>
            Reject
          </button>
          <button
            className="alert__accept"
            disabled={!network}
            onClick={() => updateStatus('accepted')}
          >
            Accept
          </button>
        </div>
      </div>
    );
  }

  // ---------- 5. Trip complete ----------
  if (status === 'hospital') {
    return (
      <div className="crew crew--center">
        {bar}
        <div className="crew__done"><i className="bi bi-check-lg" /></div>
        <h2>Trip complete</h2>
        <p>Patient handed over at {booking.hospital}</p>
        <button className="crew__big" disabled={!network || Boolean(queued)} onClick={clearBooking}>
          {network && !queued ? 'Finish' : 'Waiting to sync…'}
        </button>
      </div>
    );
  }

    // ---------- 4. Active trip ----------
  const action = NEXT[status];
  const condLabel = conditions.find((c) => c.id === booking.condition)?.label;

  return (
    <div className={`crew ${!network ? 'crew--offline' : ''}`}>
      {bar}
      <h2 className="crew__title">Active trip</h2>

      <div className="crew__card">
        <span className="crew__tag">{typeLabel}</span>
        <p><i className="bi bi-geo-alt-fill" /> {booking.pickup.address}</p>
        <p><i className="bi bi-pin-map-fill" /> Landmark:{booking.pickup.name}</p>
        {status !== 'reached' && (
          <p><i className="bi bi-hospital-fill" /> Hospital: {booking.hospital}</p>
        )}
        {condLabel && (
          <p>
            <i className="bi bi-activity" /> Condition: {condLabel}
            {booking.bedNeeded ? ` · ${facilityLabels[booking.bedNeeded]} bed` : ''}
          </p>
        )}
      </div>

      {status === 'reached' && (
        <HospitalPicker booking={booking} disabled={!network} onConfirm={confirmPickup} />
      )}

      <div className="crew__row">
        <button className="crew__nav" onClick={openNavigation}>
          <i className="bi bi-cursor-fill" /> Navigate
        </button>
        <button className="crew__call" onClick={callPatient}>
          <i className="bi bi-telephone-fill" /> Call
        </button>
      </div>

      {queued && (
        <p className="crew__pending">
          <i className="bi bi-cloud-arrow-up-fill" /> Saved on this phone. It will be sent when you are online.
        </p>
      )}

      {action && (
        <button className="crew__big crew__big--bottom" onClick={() => handleStatus(action.next)}>
          {action.label}
        </button>
      )}
    </div>
  );
}