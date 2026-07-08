import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, total, fetchCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_phone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) { navigate('/login?redirect=/checkout'); return null; }
  if (items.length === 0) { navigate('/cart'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shipping_address) { setError('Shipping address is required.'); return; }
    if (!form.shipping_phone) { setError('Phone number is required.'); return; }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/payments/initialize', form);
      // Redirect to Paystack hosted payment page
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Checkout</h1>
          <p>Complete your order</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

            {/* Shipping */}
            <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Shipping Information</h2>
              <div className="form-group">
                <label>Shipping Address *</label>
                <textarea
                  className="form-control"
                  value={form.shipping_address}
                  onChange={e => setForm(f => ({ ...f, shipping_address: e.target.value }))}
                  placeholder="Enter your full shipping address"
                  required
                  rows={3}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>City</label>
                  <input className="form-control" value={form.shipping_city} onChange={e => setForm(f => ({ ...f, shipping_city: e.target.value }))} placeholder="City" />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input className="form-control" value={form.shipping_phone} onChange={e => setForm(f => ({ ...f, shipping_phone: e.target.value }))} placeholder="+233 XX XXX XXXX" required />
                </div>
              </div>
              <div className="form-group">
                <label>Order Notes (optional)</label>
                <textarea className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special instructions..." rows={2} />
              </div>
            </div>

            {/* Payment info */}
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Payment</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                You'll be redirected to Paystack's secure payment page to complete your payment.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['MTN MoMo', 'Vodafone Cash', 'AirtelTigo Money', 'Visa', 'Mastercard'].map(m => (
                  <span key={m} style={{ padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>{m}</span>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Redirecting to payment...' : `Pay GHS ${total} securely`}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              Secured by Paystack. We never store your card details.
            </p>
          </form>

          {/* Order summary */}
          <div className="cart-summary">
            <h2>Order Summary</h2>
            {items.map(item => (
              <div key={item.id} className="cart-summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>{item.product?.name} × {item.quantity}</span>
                <span>GHS {(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span className="amount">GHS {total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
