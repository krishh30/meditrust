import { useState } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../services/api';

export function LoginPage({ onNavigate }) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login');

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [location, setLocation] = useState('');
  const [consent, setConsent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = identifier.trim();
    const cleanName = name.trim();

    if (!cleanIdentifier || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup') {
      if (!cleanName) {
        setError('Please enter your full name.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (!consent) {
        setError('Please confirm your consent before creating an account.');
        return;
      }
    }

    try {
      setSubmitting(true);

      if (mode === 'login') {
        await login({
          identifier: cleanIdentifier,
          password,
        });
      } else {
        await register({
          full_name: cleanName,
          identifier: cleanIdentifier,
          password,
          role,
          city: location.trim() || null,
          consent,
        });
      }

      onNavigate('home');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = () => {
    onNavigate('home');
  };

  const EyeIcon = ({ visible }) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {visible ? (
        <>
          <path d="M2 2l20 20" />
          <path d="M6.7 6.7C4.9 8 3.5 9.8 2.5 12c1.8 4 5.4 7 9.5 7 1.6 0 3.1-.4 4.4-1.1" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M17.3 17.3C19.1 16 20.5 14.2 21.5 12c-1.8-4-5.4-7-9.5-7-1.1 0-2.2.2-3.2.6" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-card">

        {/* LEFT SIDE */}
        <div className="auth-brand-panel">
          <HospitalSkyline
            tone="dark"
            className="auth-skyline"
          />

          <div className="auth-brand-content">

            <div className="brand-logo auth-brand-logo">
              <Icon name="logo" size={40} />

              <div className="brand-text">
                <span className="brand-name auth-brand-name">
                  Medi<span>Trust</span>
                </span>
              </div>
            </div>

            <h2 className="auth-brand-title">
              Right Care. Right Hospital. Right Support.
            </h2>

            <p className="auth-brand-copy">
              Your healthcare journey, all in one trusted place.
              Discover verified hospitals, doctors and healthcare
              services with confidence.
            </p>

            <ul className="auth-trust-list">
              <li>
                <Icon name="badge-check" size={16} />
                <span>MediTrust Verified hospital network</span>
              </li>

              <li>
                <Icon name="shield" size={16} />
                <span>Your account information stays private</span>
              </li>

              <li>
                <Icon name="activity" size={16} />
                <span>Find healthcare services when you need them</span>
              </li>

              <li>
                <Icon name="user" size={16} />
                <span>Patients and caregivers supported</span>
              </li>
            </ul>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-form-panel">

          <button
            type="button"
            className="back-breadcrumb-btn auth-back-btn"
            onClick={() => onNavigate('home')}
          >
            <Icon
              name="arrow-right"
              size={16}
              className="rotate-180"
            />

            <span>Back to MediTrust</span>
          </button>

          {/* LOGIN / SIGNUP TABS */}
          <div className="auth-tabs">

            <button
              type="button"
              className={
                'auth-tab-btn ' +
                (mode === 'login' ? 'active' : '')
              }
              onClick={() => switchMode('login')}
            >
              Log In
            </button>

            <button
              type="button"
              className={
                'auth-tab-btn ' +
                (mode === 'signup' ? 'active' : '')
              }
              onClick={() => switchMode('signup')}
            >
              Create Account
            </button>

          </div>

          {/* HEADING */}
          <h1 className="auth-form-title">
            {mode === 'login'
              ? 'Welcome back'
              : 'Create your MediTrust account'}
          </h1>

          <p className="auth-form-subtitle">
            {mode === 'login'
              ? 'Log in to continue your healthcare journey.'
              : 'Create a free account to manage your healthcare journey.'}
          </p>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* NAME - SIGNUP ONLY */}
            {mode === 'signup' && (
              <div className="form-field">

                <label htmlFor="auth-name">
                  Full Name
                </label>

                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Aditi Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />

              </div>
            )}

            {/* ROLE - SIGNUP ONLY */}
            {mode === 'signup' && (
              <div className="form-field">

                <label>
                  Registering as
                </label>

                <div className="role-toggle-group">

                  <button
                    type="button"
                    className={
                      'role-toggle-btn ' +
                      (role === 'patient' ? 'active' : '')
                    }
                    onClick={() => setRole('patient')}
                  >
                    <Icon name="user" size={15} />
                    <span>Patient</span>
                  </button>

                  <button
                    type="button"
                    className={
                      'role-toggle-btn ' +
                      (role === 'caregiver' ? 'active' : '')
                    }
                    onClick={() => setRole('caregiver')}
                  >
                    <Icon name="heart" size={15} />
                    <span>Family / Caregiver</span>
                  </button>

                </div>
              </div>
            )}

            {/* IDENTIFIER */}
            <div className="form-field">

              <label htmlFor="auth-id">
                Username, Phone Number or Email
              </label>

              <input
                id="auth-id"
                type="text"
                placeholder="Enter username, phone number or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />

            </div>

            {/* PASSWORD */}
            <div className="form-field">

              <label htmlFor="auth-pw">
                Password
              </label>

              <div className="password-box">

                <input
                  id="auth-pw"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === 'login'
                      ? 'current-password'
                      : 'new-password'
                  }
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  <EyeIcon visible={showPassword} />
                </button>

              </div>

            </div>

            {/* FORGOT PASSWORD */}
            {mode === 'login' && (
              <p
                style={{
                  textAlign: 'right',
                  marginTop: '-10px',
                  marginBottom: '18px',
                }}
              >
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Forgot Password?
                </button>
              </p>
            )}

            {/* SIGNUP EXTRA FIELDS */}
            {mode === 'signup' && (
              <>
                <div className="form-field">

                  <label htmlFor="auth-confirm-pw">
                    Confirm Password
                  </label>

                  <div className="password-box">

                    <input
                      id="auth-confirm-pw"
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="eye-button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previous) => !previous
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirm password'
                          : 'Show confirm password'
                      }
                    >
                      <EyeIcon visible={showConfirmPassword} />
                    </button>

                  </div>

                </div>

                <div className="form-field">

                  <label htmlFor="auth-location">
                    City / Location{' '}
                    <span className="optional-tag">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="auth-location"
                    type="text"
                    placeholder="e.g. Faridabad, Haryana"
                    value={location}
                    onChange={(e) =>
                      setLocation(e.target.value)
                    }
                  />

                </div>

                <label className="consent-checkbox-row">

                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) =>
                      setConsent(e.target.checked)
                    }
                  />

                  <span>
                    I consent to MediTrust collecting my basic
                    profile information to help coordinate my
                    healthcare journey.
                  </span>

                </label>
              </>
            )}

            {/* ERROR */}
            {error && (
              <div className="auth-error-note">

                <Icon name="help" size={14} />

                <span>{error}</span>

              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={submitting}
            >
              <Icon name="lock" size={16} />

              <span>
                {submitting
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Log In Securely'
                    : 'Create My Account'}
              </span>
            </button>

          </form>

          {/* GUEST */}
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={handleGuest}
          >
            <Icon name="user" size={16} />
            <span>Continue as Guest</span>
          </button>

          <p className="auth-disclaimer-note">
            Your account is securely authenticated by the
            MediTrust backend. Guest browsing does not create
            an account.
          </p>

        </div>
      </div>
    </div>
  );
}