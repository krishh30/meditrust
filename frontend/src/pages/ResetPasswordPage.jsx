
import { useState } from 'react';
import { Icon } from '../components/Icons';
import { HospitalSkyline } from '../components/HospitalSkyline';

export function ResetPasswordPage({ onNavigate }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Real reset-password API will be connected next.
    onNavigate('login');
  };

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
              Create a New Password
            </h2>

            <p className="auth-brand-copy">
              Your account has been verified. Set a new
              password to secure your MediTrust account.
            </p>

            <ul className="auth-trust-list">
              <li>
                <Icon name="shield" size={16} />
                <span>Secure password recovery</span>
              </li>

              <li>
                <Icon name="lock" size={16} />
                <span>Keep your account protected</span>
              </li>

              <li>
                <Icon name="badge-check" size={16} />
                <span>Verified recovery process</span>
              </li>
            </ul>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="auth-form-panel">

          <h1 className="auth-form-title">
            Reset your password
          </h1>

          <p className="auth-form-subtitle">
            Create a new password for your MediTrust account.
          </p>

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* NEW PASSWORD */}
            <div className="form-field">
              <label htmlFor="reset-password">
                New Password
              </label>

              <div className="password-box">
                <input
                  id="reset-password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="eye-button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? 'hide' : 'show'}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="form-field">
              <label htmlFor="reset-confirm-password">
                Confirm New Password
              </label>

              <div className="password-box">
                <input
                  id="reset-confirm-password"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
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
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showConfirmPassword ? 'hide' : 'show'}
                </button>
              </div>
            </div>

            {/* PASSWORD RULE */}
            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginTop: '-8px',
                marginBottom: '18px',
              }}
            >
              Use at least 8 characters for your new password.
            </p>

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
            >
              <Icon name="lock" size={16} />
              <span>Reset Password</span>
            </button>

          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => onNavigate('login')}
          >
            <Icon
              name="arrow-right"
              size={16}
              className="rotate-180"
            />
            <span>Back to Login</span>
          </button>

        </div>
      </div>
    </div>
  );
}

