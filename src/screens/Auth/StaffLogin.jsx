import { useState } from 'react';
import { useStaff } from '../../context/StaffAuthContext';
import { crewAccounts, hospitalAccounts } from '../../mock/staff';
import { ambulanceUnits } from '../../mock/ambulance';
import { hospitals } from '../../mock/hospitals';
import { APP_NAME } from '../../mock/app';
import './StaffLogin.scss';

const TEXT = {
  crew: { title: 'Crew sign-in', sub: 'Ambulance driver and crew', icon: 'bi-truck-front-fill' },
  hospital: { title: 'Hospital sign-in', sub: 'Emergency department portal', icon: 'bi-hospital-fill' },
};

export default function StaffLogin({ role }) {
  const { login } = useStaff();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
    <div className="staff">
      <div className="staff__card">
        <div className="staff__logo"><i className={`bi ${text.icon}`} /></div>
        <h1>{text.title}</h1>
        <p className="staff__sub">{APP_NAME} · {text.sub}</p>

        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={onKeyDown}
          autoCapitalize="none"
          autoComplete="username"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="current-password"
        />

        {error && <p className="staff__error">{error}</p>}

        <button className="staff__btn" onClick={submit}>Sign in</button>

        <div className="staff__demo">
          <strong>Demo logins</strong> (password for all: {demoPassword})
          <ul>
            {demoList.map((d) => (
              <li key={d.username}>
                <b>{d.username}</b> — {d.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}