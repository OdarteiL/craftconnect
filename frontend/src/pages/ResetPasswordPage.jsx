import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import './AuthPage.css';

function PasswordInput({ value, onChange, placeholder = '••••••••' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-field">
      <input type={show ? 'text' : 'password'} required minLength={6} className="form-control"
        placeholder={placeholder} value={value} onChange={onChange} />
      <button type="button" className="password-toggle" onClick={() => setShow(s => !s)} tabIndex={-1}>
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password: form.password });
      setMsg(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="alert alert-error">Invalid reset link.</div>
          <Link to="/forgot-password" className="btn btn-primary btn-block mt-2">Request new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🔒</div>
          <h2>Reset Password</h2>
        </div>

        {msg ? (
          <div className="alert alert-success">
            {msg}
            <div style={{ marginTop: '12px' }}>
              <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
            </div>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>New Password</label>
                <PasswordInput value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <PasswordInput value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
