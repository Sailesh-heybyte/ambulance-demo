import ProtocolLeaders from '../../components/ProtocolLeaders';
import GovtEmblem from '../../components/GovtEmblem';
import { ambulanceUnits } from '../../mock/ambulance';
import './SearchingScreen.scss';

// Where the "nearby ambulance" dots sit around the radar (degrees, 0 = top)
const DOTS = [28, 145, 255];

const time = (ms) => new Date(ms || Date.now()).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

// Shown right after SOS while the request goes to the ambulances.
// found = a driver has accepted (shows the green tick for a moment before the live map)
export default function SearchingScreen({ booking, found, unit, onCancel }) {
  const nearby = ambulanceUnits.length;
  const notified = booking?.notified || [];

  const steps = [
    { done: true, label: 'Request sent to 108 control room', sub: `at ${time(booking?.requestedAt)}` },
    { done: true, label: 'Your location shared', sub: booking?.pickup?.address },
    {
      done: found,
      active: !found,
      label: found ? 'Ambulance assigned' : 'Finding the nearest ambulance…',
      sub: found && unit ? `${unit.number} · ${unit.driver}` : `${nearby} ambulances on duty near you`,
    },
  ];

  return (
    <div className={`searching ${found ? 'searching--found' : ''}`}>
      <div className="searching__topbar">
        <button className="searching__back" onClick={onCancel} aria-label="Cancel and go back">
          <i className="bi bi-chevron-left" />
        </button>
        <ProtocolLeaders variant="corner" size="xl" />
      </div>

      {/* Radar with the Govt. logo in the centre */}
      <div className="searching__radar" aria-hidden="true">
        <span className="searching__ring searching__ring--1" />
        <span className="searching__ring searching__ring--2" />
        <span className="searching__ring searching__ring--3" />
        <span className="searching__orbit" />
        {DOTS.map((deg, i) => (
          <span key={deg} className="searching__dot" style={{ '--deg': `${deg}deg`, '--delay': `${0.6 + i * 0.7}s` }}>
            <span className="searching__dot-inner">
              <i className="bi bi-truck-front-fill" />
            </span>
          </span>
        ))}
        <div className="searching__core">
          <GovtEmblem size="100%" className="searching__emblem" />
          <span className="searching__tick">
            <i className="bi bi-check-lg" />
          </span>
        </div>
      </div>

      <div className="searching__head">
        <h1>{found ? 'Ambulance assigned' : 'Finding the nearest ambulance'}</h1>
        <p>{found ? 'Opening live tracking…' : 'Stay calm and stay with the patient. Live tracking starts as soon as a driver accepts.'}</p>
      </div>

      <ol className="searching__steps">
        {steps.map((s, i) => (
          <li key={i} className={`searching__step ${s.done ? 'is-done' : ''} ${s.active ? 'is-active' : ''}`}>
            <span className="searching__step-icon">{s.done ? <i className="bi bi-check-lg" /> : <span className="searching__spinner" />}</span>
            <span className="searching__step-text">
              <b>{s.label}</b>
              {s.sub && <small>{s.sub}</small>}
            </span>
          </li>
        ))}
      </ol>

      <div className="searching__info">
        <div>
          <small>Booking ID</small>
          <b>{booking?.tripId}</b>
        </div>
        <div>
          <small>Family</small>
          <b>{notified.length ? `${notified.length} notified` : 'Not added'}</b>
        </div>
        <div>
          <small>Service</small>
          <b>Free · 108</b>
        </div>
      </div>

      {!found && (
        <button className="searching__cancel" onClick={onCancel}>
          Cancel request
        </button>
      )}
    </div>
  );
}
