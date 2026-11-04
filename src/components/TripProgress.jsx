import './TripProgress.scss';

const STAGES = [
  { id: 'accepted', label: 'Accepted' },
  { id: 'reached', label: 'Reached patient' },
  { id: 'picked', label: 'Picked up' },
  { id: 'hospital', label: 'At hospital' },
];

// 4-step progress bar. status comes from the booking.
export default function TripProgress({ status }) {
  const now = STAGES.findIndex((s) => s.id === status); // -1 while still searching
  const finished = status === 'hospital';

  return (
    <div className="trip-progress">
      {STAGES.map((s, i) => (
        <div
          key={s.id}
          className={`trip-progress__step ${finished || i < now ? 'is-done' : i === now ? 'is-now' : ''}`}
        >
          <span className="trip-progress__bar" />
          <small>{s.label}</small>
        </div>
      ))}
    </div>
  );
}