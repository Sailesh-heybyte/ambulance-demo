import { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { emergencyTypes } from '../../mock/emergencies';
import { hospitals, facilityLabels, neededFacility, prepNotes } from '../../mock/hospitals';
import { getBeds, saveBeds } from '../../utils/beds';

import './Hospital.scss';
import TripProgress from '../../components/TripProgress';
import { useStaff } from '../../context/StaffAuthContext';
import { formatAbha } from '../../utils/profile';
import { conditions } from '../../mock/conditions';
import GovtEmblem from '../../components/GovtEmblem';
import { LEADERS } from '../../components/ProtocolLeaders';
const BED_ICON = {
  icu: 'bi-heart-pulse',
  ventilator: 'bi-lungs',
  trauma: 'bi-bandaid',
  maternity: 'bi-person-heart',
};

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const STATUS_TEXT = {
  accepted: 'Ambulance dispatched',
  reached: 'Ambulance has reached the patient',
  picked: 'Patient on board, arriving soon',
  hospital: 'Patient has arrived',
};

export default function Hospital() {
  const { booking } = useBooking();
  const [allBeds, setAllBeds] = useState(getBeds);
  const { hospital: session, logout } = useStaff();
  const MY_ID = session.hospitalId;
  const me = hospitals.find((h) => h.id === MY_ID);
  const beds = allBeds[MY_ID];

  const changeBeds = (key, delta) => {
    const next = {
      ...allBeds,
      [MY_ID]: { ...beds, [key]: Math.max(0, beds[key] + delta) },
    };
    setAllBeds(next);
    saveBeds(next);
  };

  // Only show patients heading to THIS hospital, once a driver has accepted
  const incoming =
    booking && booking.hospitalId === MY_ID && booking.status !== 'requested'
      ? booking
      : null;
  const typeLabel = emergencyTypes.find((t) => t.id === incoming?.type)?.label;
   const needed = incoming ? facilityLabels[incoming.bedNeeded || neededFacility[incoming.type]] : '';
  const condition = conditions.find((c) => c.id === incoming?.condition);
  const totalFree = Object.keys(facilityLabels).reduce((n, k) => n + (beds[k] || 0), 0);
  const today = new Date().toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const arrived = incoming?.status === 'hospital';

  return (
    <div className="portal">
      {/* ---------- Official header ---------- */}
      <header className="portal__header">
        <div className="portal__header-in">
          <GovtEmblem size={46} className="portal__emblem" />
          <div className="portal__title">
            <span className="portal__eyebrow"><span className="portal__eyebrow-short">Govt. of A.P. · 108 ER</span><span className="portal__eyebrow-more">Govt. of Andhra Pradesh · 108 Emergency Services</span></span>
            <h1>{me.name}</h1>
          </div>
          <div className="portal__leaders" aria-label="Official dignitaries">
            {LEADERS.map((l) => (
              <span key={l.id} className="portal__leader" title={`${l.name} - ${l.title}`}>
                <img src={l.src} alt={l.name} />
              </span>
            ))}
          </div>
          <button className="portal__logout" onClick={() => logout('hospital')}>
            <i className="bi bi-box-arrow-right" /> <span>Log out</span>
          </button>
        </div>
      </header>

      <main className="portal__body">
        <div className="portal__intro">
          <div>
            <h2>Emergency Department</h2>
            <p>{today} · Live updates from 108 ambulances</p>
          </div>
          <span className="portal__live"><i /> Live</span>
        </div>

        {/* ---------- Summary tiles ---------- */}
        <div className="stats">
          <div className={`stats__tile ${incoming && !arrived ? 'stats__tile--alert' : ''}`}>
            <i className="bi bi-truck-front" />
            <div><small>Incoming</small><strong>{incoming && !arrived ? 1 : 0}</strong></div>
          </div>
          <div className="stats__tile">
            <i className="bi bi-grid-3x3-gap" />
            <div><small>Free beds</small><strong>{totalFree}</strong></div>
          </div>
          <div className="stats__tile">
            <i className="bi bi-heart-pulse" />
            <div><small>ICU free</small><strong>{beds.icu ?? 0}</strong></div>
          </div>
          <div className="stats__tile">
            <i className="bi bi-lungs" />
            <div><small>Ventilators</small><strong>{beds.ventilator ?? 0}</strong></div>
          </div>
        </div>

        <div className="portal__grid">
          {/* ---------- Incoming patients ---------- */}
          <section className="panel panel--incoming">
            <div className="panel__head">
              <h3><i className="bi bi-bell" /> Incoming patient</h3>
              {incoming && <span className="panel__count">Trip #{incoming.tripId}</span>}
            </div>

            {!incoming && (
              <div className="panel__empty">
                <div className="panel__empty-icon"><i className="bi bi-hospital" /></div>
                <strong>No incoming patients right now</strong>
                <p>When an ambulance picks this hospital, the patient details will appear here instantly.</p>
              </div>
            )}

            {incoming && (
              <div className={`incoming ${arrived ? 'incoming--arrived' : ''}`}>
                <div className="incoming__top">
                  <span className="incoming__type">{typeLabel}</span>
                  <span className="incoming__status"><i /> {STATUS_TEXT[incoming.status]}</span>
                </div>

                <div className="incoming__progress"><TripProgress status={incoming.status} /></div>

                <dl className="incoming__details">
                  <div><dt>Condition</dt><dd className={`cond cond--${condition?.tone || 'none'}`}>{condition ? condition.label : 'Not set yet'}</dd></div>
                  <div><dt>Bed needed</dt><dd>{needed}</dd></div>
                  <div><dt>Ambulance</dt><dd>{incoming.ambulance?.number || '—'}</dd></div>
                  <div><dt>Driver</dt><dd>{incoming.ambulance?.driver || '—'}</dd></div>
                  <div><dt>Dispatched</dt><dd>{fmtTime(incoming.acceptedAt)}</dd></div>
                  <div><dt>Picked up</dt><dd>{fmtTime(incoming.pickedAt)}</dd></div>
                  <div className="wide"><dt>Pick-up location</dt><dd>{incoming.pickup?.address}</dd></div>
                  <div className="wide"><dt>ABHA health ID</dt><dd>{incoming.abha ? formatAbha(incoming.abha) : 'Not shared'}</dd></div>
                </dl>

                <div className="incoming__prep">
                  <i className="bi bi-clipboard2-pulse" />
                  <div>
                    <h4>Get the ER team ready</h4>
                    <p>{prepNotes[incoming.type]}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ---------- Bed availability ---------- */}
          <section className="panel">
            <div className="panel__head">
              <h3><i className="bi bi-grid-3x3-gap" /> Bed availability</h3>
            </div>
            <p className="panel__hint">
              Keep these numbers up to date. Ambulances are sent to the nearest
              hospital that has a free bed for the emergency.
            </p>

            <div className="beds">
              {Object.keys(facilityLabels).map((key) => (
                <div className={`beds__row ${beds[key] === 0 ? 'is-zero' : ''}`} key={key}>
                  <span className="beds__icon"><i className={`bi ${BED_ICON[key] || 'bi-hospital'}`} /></span>
                  <span className="beds__label">
                    {facilityLabels[key]}
                    <small>{beds[key] === 0 ? 'Full' : 'Available'}</small>
                  </span>
                  <div className="beds__controls">
                    <button onClick={() => changeBeds(key, -1)} disabled={beds[key] === 0} aria-label={`Remove ${facilityLabels[key]} bed`}>
                      <i className="bi bi-dash-lg" />
                    </button>
                    <strong className={beds[key] === 0 ? 'beds__zero' : ''}>{beds[key]}</strong>
                    <button onClick={() => changeBeds(key, 1)} aria-label={`Add ${facilityLabels[key]} bed`}>
                      <i className="bi bi-plus-lg" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="panel__saved"><i className="bi bi-cloud-check" /> Changes are saved and shared instantly</p>
          </section>
        </div>

        <footer className="portal__footer">
          Health, Medical &amp; Family Welfare Department · Government of Andhra Pradesh
        </footer>
      </main>
    </div>
  );
}
