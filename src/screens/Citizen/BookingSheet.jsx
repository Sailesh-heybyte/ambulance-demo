import { useEffect, useRef, useState } from 'react';
import { createMap, whenReady, htmlMarker, reverseGeocode, searchPlaces, hasMapbox, toLngLat } from '../../utils/mapbox';
import { ambulanceHtml, pinHtml } from '../../utils/markers';
import { distanceKm } from '../../utils/geo';
import { pickupSpots } from '../../mock/ambulance';
import { hospitals } from '../../mock/hospitals';
import useNearestAmbulances from '../../hooks/useNearestAmbulances';
import SwipeButton from '../../components/SwipeButton';
import './BookingSheet.scss';

const todayStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const tomorrowStr = () => new Date(Date.now() + 864e5).toLocaleDateString('en-CA');

// A name for a dropped pin when there is no Mapbox token (or the lookup fails)
function fallbackPlace([lat, lng]) {
  const near = pickupSpots
    .map((s) => ({ ...s, km: distanceKm([lat, lng], [s.lat, s.lng]) }))
    .sort((a, b) => a.km - b.km)[0];
  if (near && near.km < 0.4) return { name: near.name, address: near.address };
  return { name: 'Pinned location', address: `Pinned location (${lat.toFixed(4)}, ${lng.toFixed(4)})` };
}

// Full-screen booking: move the pin, pick Emergency or Planned, swipe to confirm.
// Mounted only while open, so every visit starts fresh.
export default function BookingSheet({ initialPickup, booking, onClose, onEmergency, onPlanned }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const ambMarkers = useRef([]);
  const dropMarker = useRef(null);
  const geoSeq = useRef(0);

  const [pickup, setPickup] = useState(initialPickup);
  const [moving, setMoving] = useState(false);
  const [caseType, setCaseType] = useState('emergency'); // 'emergency' | 'planned'
  const [drop, setDrop] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  const { nearest, all } = useNearestAmbulances(pickup, booking);

  // Map is created when the sheet opens and removed when it closes
  useEffect(() => {
    if (!mapEl.current) return;
    const map = createMap(mapEl.current, { center: [initialPickup.lat, initialPickup.lng], zoom: 16 });
    mapRef.current = map;

    map.on('movestart', () => setMoving(true));
    map.on('moveend', async () => {
      setMoving(false);
      const c = map.getCenter();
      const at = [c.lat, c.lng];
      const seq = ++geoSeq.current;
      setPickup((p) => ({ ...p, lat: at[0], lng: at[1], address: 'Locating…' }));
      const place = (await reverseGeocode(at)) || fallbackPlace(at);
      if (seq === geoSeq.current) setPickup({ id: 'pin', lat: at[0], lng: at[1], ...place });
    });

    whenReady(map, () => map.resize());
    return () => {
      map.remove();
      mapRef.current = null;
      ambMarkers.current = [];
      dropMarker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Available ambulances around the pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    ambMarkers.current.forEach((m) => m.remove());
    ambMarkers.current = all.map((u, i) =>
      htmlMarker(ambulanceHtml(i === 0 ? '' : 'amb-top--idle'), { className: 'bk__amb' })
        .setLngLat([u.lng, u.lat])
        .setRotation((i * 67) % 360)
        .addTo(map)
    );
  }, [all]);

  // Drop pin for planned trips
  useEffect(() => {
    const map = mapRef.current;
    dropMarker.current?.remove();
    dropMarker.current = null;
    if (!map || !drop || caseType !== 'planned') return;
    dropMarker.current = htmlMarker(pinHtml('map-pin--drop', 'bi-flag-fill')).setLngLat(toLngLat([drop.lat, drop.lng])).addTo(map);
  }, [drop, caseType]);

  const locateMe = () => {
    if (!navigator.geolocation) return setError('Location is not available on this device.');
    navigator.geolocation.getCurrentPosition(
      (pos) => mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 }),
      () => setError('Could not get your location. Move the pin instead.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const isPlanned = caseType === 'planned';
  const whenValid = (() => {
    if (!date || !time) return false;
    return new Date(`${date}T${time}`) > new Date();
  })();
  const plannedReady = Boolean(drop) && whenValid;
  const pickupReady = !moving && pickup.address !== 'Locating…';
  const canConfirm = pickupReady && (!isPlanned || plannedReady) && (isPlanned || Boolean(nearest));

  const confirm = () => {
    const spot = { name: pickup.name, address: pickup.address, lat: pickup.lat, lng: pickup.lng };
    if (isPlanned) {
      const when = new Date(`${date}T${time}`);
      onPlanned({ pickup: spot, drop, when });
    } else {
      onEmergency({ pickup: spot });
    }
  };

  const hint = (() => {
    if (!pickupReady) return 'Finding the address…';
    if (!isPlanned) return nearest ? '' : 'All ambulances are busy right now. Please call 108.';
    if (!drop) return 'Add a drop location to continue';
    if (!time) return 'Choose a pick-up time to continue';
    if (!whenValid) return 'Pick-up time must be in the future';
    return '';
  })();

  return (
    <div className="bk" role="dialog" aria-modal="true" aria-label="Request an ambulance">
      <div className="bk__top">
        <button type="button" className="bk__back" onClick={onClose} aria-label="Back">
          <i className="bi bi-arrow-left" />
        </button>
        <span>Move pin to pickup location</span>
      </div>

      <div className="bk__map">
        <div ref={mapEl} className="bk__canvas" />
        {!hasMapbox && <span className="bk__notice">Map preview · add VITE_MAPBOX_TOKEN to .env</span>}
        <div className={`bk__pin ${moving ? 'bk__pin--lift' : ''}`} aria-hidden="true">
          <span className="bk__pin-head"><i className="bi bi-geo-alt-fill" /></span>
          <span className="bk__pin-dot" />
        </div>
        <button type="button" className="bk__locate" onClick={locateMe} aria-label="Use my current location">
          <i className="bi bi-crosshair" />
        </button>
      </div>

      <div className="bk__card">
        <h3>Select your case</h3>

        <div className="bk__cases" role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={!isPlanned}
            className={`bk__case ${!isPlanned ? 'bk__case--on' : ''}`}
            onClick={() => setCaseType('emergency')}
          >
            <span className="bk__radio" />
            <span className="bk__case-text">
              <strong>Emergency</strong>
              <small>For accidents, difficulty breathing, severe bleeding, and other emergencies</small>
            </span>
            <span className="bk__free">FREE</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isPlanned}
            className={`bk__case ${isPlanned ? 'bk__case--on' : ''}`}
            onClick={() => setCaseType('planned')}
          >
            <span className="bk__radio" />
            <span className="bk__case-text">
              <strong>Planned transfer</strong>
              <small>For OPD visits, discharge to home, or scheduled admissions</small>
            </span>
            <span className="bk__free">FREE</span>
          </button>
        </div>

        <div className={`bk__route ${isPlanned ? 'bk__route--two' : ''}`}>
          <div className="bk__stop">
            <span className="bk__stop-icon"><i className="bi bi-circle-fill" /></span>
            <div className="bk__stop-text">
              <small>Pickup</small>
              <p>{moving ? 'Release to set pickup…' : pickup.address}</p>
              {nearest && !isPlanned && (
                <span className="bk__eta"><i className="bi bi-truck-front-fill" /> {nearest.minutes} mins away</span>
              )}
            </div>
          </div>

          {isPlanned && (
            <div className={`bk__stop bk__stop--drop ${drop ? '' : 'bk__stop--need'}`}>
              <span className="bk__stop-icon bk__stop-icon--drop"><i className="bi bi-square-fill" /></span>
              <div className="bk__stop-text">
                <small>Drop</small>
                <p>{drop ? drop.name : 'Location required'}</p>
              </div>
              <button type="button" className="bk__add" onClick={() => setDropOpen(true)}>
                {drop ? 'Change' : 'Add location'}
              </button>
            </div>
          )}
        </div>

        {isPlanned && (
          <div className="bk__when">
            <small>Pick-up time</small>
            <div className="bk__days">
              <button type="button" className={date === todayStr() ? 'on' : ''} onClick={() => setDate(todayStr())}>Today</button>
              <button type="button" className={date === tomorrowStr() ? 'on' : ''} onClick={() => setDate(tomorrowStr())}>Tomorrow</button>
              <input type="date" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Pick-up date" />
            </div>
            <input className="bk__time" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Pick-up time" />
          </div>
        )}

        {error && <p className="bk__error"><i className="bi bi-exclamation-circle-fill" /> {error}</p>}
        {hint && <p className="bk__hint">{hint}</p>}

        <SwipeButton
          key={caseType}
          label={isPlanned ? 'Swipe to schedule' : 'Swipe to confirm'}
          disabled={!canConfirm}
          onConfirm={confirm}
        />
        <p className="bk__foot">
          {isPlanned ? 'Free of cost · it will show under Trips' : 'Ambulance leaves as soon as you confirm'}
        </p>
      </div>

      {dropOpen && (
        <DropPicker
          near={[pickup.lat, pickup.lng]}
          onClose={() => setDropOpen(false)}
          onPick={(p) => {
            setDrop(p);
            setDropOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Search for the drop location. Hospitals are listed first as quick picks.
function DropPicker({ near, onClose, onPick }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!hasMapbox || q.trim().length < 3) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const found = await searchPlaces(q, near);
      if (cancelled) return;
      setResults(found);
      setSearching(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onType = (e) => {
    setQ(e.target.value);
    if (hasMapbox && e.target.value.trim().length >= 3) setSearching(true);
    else setResults([]);
  };

  const term = q.trim().toLowerCase();
  const hospitalList = hospitals
    .filter((h) => !term || h.name.toLowerCase().includes(term))
    .map((h) => ({ ...h, address: 'Hospital', km: distanceKm(near, [h.lat, h.lng]) }))
    .sort((a, b) => a.km - b.km);

  return (
    <div className="drop">
      <div className="drop__head">
        <button type="button" className="bk__back" onClick={onClose} aria-label="Back">
          <i className="bi bi-arrow-left" />
        </button>
        <div className="drop__input">
          <i className="bi bi-search" />
          <input autoFocus value={q} onChange={onType} placeholder="Search hospital or address" />
        </div>
      </div>

      <div className="drop__list">
        {hospitalList.length > 0 && <h4>Hospitals nearby</h4>}
        {hospitalList.map((h) => (
          <button type="button" key={h.id} className="drop__item" onClick={() => onPick(h)}>
            <span className="drop__icon drop__icon--hosp"><i className="bi bi-hospital-fill" /></span>
            <span>
              <strong>{h.name}</strong>
              <small>{h.km.toFixed(1)} km away</small>
            </span>
          </button>
        ))}

        {hasMapbox && term.length >= 3 && (
          <>
            <h4>{searching ? 'Searching…' : 'Places'}</h4>
            {results.map((p) => (
              <button type="button" key={p.id} className="drop__item" onClick={() => onPick(p)}>
                <span className="drop__icon"><i className="bi bi-geo-alt-fill" /></span>
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.address}</small>
                </span>
              </button>
            ))}
            {!searching && results.length === 0 && <p className="drop__empty">No places found.</p>}
          </>
        )}
        {!hasMapbox && <p className="drop__empty">Address search turns on once the Mapbox token is added.</p>}
      </div>
    </div>
  );
}
