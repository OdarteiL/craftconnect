import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './AuthPage.css';

function PasswordInput({ value, onChange, placeholder = '••••••••' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field">
      <input type={show ? 'text' : 'password'} required className="form-control"
        placeholder={placeholder} value={value} onChange={onChange} />
      <button type="button" className="password-toggle" onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justVerified = searchParams.get('verified') === '1';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  // Already logged in
  if (user) {
    if (user.role === 'admin') navigate('/admin', { replace: true });
    else if (user.role === 'artisan') navigate('/dashboard', { replace: true });
    else navigate('/products', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      if (u.role === 'admin') navigate('/admin');
      else if (u.role === 'artisan') navigate('/dashboard');
      else navigate('/products');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed.';
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setResendMsg('');
    try {
      await api.post('/auth/resend-verification', { email: form.email });
      setResendMsg('Verification email sent. Check your inbox.');
    } catch {
      setResendMsg('Failed to resend. Try again.');
    }
  };

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
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">Sign in to your account</p>
          </div>

          {justVerified && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              ✅ Email verified! Sign in to continue.
            </div>
          )}
          {error && (
            <div className="alert alert-error">
              {error}
              {unverified && (
                <div style={{ marginTop: '8px' }}>
                  <button className="btn btn-sm btn-outline" onClick={resendVerification}>
                    Resend verification email
                  </button>
                  {resendMsg && <p style={{ marginTop: '6px', fontSize: '0.85rem' }}>{resendMsg}</p>}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                required
                className="form-control"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label>
                Password
                <Link to="/forgot-password" style={{ float: 'right', fontSize: '0.85rem', color: 'var(--gold)' }}>
                  Forgot password?
                </Link>
              </label>
              <PasswordInput value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p>Don't have an account? <Link to="/register" style={{ color: 'var(--gold)' }}>Create one</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
