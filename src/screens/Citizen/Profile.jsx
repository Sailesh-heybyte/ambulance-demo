import { useState } from 'react';
import { user as mockUser } from '../../mock/user';
import { useAuth } from '../../context/AuthContext';
import { getProfile, saveProfile, formatAbha } from '../../utils/profile';
import './Profile.scss';

export default function Profile() {
    const { user: account, logout } = useAuth();
  const user = { ...mockUser, name: account?.name || mockUser.name };
  const [profile, setProfile] = useState(getProfile);
  const [abha, setAbha] = useState(formatAbha(profile.abha));
  const [aarogyasri, setAarogyasri] = useState(profile.aarogyasri);
  const [idMessage, setIdMessage] = useState('');
  const [idError, setIdError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [contactError, setContactError] = useState('');

  const update = (next) => {
    setProfile(next);
    saveProfile(next);
  };

  // ---------- Health IDs ----------
  const saveIds = () => {
    const digits = abha.replace(/\D/g, '');
    if (digits && digits.length !== 14) {
      setIdError('ABHA number must have 14 digits.');
      setIdMessage('');
      return;
    }
    setIdError('');
    update({ ...profile, abha: digits, aarogyasri: aarogyasri.trim() });
    setIdMessage('Saved');
    setTimeout(() => setIdMessage(''), 2000);
  };

  // ---------- Emergency contacts ----------
  const addContact = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!name.trim()) return setContactError('Enter a name.');
    if (cleanPhone.length !== 10) return setContactError('Enter a 10-digit phone number.');
    if (profile.contacts.length >= 5) return setContactError('You can add up to 5 contacts.');

    update({
      ...profile,
      contacts: [
        ...profile.contacts,
        { id: Date.now(), name: name.trim(), phone: cleanPhone, relation: relation.trim() },
      ],
    });
    setName('');
    setPhone('');
    setRelation('');
    setContactError('');
  };

  const removeContact = (id) => {
    update({ ...profile, contacts: profile.contacts.filter((c) => c.id !== id) });
  };

  return (
    <div className="profile">
      <div className="profile__head">
        <div className="profile__avatar">{user.name.charAt(0)}</div>
        <div>
          <h1>{user.name}</h1>
          <p>Your health and emergency details</p>
        </div>
      </div>

      {/* ---------- Health IDs ---------- */}
      <section className="card">
        <h2><i className="bi bi-card-heading" /> Health IDs</h2>

        <label>ABHA number (Ayushman Bharat Health ID)</label>
        <input
          value={abha}
          onChange={(e) => setAbha(formatAbha(e.target.value))}
          placeholder="14-digit ABHA number"
          inputMode="numeric"
        />

        <label>Aarogyasri card number</label>
        <input
          value={aarogyasri}
          onChange={(e) => setAarogyasri(e.target.value)}
          placeholder="Card number"
        />

        {idError && <p className="form-error">{idError}</p>}

        <button className="btn" onClick={saveIds}>
          {idMessage || 'Save IDs'}
        </button>
        <p className="card__note">
          Your ABHA number is shown to the hospital when you book, so the ER
          team can find your records.
        </p>
      </section>

      {/* ---------- Emergency contacts ---------- */}
      <section className="card">
        <h2><i className="bi bi-people-fill" /> Emergency contacts</h2>
        <p className="card__note card__note--top">
          These people are notified automatically when you press SOS.
        </p>

        {profile.contacts.length === 0 && (
          <p className="card__empty">No contacts added yet.</p>
        )}

        {profile.contacts.map((c) => (
          <div className="contact" key={c.id}>
            <div className="contact__avatar">{c.name.charAt(0)}</div>
            <div className="contact__info">
              <h4>{c.name}</h4>
              <p>{c.relation ? `${c.relation} · ` : ''}{c.phone}</p>
            </div>
            <button className="contact__remove" onClick={() => removeContact(c.id)}>
              <i className="bi bi-trash3-fill" />
            </button>
          </div>
        ))}

        <div className="add">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (10 digits)"
            inputMode="numeric"
          />
          <input
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="Relation (e.g. Mother)"
          />
          {contactError && <p className="form-error">{contactError}</p>}
          <button className="btn btn--light" onClick={addContact}>
            <i className="bi bi-plus-lg" /> Add contact
          </button>
        </div>
      </section>
            <button className="btn btn--light" onClick={logout}>
        <i className="bi bi-box-arrow-right" /> Log out
      </button>
    </div>
  );
}