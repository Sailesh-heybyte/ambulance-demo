import { useState } from 'react';
import Sheet from '../../components/Sheet';
import { emergencyTypes } from '../../mock/emergencies';
import './EmergencySheet.scss';

export default function EmergencySheet({ open, onClose, onConfirm }) {
  const [type, setType] = useState(null);
  const [forWhom, setForWhom] = useState('me');

  const handleConfirm = () => {
    onConfirm({ type, forWhom });
  };

  return (
    <Sheet open={open} onClose={onClose} title="What is the emergency?">
      <div className="types">
        {emergencyTypes.map((t) => (
          <button
            key={t.id}
            className={`types__item ${type === t.id ? 'types__item--active' : ''}`}
            onClick={() => setType(t.id)}
          >
            <i className={`bi ${t.icon}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="who">
        <button
          className={`who__btn ${forWhom === 'me' ? 'who__btn--active' : ''}`}
          onClick={() => setForWhom('me')}
        >
          For me
        </button>
        <button
          className={`who__btn ${forWhom === 'other' ? 'who__btn--active' : ''}`}
          onClick={() => setForWhom('other')}
        >
          For someone else
        </button>
      </div>

      <button className="confirm" disabled={!type} onClick={handleConfirm}>
        Request ambulance
      </button>
    </Sheet>
  );
}