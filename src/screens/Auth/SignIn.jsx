import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, DEMO_OTP } from '../../mock/app';
import AmbulanceHero from '../../components/AmbulanceHero';
import './SignIn.scss';

const SLIDES = [
  {
    title: 'Rapid emergency response',
    desc: 'Book verified ambulances in seconds with real-time GPS tracking and 24/7 care.',
  },
  {
    title: 'Real-time GPS live tracking',
    desc: 'Watch your emergency responder navigate traffic with accurate real-time arrival estimates.',
  },
  {
    title: 'Pre-arrival hospital sync',
    desc: 'Vital patient status and emergency trauma bed availability prepared before arrival.',
  },
];

export default function SignIn() {
  const { login } = useAuth();
  const [step, setStep] = useState('welcome'); // 'welcome' | 'phone' | 'otp'
  const [activeSlide, setActiveSlide] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleNextSlide = () => {
    if (activeSlide < SLIDES.length - 1) {
      setActiveSlide((prev) => prev + 1);
    } else {
      setStep('phone');
    }
  };

  const sendCode = (e) => {
    e?.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (!name.trim()) return setError('Please enter your full name.');
    if (digits.length !== 10) return setError('Enter a valid 10-digit mobile number.');
    setError('');
    setStep('otp');
  };

  const verify = (e) => {
    e?.preventDefault();
    if (otp !== DEMO_OTP) return setError(`Invalid code. Try demo code ${DEMO_OTP}.`);
    login(name.trim(), phone.replace(/\D/g, ''));
  };

  return (
    <div className="auth-screen">
      {/* --- Top Area (Off-white / Warm canvas) --- */}
      <div className="auth-screen__canvas">
        {/* Mobile Status Bar Simulation / Spacing */}
        <div className="auth-screen__status-bar">
          <span className="auth-screen__time">9:41</span>
          <div className="auth-screen__status-icons">
            <i className="bi bi-reception-4" />
            <i className="bi bi-wifi" />
            <i className="bi bi-battery-full" />
          </div>
        </div>

        {/* Brand Header (Editorial Serif) */}
        <header className="auth-screen__header">
          <h1 className="auth-screen__brand">{APP_NAME}.</h1>
        </header>

        {/* Hero Illustration: Ambulance on Ground Baseline */}
        <div className="auth-screen__hero">
          <AmbulanceHero />
        </div>

        {/* Pagination Dots (3-indicator with active red pill) */}
        <div className="auth-screen__pagination" role="tablist" aria-label="Slide indicators">
          {SLIDES.map((_, index) => {
            const isActive = step === 'welcome' ? activeSlide === index : false;
            return (
              <button
                key={index}
                type="button"
                className={`auth-screen__dot ${isActive ? 'auth-screen__dot--active' : ''}`}
                onClick={() => {
                  setStep('welcome');
                  setActiveSlide(index);
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      </div>

      {/* --- Bottom Rounded Red Card --- */}
      <section className="auth-screen__card">
        {step === 'welcome' && (
          <div className="auth-screen__card-content auth-screen__card-content--welcome">
            <h2 className="auth-screen__card-title">{SLIDES[activeSlide].title}</h2>
            <p className="auth-screen__card-desc">{SLIDES[activeSlide].desc}</p>

            <button
              type="button"
              className="auth-screen__pill-btn"
              onClick={() => setStep('phone')}
            >
              Continue Now
            </button>
          </div>
        )}

        {step === 'phone' && (
          <form className="auth-screen__card-content auth-screen__card-content--form" onSubmit={sendCode}>
            <div className="auth-screen__card-top-row">
              <button
                type="button"
                className="auth-screen__back-btn"
                onClick={() => {
                  setError('');
                  setStep('welcome');
                }}
                aria-label="Back to welcome"
              >
                <i className="bi bi-arrow-left" />
              </button>
              <h2 className="auth-screen__card-title auth-screen__card-title--compact">
                Sign In
              </h2>
            </div>

            <p className="auth-screen__card-desc auth-screen__card-desc--compact">
              Enter your name and mobile to request emergency medical dispatch.
            </p>

            <div className="auth-screen__field">
              <label htmlFor="auth-name">Your Full Name</label>
              <div className="auth-screen__input-wrapper">
                <i className="bi bi-person-fill" />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-screen__field">
              <label htmlFor="auth-phone">Mobile Number</label>
              <div className="auth-screen__input-wrapper">
                <span className="auth-screen__country-prefix">+91</span>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
            </div>

            {error && <div className="auth-screen__error-pill"><i className="bi bi-exclamation-circle-fill" /> {error}</div>}

            <button type="submit" className="auth-screen__pill-btn">
              Send Verification Code
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="auth-screen__card-content auth-screen__card-content--form" onSubmit={verify}>
            <div className="auth-screen__card-top-row">
              <button
                type="button"
                className="auth-screen__back-btn"
                onClick={() => {
                  setError('');
                  setStep('phone');
                }}
                aria-label="Change phone number"
              >
                <i className="bi bi-arrow-left" />
              </button>
              <h2 className="auth-screen__card-title auth-screen__card-title--compact">
                Verification
              </h2>
            </div>

            <p className="auth-screen__card-desc auth-screen__card-desc--compact">
              We sent a 6-digit code to <strong>+91 {phone}</strong>
            </p>

            <div className="auth-screen__field">
              <label htmlFor="auth-otp">Enter 6-Digit Code</label>
              <input
                id="auth-otp"
                className="auth-screen__otp-input"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="······"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="auth-screen__demo-badge">
              <i className="bi bi-key-fill" /> Demo Code: <strong>{DEMO_OTP}</strong>
            </div>

            {error && <div className="auth-screen__error-pill"><i className="bi bi-exclamation-circle-fill" /> {error}</div>}

            <button type="submit" className="auth-screen__pill-btn">
              Verify &amp; Continue
            </button>

            <button
              type="button"
              className="auth-screen__sublink"
              onClick={() => {
                setError('');
                setStep('phone');
              }}
            >
              Change Phone Number
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
