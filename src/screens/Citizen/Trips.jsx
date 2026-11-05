import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TripForm from './TripForm';
import { tripKinds } from '../../mock/trips';
import { getTrips, cancelTrip } from '../../utils/trips';
import PageHeader from '../../components/PageHeader';
import './Trips.scss';
const STATUS_TEXT = {
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
export default function Trips() {
  const navigate = useNavigate();
  const [kind, setKind] = useState(null); // which form is open
  const [trips, setTrips] = useState(getTrips);
  const [banner, setBanner] = useState('');

  const handleSaved = () => {
    setTrips(getTrips());
    setKind(null);
    setBanner('Your trip has been booked.');
    setTimeout(() => setBanner(''), 4000);
  };

  const handleCancel = (id) => {
    if (window.confirm('Cancel this trip?')) setTrips(cancelTrip(id));
  };

  if (kind) {
    return <TripForm kind={kind} onBack={() => setKind(null)} onSaved={handleSaved} />;
  }

  return (
    <div className="trips">
      <PageHeader title="Trips" sub="Book a non-emergency or special ambulance trip" icon="bi-calendar2-week" />

      {banner && <div className="trips__banner"><i className="bi bi-check-circle-fill" /> {banner}</div>}

      <button className="trips__sos" onClick={() => navigate('/')}>
        <i className="bi bi-exclamation-triangle-fill" />
        <span>In an emergency? <b>Use the SOS button</b> instead.</span>
        <i className="bi bi-chevron-right" />
      </button>

      <h2 className="trips__heading">Book a trip</h2>
      <div className="kinds">
        {Object.entries(tripKinds).map(([key, k]) => (
          <button className="kinds__item" key={key} onClick={() => setKind(key)}>
            <span className="kinds__icon"><i className={`bi ${k.icon}`} /></span>
            <span className="kinds__text">
              <strong>{k.title}</strong>
              <small>{k.desc}</small>
            </span>
            <i className="bi bi-chevron-right" />
          </button>
        ))}
      </div>

      <h2 className="trips__heading">Your trips</h2>

      {trips.length === 0 && (
        <div className="trips__empty">
          <i className="bi bi-journal-medical" />
          <strong>No trips yet</strong>
          <span>Trips you book or finish will show here.</span>
        </div>
      )}

      {trips.map((t) => (
        <div className={`trip trip--${t.status}`} key={t.id}>
          <div className="trip__top">
            <div>
              <h4>{t.title}</h4>
              <small><i className="bi bi-clock" /> {t.whenText}</small>
            </div>
            <span className="trip__status">{STATUS_TEXT[t.status]}</span>
          </div>

          <div className="trip__route">
            <p><i className="trip__dot" /> {t.pickup}</p>
            <p><i className="trip__dot trip__dot--end" /> {t.destination}</p>
          </div>

          <div className="trip__meta">
            {t.tripId && <span><i className="bi bi-hash" />{t.tripId}</span>}
            {t.patient && <span><i className="bi bi-person" />{t.patient}</span>}
            {t.driver && <span><i className="bi bi-person-badge" />{t.driver}</span>}
            {t.need && <span><i className="bi bi-universal-access" />{t.need}</span>}
          </div>

          {t.status === 'booked' && (
            <button className="trip__cancel" onClick={() => handleCancel(t.id)}>
              Cancel trip
            </button>
          )}
        </div>
      ))}
    </div>
  );
}