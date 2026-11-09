import { useEffect, useRef, useState } from 'react';
import './SwipeButton.scss';

// Drag the knob to the end to confirm. Enter / Space also confirms (keyboard users).
export default function SwipeButton({ label, onConfirm, disabled = false }) {
  const trackRef = useRef(null);
  const startX = useRef(0);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);

  const [width, setWidth] = useState(0);

  // Track width decides how far the knob can travel
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxX = () => Math.max(0, width - 64 - 12);

  const finish = () => {
    setDone(true);
    setX(maxX());
    navigator.vibrate?.([40, 40, 80]);
    setTimeout(() => onConfirm?.(), 180);
  };

  const onDown = (e) => {
    if (disabled || done) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX - x;
    setDragging(true);
  };
  const onMove = (e) => {
    if (!dragging) return;
    setX(Math.max(0, Math.min(maxX(), e.clientX - startX.current)));
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (x >= maxX() * 0.85) finish();
    else setX(0);
  };

  const progress = maxX() ? x / maxX() : 0;

  return (
    <div
      ref={trackRef}
      className={`swipe ${disabled ? 'swipe--disabled' : ''} ${done ? 'swipe--done' : ''}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={label}
      onKeyDown={(e) => {
        if (!disabled && !done && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          finish();
        }
      }}
    >
      <span className="swipe__fill" style={{ width: x + 64 }} />
      <span className="swipe__label" style={{ opacity: 1 - progress * 1.2 }}>{label}</span>
      <span
        className={`swipe__knob ${dragging ? 'swipe__knob--drag' : ''}`}
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <i className={`bi ${done ? 'bi-check-lg' : 'bi-chevron-double-right'}`} />
      </span>
    </div>
  );
}
