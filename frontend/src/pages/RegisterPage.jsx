import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import './AuthPage.css';

const STRENGTH_LEVELS = [
  { label: 'Too short',   color: '#e53e3e', width: '15%' },
  { label: 'Weak',        color: '#e53e3e', width: '25%' },
  { label: 'Fair',        color: '#dd6b20', width: '50%' },
  { label: 'Good',        color: '#d69e2e', width: '75%' },
  { label: 'Strong',      color: '#38a169', width: '100%' },
];

function getStrength(pw) {
  if (!pw) return null;
  if (pw.length < 6) return STRENGTH_LEVELS[0];
  let score = 1;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return STRENGTH_LEVELS[Math.min(score, 4)];
}

function PasswordInput({ value, onChange, placeholder = '••••••••', name }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        required
        minLength={6}
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button type="button" className="password-toggle" onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', password: '', confirm_password: '',
    first_name: '', last_name: '', role: 'buyer', phone: '', location: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));
  const strength = getStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) return setError('Passwords do not match.');
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess('Account created! Check your email to verify before logging in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-split-page">
        <div className="auth-image-side">
          <div className="auth-image-overlay" />
          <div className="auth-image-content">
            <h1 className="auth-image-title">CraftConnect</h1>
            <p className="auth-image-subtitle">Connecting authentic Ghanaian artisans with buyers worldwide</p>
            <div className="auth-image-features">
              {['Authentic handcrafted products', 'Support local artisans', 'Participate in live auctions'].map(f => (
                <div className="auth-feature-item" key={f}>
                  <span className="auth-feature-check">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="auth-form-side">
          <div className="auth-form-container" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Check your email</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{success}</p>
            <Link to="/login" className="btn btn-primary btn-lg btn-block">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-split-page">
      {/* Left panel */}
      <div className="auth-image-side">
        <div className="auth-image-overlay" />
        <div className="auth-image-content">
          <h1 className="auth-image-title">CraftConnect</h1>
          <p className="auth-image-subtitle">Join our community of artisans and buyers celebrating Ghanaian craft heritage</p>
          <div className="auth-image-features">
            {[
              'Discover authentic handcrafted products',
              'Support local Ghanaian artisans',
              'Participate in live auctions',
              'Sell your craft to the world',
            ].map(f => (
              <div className="auth-feature-item" key={f}>
                <span className="auth-feature-check">✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-subtitle">Already have one? <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link></p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" required className="form-control" placeholder="Kofi"
                  value={form.first_name} onChange={set('first_name')} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" required className="form-control" placeholder="Mensah"
                  value={form.last_name} onChange={set('last_name')} />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" required className="form-control" placeholder="you@example.com"
                value={form.email} onChange={set('email')} />
            </div>

            <div className="form-group">
              <label>Password</label>
              <PasswordInput value={form.password} onChange={set('password')} />
              {strength && (
                <>
                  <div className="strength-bar" style={{ background: strength.color, width: strength.width, maxWidth: '100%' }} />
                  <small style={{ color: strength.color, fontSize: '0.8rem' }}>{strength.label}</small>
                </>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <PasswordInput value={form.confirm_password} onChange={set('confirm_password')} placeholder="••••••••" />
            </div>

            {/* Role picker */}
            <div className="form-group">
              <label>I am a...</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                {[{ key: 'buyer', icon: '🛍️', label: 'Buyer' }, { key: 'artisan', icon: '🎨', label: 'Artisan' }].map(r => (
                  <label key={r.key} className="role-option">
                    <input type="radio" name="role" value={r.key}
                      checked={form.role === r.key} onChange={set('role')} />
                    <div className={`role-card ${form.role === r.key ? 'selected' : ''}`}>
                      <span className="role-icon">{r.icon}</span>
                      <span className="role-label">{r.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Phone <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(optional)</span></label>
                <input type="tel" className="form-control" placeholder="+233 XX XXX XXXX"
                  value={form.phone} onChange={set('phone')} />
              </div>
              <div className="form-group">
                <label>Location <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(optional)</span></label>
                <input type="text" className="form-control" placeholder="Accra, Ghana"
                  value={form.location} onChange={set('location')} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block" style={{ marginTop: '0.5rem' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>By creating an account you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
