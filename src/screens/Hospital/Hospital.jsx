import { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { emergencyTypes } from '../../mock/emergencies';
import { hospitals, facilityLabels, neededFacility, prepNotes } from '../../mock/hospitals';
import { getBeds, saveBeds } from '../../utils/beds';
import { user } from '../../mock/user';
import './Hospital.scss';
import { useStaff } from '../../context/StaffAuthContext';
import { formatAbha } from '../../utils/profile';
import { conditions } from '../../mock/conditions';
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
  return (
    <div className="portal">
      <header className="portal__header">
        <div className="portal__logo"><i className="bi bi-hospital-fill" /></div>
        <div>
                
          <h1>{me.name}</h1>
          <p>Emergency department portal</p>
        </div>
      </header>

      <div className="portal__grid">
        {/* ---------- Incoming patients ---------- */}
        <section className="panel">
          <h2><i className="bi bi-bell-fill" /> Incoming patients</h2>

          {!incoming && (
            <p className="panel__empty">No incoming patients right now.</p>
          )}

          {incoming && (
            <div className="incoming">
              <div className="incoming__top">
                <span className="incoming__type">{typeLabel}</span>
                <span className="incoming__status">{STATUS_TEXT[incoming.status]}</span>
              </div>

              <dl className="incoming__details">
                <div><dt>Patient</dt><dd>{incoming.forWhom === 'me' ? user.name : 'Someone else (caller booked)'}</dd></div>
               <div><dt>Pick-up</dt><dd>{incoming.pickup?.address}</dd></div>
                               <div><dt>Condition</dt><dd>{condition ? condition.label : 'Not set yet'}</dd></div>
               <div><dt>Bed needed</dt><dd>{needed}</dd></div>
                              <div><dt>ABHA ID</dt><dd>{incoming.abha ? formatAbha(incoming.abha) : 'Not shared'}</dd></div>
              </dl>

              <div className="incoming__prep">
                <h4>Get the ER team ready</h4>
                <p>{prepNotes[incoming.type]}</p>
              </div>
            </div>
          )}
        </section>

        {/* ---------- Bed availability ---------- */}
        <section className="panel">
          <h2><i className="bi bi-hospital" /> Bed availability</h2>
          <p className="panel__hint">
            Keep these numbers up to date. Ambulances are sent to the nearest
            hospital that has a free bed for the emergency.
          </p>

          <div className="beds">
            {Object.keys(facilityLabels).map((key) => (
              <div className="beds__row" key={key}>
                <span className="beds__label">{facilityLabels[key]}</span>
                <div className="beds__controls">
                  <button onClick={() => changeBeds(key, -1)}>−</button>
                  <strong className={beds[key] === 0 ? 'beds__zero' : ''}>
                    {beds[key]}
                  </strong>
                  <button onClick={() => changeBeds(key, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
            <div className="portal__footer">
        <button className="portal__logout" onClick={() => logout('hospital')}>
          <i className="bi bi-box-arrow-right" /> Log out
        </button>
      </div>
    </div>
  );
}