import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import './AuthPage.css';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('verifying');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { setStatus('error'); setMsg('No token provided.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => {
        setStatus('success');
        setMsg(data.message);
        setTimeout(() => navigate('/login?verified=1', { replace: true }), 2000);
      })
      .catch(err => { setStatus('error'); setMsg(err.response?.data?.error || 'Verification failed.'); });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ textAlign: 'center' }}>
        {status === 'verifying' && <p>Verifying your email...</p>}
        {status === 'success' && (
          <>
            <div className="auth-logo">✅</div>
            <h2>Email Verified!</h2>
            <p>{msg}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Redirecting you to sign in...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="auth-logo">❌</div>
            <h2>Verification Failed</h2>
            <p>{msg}</p>
            <button className="btn btn-primary mt-2" onClick={() => navigate('/login', { replace: true })}>Back to Login</button>
          </>
        )}
      </div>
    </div>
  );
}
