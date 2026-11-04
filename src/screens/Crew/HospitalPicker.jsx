import { useEffect, useMemo, useState } from 'react';
import { hospitals, facilityLabels, neededFacility } from '../../mock/hospitals';
import { conditions } from '../../mock/conditions';
import { getBeds } from '../../utils/beds';
import { distanceKm } from '../../utils/geo';

const AVG_KMPH = 30; // rough city speed for the minutes estimate

export default function HospitalPicker({ booking, disabled, onConfirm }) {
  const [beds, setBeds] = useState(getBeds);
  const [condition, setCondition] = useState(null);
  const [need, setNeed] = useState(neededFacility[booking.type] || 'icu');
  const [picked, setPicked] = useState(null);

  // Hospitals change their beds in their portal; refresh when that happens
  useEffect(() => {
    const refresh = () => setBeds(getBeds());
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const { lat, lng } = booking.pickup;

  // Nearest first. Hospitals with a free bed come before those without.
  const list = useMemo(() => {
    const all = hospitals
      .map((h) => {
        const km = distanceKm([lat, lng], [h.lat, h.lng]);
        return {
          ...h,
          km,
          mins: Math.max(1, Math.round((km / AVG_KMPH) * 60)),
          free: beds[h.id]?.[need] ?? 0,
        };
      })
      .sort((a, b) => a.km - b.km);
    return [...all.filter((h) => h.free > 0), ...all.filter((h) => h.free === 0)];
  }, [beds, need, lat, lng]);

  const anyFree = list.some((h) => h.free > 0);
  const recommended = list[0];
  const selected =
    list.find((h) => h.id === picked && (h.free > 0 || !anyFree)) || recommended;

  const confirm = () =>
    onConfirm({
      condition,
      bedNeeded: need,
      hospitalId: selected.id,
      hospital: selected.name,
    });

  return (
    <div className="pick">
      <h3 className="pick__title">Patient condition</h3>
      <div className="pick__conditions">
        {conditions.map((c) => (
          <button
            key={c.id}
            className={`pick__cond pick__cond--${c.tone} ${condition === c.id ? 'is-on' : ''}`}
            onClick={() => setCondition(c.id)}
          >
            <i className={`bi ${c.icon}`} />
            <span>
              <strong>{c.label}</strong>
              <small>{c.desc}</small>
            </span>
          </button>
        ))}
      </div>

      <h3 className="pick__title">Bed needed</h3>
      <div className="pick__chips">
        {Object.keys(facilityLabels).map((key) => (
          <button
            key={key}
            className={`pick__chip ${need === key ? 'is-on' : ''}`}
            onClick={() => setNeed(key)}
          >
            {facilityLabels[key]}
          </button>
        ))}
      </div>

      <h3 className="pick__title">Choose hospital</h3>
      {!anyFree && (
        <p className="pick__warn">
          <i className="bi bi-exclamation-triangle-fill" /> No hospital has a free{' '}
          {facilityLabels[need]} bed. Nearest is selected. Call ahead.
        </p>
      )}

      <div className="pick__list">
        {list.map((h, i) => {
          const off = anyFree && h.free === 0;
          const on = selected?.id === h.id;
          return (
            <button
              key={h.id}
              disabled={off}
              className={`pick__hosp ${on ? 'is-on' : ''}`}
              onClick={() => setPicked(h.id)}
            >
              <div className="pick__hosp-top">
                <strong>{h.name}</strong>
                {i === 0 && h.free > 0 && <span className="pick__badge">Nearest with beds</span>}
              </div>
              <div className="pick__hosp-meta">
                <span><i className="bi bi-signpost-fill" /> {h.km.toFixed(1)} km · ~{h.mins} min</span>
                <span className={h.free > 0 ? 'pick__free' : 'pick__none'}>
                  {h.free > 0 ? `${h.free} ${facilityLabels[need]} free` : 'No beds'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        className="crew__big crew__big--green"
        disabled={disabled || !condition || !selected}
        onClick={confirm}
      >
        {condition ? 'Confirm & patient picked up' : 'Select patient condition'}
      </button>
    </div>
  );
}