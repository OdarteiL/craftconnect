import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import './AuthPage.css';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMsg('No token provided.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => { setStatus('success'); setMsg(data.message); })
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
            <Link to="/login" className="btn btn-primary mt-2">Sign In</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="auth-logo">❌</div>
            <h2>Verification Failed</h2>
            <p>{msg}</p>
            <Link to="/login" className="btn btn-primary mt-2">Back to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
