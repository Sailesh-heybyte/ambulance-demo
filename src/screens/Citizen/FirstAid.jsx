import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { emergencyTypes } from '../../mock/emergencies';
import { firstAidGuides } from '../../mock/firstAid';
import PageHeader from '../../components/PageHeader';
import './FirstAid.scss';

export default function FirstAid() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(state?.id || null);

  const cameFromTracking = Boolean(state?.id);
  const type = emergencyTypes.find((t) => t.id === selected);
  const guide = firstAidGuides[selected];

  const handleBack = () => {
    if (cameFromTracking) navigate(-1);
    else setSelected(null);
  };

  // ---------- Detail: tips for one emergency ----------
  if (type && guide) {
    return (
      <div className="aid">
        <PageHeader title={type.label} sub="First aid guide" onBack={handleBack} />

        <div className="aid__hero">
          <div className="aid__icon"><i className={`bi ${type.icon}`} /></div>
          <p>{guide.summary}</p>
        </div>

        <a className="aid__call" href="tel:108">
          <i className="bi bi-telephone-fill" />
          <span><strong>Call 108</strong><small>Free emergency helpline, 24×7</small></span>
          <i className="bi bi-chevron-right" />
        </a>

        <section className="aid__block aid__block--do">
          <h3><i className="bi bi-check-circle-fill" /> Do</h3>
          <ol>
            {guide.dos.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </section>

        <section className="aid__block aid__block--dont">
          <h3><i className="bi bi-x-circle-fill" /> Don’t</h3>
          <ul>
            {guide.donts.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>

        <p className="aid__note">
          <i className="bi bi-info-circle" /> This is basic guidance only. Follow any instructions the ambulance
          crew or a doctor gives you.
        </p>
      </div>
    );
  }

  // ---------- List: choose an emergency ----------
  return (
    <div className="aid">
      <PageHeader
        title="First aid"
        sub="What to do while help is on the way"
        icon="bi-heart-pulse"
      />

      <a className="aid__call" href="tel:108">
        <i className="bi bi-telephone-fill" />
        <span><strong>Call 108</strong><small>Free emergency helpline, 24×7</small></span>
        <i className="bi bi-chevron-right" />
      </a>

      <h2 className="aid__heading">Choose the emergency</h2>

      <div className="aid__list">
        {emergencyTypes.map((t) => (
          <button key={t.id} className="aid__item" onClick={() => setSelected(t.id)}>
            <span className="aid__item-icon"><i className={`bi ${t.icon}`} /></span>
            <span className="aid__item-label">
              {t.label}
              {firstAidGuides[t.id] && <small>{firstAidGuides[t.id].dos.length} steps to follow</small>}
            </span>
            <i className="bi bi-chevron-right" />
          </button>
        ))}
      </div>
    </div>
  );
}