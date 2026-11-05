import { useState } from 'react';
import { useStaff } from '../../context/StaffAuthContext';
import { crewAccounts, hospitalAccounts } from '../../mock/staff';
import { ambulanceUnits } from '../../mock/ambulance';
import { hospitals } from '../../mock/hospitals';
import BrandLogo from '../../components/BrandLogo';
import ProtocolLeaders from '../../components/ProtocolLeaders';
import './StaffLogin.scss';

const TEXT = {
  crew: {
    title: 'Crew sign-in',
    portal: 'Ambulance Crew Portal',
    sub: 'For 108 drivers and EMTs on duty',
    icon: 'bi-truck-front-fill',
    user: 'Crew ID',
    points: ['Live emergency alerts', 'Turn-by-turn navigation', 'Works offline, syncs later'],
  },
  hospital: {
    title: 'Hospital sign-in',
    portal: 'Hospital Emergency Portal',
    sub: 'For emergency department staff',
    icon: 'bi-hospital-fill',
    user: 'Hospital ID',
    points: ['See incoming patients live', 'Prepare the ER team early', 'Update bed availability'],
  },
};

export default function StaffLogin({ role }) {
  const { login } = useStaff();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const text = TEXT[role];

  const submit = () => {
    const name = username.trim().toLowerCase();
    const accounts = role === 'crew' ? crewAccounts : hospitalAccounts;
    const account = accounts.find((a) => a.username === name && a.password === password);

    if (!account) {
      setError('Wrong username or password.');
      return;
    }

    if (role === 'crew') {
      const unit = ambulanceUnits.find((u) => u.id === account.unitId);
      login('crew', {
        username: account.username,
        unitId: unit.id,
        name: unit.driver,
        number: unit.number,
        station: unit.station,
      });
    } else {
      const hospital = hospitals.find((h) => h.id === account.hospitalId);
      login('hospital', {
        username: account.username,
        hospitalId: hospital.id,
        name: hospital.name,
      });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') submit();
  };

  // Demo helper: shows which logins exist
  const demoList =
    role === 'crew'
      ? crewAccounts.map((a) => ({
          username: a.username,
          label: ambulanceUnits.find((u) => u.id === a.unitId)?.station,
        }))
      : hospitalAccounts.map((a) => ({
          username: a.username,
          label: hospitals.find((h) => h.id === a.hospitalId)?.name,
        }));
  const demoPassword = role === 'crew' ? crewAccounts[0].password : hospitalAccounts[0].password;

  return (
    <div className={`staff staff--${role}`}>
      {/* Left: official panel (side by side on laptop, on top on phone) */}
      <aside className="staff__side">
        <ProtocolLeaders variant="ribbon" className="staff__ribbon" />
        <div className="staff__brand">
          <BrandLogo size={72} showText={false} />
          <div>
            <p className="staff__eyebrow">108 Ambulance · Govt. of A.P.</p>
            <h2>{text.portal}</h2>
            <p className="staff__tag">{text.sub}</p>
          </div>
        </div>
        <ul className="staff__points">
          {text.points.map((p) => (
            <li key={p}><i className="bi bi-check2-circle" /> {p}</li>
          ))}
        </ul>
      </aside>

      {/* Right: sign-in card */}
      <main className="staff__main">
        <div className="staff__card">
          <div className="staff__head">
            <div className="staff__logo"><i className={`bi ${text.icon}`} /></div>
            <div>
              <h1>{text.title}</h1>
              <p className="staff__sub">Use the ID given by your district office</p>
            </div>
          </div>

          <label htmlFor="staff-user">{text.user}</label>
          <div className="staff__field">
            <i className="bi bi-person" />
            <input
              id="staff-user"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              onKeyDown={onKeyDown}
              placeholder="Enter your username"
              autoCapitalize="none"
              autoComplete="username"
            />
          </div>

          <label htmlFor="staff-pass">Password</label>
          <div className="staff__field">
            <i className="bi bi-lock" />
            <input
              id="staff-pass"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={onKeyDown}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="staff__eye"
              onClick={() => setShow(!show)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              <i className={`bi ${show ? 'bi-eye-slash' : 'bi-eye'}`} />
            </button>
          </div>

          {error && (
            <p className="staff__error"><i className="bi bi-exclamation-circle-fill" /> {error}</p>
          )}

          <button className="staff__btn" onClick={submit}>
            Sign in <i className="bi bi-arrow-right" />
          </button>

          <div className="staff__demo">
            <div className="staff__demo-head">
              <span><i className="bi bi-info-circle" /> Demo logins</span>
              <span>Password: <b>{demoPassword}</b></span>
            </div>
            <div className="staff__demo-list">
              {demoList.map((d) => (
                <button
                  key={d.username}
                  type="button"
                  onClick={() => { setUsername(d.username); setPassword(demoPassword); setError(''); }}
                >
                  <b>{d.username}</b>
                  <small>{d.label}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="staff__foot">
          <i className="bi bi-shield-lock" /> Authorised staff only · Govt. of Andhra Pradesh
        </p>
      </main>
    </div>
  );
}
