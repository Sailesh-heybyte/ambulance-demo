import { useEffect, useRef, useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import useOnline from '../../hooks/useOnline';
import { emergencyTypes } from '../../mock/emergencies';
import { hospitals, facilityLabels } from '../../mock/hospitals';
import { conditions } from '../../mock/conditions';
import HospitalPicker from './HospitalPicker';
import useGpsPublisher from '../../hooks/useGpsPublisher';
import './Crew.scss';
import { ambulanceUnits } from '../../mock/ambulance';
import { distanceKm } from '../../utils/geo';
import { useStaff } from '../../context/StaffAuthContext';
import GovtEmblem from '../../components/GovtEmblem';
import ProtocolLeaders from '../../components/ProtocolLeaders';
import TripProgress from '../../components/TripProgress';
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

function CrewHeader({ crew, onDuty, onLogout }) {
  return (
    <header className="crew-head">
      <GovtEmblem size={38} />
      <div className="crew-head__text">
        <strong>108 Crew</strong>
        <span>{crew.number}</span>
      </div>
      <span className={`crew-head__duty ${onDuty ? 'is-on' : ''}`}>
        <i /> {onDuty ? 'On duty' : 'Off duty'}
      </span>
      <button className="crew-head__out" onClick={onLogout} aria-label="Log out">
        <i className="bi bi-box-arrow-right" />
      </button>
    </header>
  );
}

function StatusBar({ network, gps }) {
  const ok = network && gps.state === 'ok';
  return (
    <div className={`crew-bar ${ok ? 'crew-bar--ok' : ''}`}>
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
   const { booking: anyBooking, acceptBooking,updateStatus,updateBooking, completeBooking } = useBooking();
  const { crew, logout } = useStaff();

   const [declined, setDeclined] = useState(null); // the request this driver said no to
  const myUnit = ambulanceUnits.find((u) => u.id === crew.unitId);

  // A new request is shown to every driver on duty. Once one driver
  // accepts, only that driver keeps seeing it.
  const open = anyBooking?.status === 'requested' && anyBooking.requestedAt !== declined;
  const mine = anyBooking?.ambulance?.id === crew.unitId;
  const booking = open || mine ? anyBooking : null;
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
   const accept = () => {
    if (!myUnit) return;
    const km = distanceKm([myUnit.lat, myUnit.lng], [booking.pickup.lat, booking.pickup.lng]);
    if (!acceptBooking(myUnit, km)) {
      alert('Another driver has already accepted this request.');
    }
  };
  const bar = (
    <>
      <CrewHeader crew={crew} onDuty={onDuty} onLogout={() => logout('crew')} />
      <StatusBar network={network} gps={gps} />
    </>
  );
  const initials = crew.name.split(' ').map((w) => w[0]).slice(0, 2).join('');

  // ---------- 1. Off duty ----------
  if (!onDuty) {
    return (
      <div className="crew crew--off">
        <ProtocolLeaders variant="ribbon" />
        <div className="crew__hello">
          <p>Ambulance Crew Portal</p>
          <h1>Good to see you, {crew.name.split(' ')[0]}</h1>
        </div>

        <div className="crew__profile">
          <div className="crew__avatar">{initials}</div>
          <div className="crew__who">
            <strong>{crew.name}</strong>
            <span>Driver · 108 Emergency Services</span>
          </div>
        </div>
        <dl className="crew__facts">
          <div><dt>Vehicle</dt><dd>{crew.number}</dd></div>
          <div><dt>Base station</dt><dd>{crew.station}</dd></div>
          <div><dt>Network</dt><dd className={network ? 'ok' : 'bad'}>{network ? 'Online' : 'Offline'}</dd></div>
        </dl>

        <div className="crew__checks">
          <p><i className="bi bi-geo-alt" /> Your location is shared only while on duty</p>
          <p><i className="bi bi-volume-up" /> Keep the phone volume up for job alerts</p>
        </div>

        <div className="crew__spacer" />
        <button className="crew__big" onClick={goOnDuty}>
          <i className="bi bi-power" /> Go on duty
        </button>
        <button className="crew__link" onClick={() => logout('crew')}>Log out</button>
      </div>
    );
  }

  // ---------- 2. On duty, no job ----------
  if (!booking) {
    return (
      <div className="crew">
        {bar}
        <div className="crew__wait">
          <div className="crew__radar">
            <span /><span /><span />
            <i className="bi bi-broadcast" />
          </div>
          <h2>Waiting for emergency calls</h2>
          <p>New requests near {crew.station} will ring on this phone.</p>
        </div>
        <dl className="crew__facts">
          <div><dt>Vehicle</dt><dd>{crew.number}</dd></div>
          <div><dt>Driver</dt><dd>{crew.name}</dd></div>
          <div><dt>Station</dt><dd>{crew.station}</dd></div>
        </dl>
      </div>
    );
  }

  // ---------- 3. New job alert ----------
 
   if (status === 'requested') {
    const kmAway = myUnit
      ? distanceKm([myUnit.lat, myUnit.lng], [booking.pickup.lat, booking.pickup.lng])
      : null;

    return (
      <div className="crew alert">
        {bar}
        <div className="alert__hero">
          <div className="alert__icon"><span /><i className="bi bi-bell-fill" /></div>
          <p className="alert__eyebrow">Incoming request</p>
          <h1>New emergency</h1>
        </div>
        <div className="alert__card">
          <span className="crew__tag">{typeLabel}</span>
          <p className="alert__addr"><i className="bi bi-geo-alt-fill" /> {booking.pickup.address}</p>
          <div className="alert__stats">
            {kmAway !== null && (
              <div><small>Distance</small><strong>{kmAway.toFixed(1)} km</strong></div>
            )}
            {kmAway !== null && (
              <div><small>Est. time</small><strong>~{Math.max(1, Math.round((kmAway / 30) * 60))} min</strong></div>
            )}
            <div><small>Patient</small><strong>{booking.forWhom === 'me' ? 'Caller' : 'Someone else'}</strong></div>
          </div>
        </div>
        <div className="alert__buttons">
                  <button
            className="alert__reject"
            disabled={!network}
            onClick={() => setDeclined(booking.requestedAt)}
          >
            <i className="bi bi-x-lg" /> Reject
          </button>
          <button className="alert__accept" disabled={!network} onClick={accept}>
            <i className="bi bi-check-lg" /> Accept
          </button>
        </div>
      </div>
    );
  }

  // ---------- 5. Trip complete ----------
  if (status === 'hospital') {
    return (
      <div className="crew">
        {bar}
        <div className="crew__wait">
          <div className="crew__done"><i className="bi bi-check-lg" /></div>
          <h2>Trip complete</h2>
          <p>Patient handed over at <b>{booking.hospital}</b></p>
        </div>
        <dl className="crew__facts">
          <div><dt>Trip ID</dt><dd>{booking.tripId}</dd></div>
          <div><dt>Emergency</dt><dd>{typeLabel}</dd></div>
        </dl>
        <div className="crew__spacer" />
        <button className="crew__big crew__big--green" disabled={!network || Boolean(queued)} onClick={completeBooking}>
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
      <div className="crew__titlebar">
        <h2 className="crew__title">Active trip</h2>
        {booking.tripId && <span>#{booking.tripId}</span>}
      </div>
      <div className="crew__progress"><TripProgress status={status} /></div>

      <div className="crew__card">
        <span className="crew__tag">{typeLabel}</span>
        <div className="crew__line">
          <i className="bi bi-geo-alt-fill" />
          <div><small>Pick-up</small><p>{booking.pickup.address}</p></div>
        </div>
        <div className="crew__line">
          <i className="bi bi-pin-map-fill" />
          <div><small>Landmark</small><p>{booking.pickup.name}</p></div>
        </div>
        {status === 'picked' && (
          <div className="crew__line">
            <i className="bi bi-hospital-fill" />
            <div><small>Hospital</small><p>{booking.hospital}</p></div>
          </div>
        )}
        {condLabel && (
          <div className="crew__line">
            <i className="bi bi-activity" />
            <div>
              <small>Condition</small>
              <p>{condLabel}{booking.bedNeeded ? ` · ${facilityLabels[booking.bedNeeded]} bed` : ''}</p>
            </div>
          </div>
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
        <div className="crew__dock">
          <button className="crew__big" onClick={() => handleStatus(action.next)}>
            <i className={`bi ${action.next === 'reached' ? 'bi-person-check-fill' : 'bi-hospital-fill'}`} /> {action.label}
          </button>
        </div>
      )}
    </div>
  );
}