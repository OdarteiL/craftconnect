import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';

export default function PaymentVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [message, setMessage] = useState('');

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) { navigate('/'); return; }

    api.get(`/payments/verify?reference=${reference}`)
      .then(({ data }) => {
        if (data.status === 'success' || data.status === 'confirmed') {
          setStatus('success');
        } else {
          setStatus('failed');
          setMessage('Payment was not completed.');
        }
      })
      .catch(err => {
        setStatus('failed');
        setMessage(err.response?.data?.error || 'Payment verification failed.');
      });
  }, []);

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '480px', textAlign: 'center', paddingTop: '80px' }}>
        {status === 'verifying' && (
          <>
            <div className="loading" style={{ justifyContent: 'center', marginBottom: '24px' }}>
              <div className="spinner" />
            </div>
            <h2>Verifying your payment...</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Please wait, do not close this page.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✓</div>
            <h2 style={{ color: 'var(--success)', marginBottom: '8px' }}>Payment Successful</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Your order has been confirmed. You'll receive an email confirmation shortly.
            </p>
            <Link to="/orders" className="btn btn-primary">View My Orders</Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✕</div>
            <h2 style={{ color: 'var(--error)', marginBottom: '8px' }}>Payment Failed</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>{message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/checkout" className="btn btn-primary">Try Again</Link>
              <Link to="/cart" className="btn btn-secondary">Back to Cart</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
