import { useEffect, useRef, useState } from 'react';
import './SosButton.scss';

const HOLD_MS = 2000; // how long the button must be held (2 seconds)

export default function SosButton({ onComplete }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef(null);

  const cancel = () => {
    clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  const start = () => {
    if (timer.current) return; // already holding
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      if (navigator.vibrate) navigator.vibrate(200);
      onComplete();
    }, HOLD_MS);
  };

  // Stop the timer if the screen closes while the button is held
  useEffect(() => () => clearTimeout(timer.current), []);

  // Keyboard users can hold Enter or Space
  const onKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      start();
    }
  };
  const onKeyUp = (e) => {
    if (e.key === 'Enter' || e.key === ' ') cancel();
  };

  return (
    <div className={`sos-btn ${holding ? 'sos-btn--holding' : ''}`}>
      <svg className="sos-btn__ring" viewBox="0 0 180 180">
        <circle className="sos-btn__track" cx="90" cy="90" r="86" />
        <circle
          className="sos-btn__bar"
          cx="90"
          cy="90"
          r="86"
          style={{ transitionDuration: holding ? `${HOLD_MS}ms` : '200ms' }}
        />
      </svg>

      <button
        type="button"
        className="sos-btn__button"
        aria-label="Emergency SOS. Press and hold for 2 seconds."
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={cancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span>SOS</span>
        <small>{holding ? 'Keep holding…' : 'Hold for 2 sec'}</small>
      </button>
    </div>
  );
}