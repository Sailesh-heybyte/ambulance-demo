import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DEMO_OTP } from '../../mock/app';
import GovtEmblem from '../../components/GovtEmblem';
import ProtocolLeaders from '../../components/ProtocolLeaders';
import './SignIn.scss';

const SLIDES = [
  { icon: 'bi-lightning-charge-fill', title: 'One tap SOS', desc: 'Book the nearest ambulance in seconds – no forms, no waiting.' },
  { icon: 'bi-geo-alt-fill', title: 'Live GPS tracking', desc: 'Watch the ambulance come to you on the map, minute by minute.' },
  { icon: 'bi-hospital-fill', title: 'Hospital ready on arrival', desc: 'The emergency team is alerted before the patient reaches.' },
];

const RESEND_SECONDS = 30;

export default function SignIn() {
  const { login } = useAuth();
  const [step, setStep] = useState('welcome'); // 'welcome' | 'phone' | 'otp'
  const [slide, setSlide] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const otpRef = useRef(null);

  // Feature slides change on their own on the welcome step
  useEffect(() => {
    if (step !== 'welcome') return;
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 3500);
    return () => clearInterval(t);
  }, [step]);

  // "Resend code" countdown on the OTP step
  useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const go = (next) => {
    setError('');
    setStep(next);
  };

  const sendCode = (e) => {
    e?.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (!name.trim()) return setError('Please enter your full name.');
    if (digits.length !== 10) return setError('Enter a valid 10-digit mobile number.');
    setOtp('');
    setResendIn(RESEND_SECONDS);
    go('otp');
  };

  const verify = (e) => {
    e?.preventDefault();
    if (otp.length !== 6) return setError('Enter the 6-digit code.');
    if (otp !== DEMO_OTP) return setError(`Invalid code. Try demo code ${DEMO_OTP}.`);
    navigator.vibrate?.(20);
    login(name.trim(), phone.replace(/\D/g, ''));
  };

  return (
    <div className="signin">
      {/* Official header */}
      <div className="signin__protocol">
        <ProtocolLeaders variant="ribbon" size="lg" />
      </div>

      {/* Brand */}
      <div className={`signin__brand ${step !== 'welcome' ? 'signin__brand--compact' : ''}`}>
        <div className="signin__emblem">
          <span className="signin__halo" />
          <GovtEmblem size={step === 'welcome' ? 92 : 64} />
        </div>
        <div className="signin__brand-text">
          <h1>
            <span className="signin__cross">
              <i className="bi bi-plus-lg" />
            </span>
            108 Ambulance
          </h1>
          <p>Emergency Response Service</p>
        </div>
      </div>

      {/* Bottom card */}
      <section className="signin__card" key={step}>
        {step === 'welcome' && (
          <div className="signin__content">
            <div className="signin__slides" aria-live="polite">
              <div className="signin__slide" key={slide}>
                <span className="signin__slide-icon">
                  <i className={`bi ${SLIDES[slide].icon}`} />
                </span>
                <div>
                  <h2>{SLIDES[slide].title}</h2>
                  <p>{SLIDES[slide].desc}</p>
                </div>
              </div>
              <div className="signin__dots" role="tablist" aria-label="Features">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    role="tab"
                    aria-selected={i === slide}
                    aria-label={s.title}
                    className={`signin__dot ${i === slide ? 'is-active' : ''}`}
                    onClick={() => setSlide(i)}
                  />
                ))}
              </div>
            </div>

            <button type="button" className="signin__primary" onClick={() => go('phone')}>
              Continue with mobile number <i className="bi bi-arrow-right" />
            </button>

            <ul className="signin__trust">
              <li><i className="bi bi-shield-check" /> Official</li>
              <li><i className="bi bi-currency-rupee" /> Free service</li>
              <li><i className="bi bi-clock-history" /> 24 × 7</li>
            </ul>
          </div>
        )}

        {step === 'phone' && (
          <form className="signin__content" onSubmit={sendCode} noValidate>
            <div className="signin__title-row">
              <button type="button" className="signin__back" onClick={() => go('welcome')} aria-label="Back">
                <i className="bi bi-arrow-left" />
              </button>
              <div>
                <h2>Sign in</h2>
                <p>Your name and mobile number help the crew reach you.</p>
              </div>
            </div>

            <label className="signin__field">
              <span>Full name</span>
              <span className="signin__input">
                <i className="bi bi-person" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  autoComplete="name"
                  autoFocus
                />
              </span>
            </label>

            <label className="signin__field">
              <span>Mobile number</span>
              <span className="signin__input">
                <span className="signin__prefix">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </span>
            </label>

            {error && (
              <div className="signin__error" role="alert">
                <i className="bi bi-exclamation-circle-fill" /> {error}
              </div>
            )}

            <button type="submit" className="signin__primary">
              Send OTP
            </button>
            <p className="signin__fine">We'll send a 6-digit code by SMS to verify your number.</p>
          </form>
        )}

        {step === 'otp' && (
          <form className="signin__content" onSubmit={verify} noValidate>
            <div className="signin__title-row">
              <button type="button" className="signin__back" onClick={() => go('phone')} aria-label="Change phone number">
                <i className="bi bi-arrow-left" />
              </button>
              <div>
                <h2>Verify your number</h2>
                <p>
                  Code sent to <b>+91 {phone.slice(0, 5)} {phone.slice(5)}</b>
                </p>
              </div>
            </div>

            {/* 6 boxes drawn over one real input (works with SMS auto-fill) */}
            <div className="signin__otp" onClick={() => otpRef.current?.focus()}>
              <input
                ref={otpRef}
                className="signin__otp-input"
                type="text"
                value={otp}
                onChange={(e) => {
                  setError('');
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="6-digit code"
                autoFocus
              />
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className={`signin__otp-box ${i === otp.length ? 'is-current' : ''} ${otp[i] ? 'is-filled' : ''}`}>
                  {otp[i] || ''}
                </span>
              ))}
            </div>

            <div className="signin__otp-meta">
              <span className="signin__demo">
                <i className="bi bi-key-fill" /> Demo code <b>{DEMO_OTP}</b>
              </span>
              {resendIn > 0 ? (
                <span className="signin__resend">Resend in 0:{String(resendIn).padStart(2, '0')}</span>
              ) : (
                <button type="button" className="signin__resend signin__resend--btn" onClick={() => setResendIn(RESEND_SECONDS)}>
                  Resend code
                </button>
              )}
            </div>

            {error && (
              <div className="signin__error" role="alert">
                <i className="bi bi-exclamation-circle-fill" /> {error}
              </div>
            )}

            <button type="submit" className="signin__primary" disabled={otp.length !== 6}>
              Verify &amp; continue
            </button>
          </form>
        )}

        <p className="signin__footer">Department of Health, Medical &amp; Family Welfare · Govt. of Andhra Pradesh</p>
      </section>
    </div>
  );
}
