import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMsg(data.message);
    } catch {
      setMsg('If that email is registered, a reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🔑</div>
          <h2>Forgot Password</h2>
          <p>Enter your email and we'll send a reset link.</p>
        </div>

        {msg ? (
          <div className="alert alert-success">
            {msg}
            <div style={{ marginTop: '12px' }}>
              <Link to="/login" className="btn btn-primary btn-sm">Back to Login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" required className="form-control" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/login" style={{ color: 'var(--gold)' }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
