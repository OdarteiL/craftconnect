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
    payment_method: 'mobile_money',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shipping_address) {
      setError('Shipping address is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/orders', form);
      await fetchCart();
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order.');
    }
    setLoading(false);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Checkout</h1>
          <p>Complete your order</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>📦 Shipping Information</h2>
              <div className="form-group">
                <label>Shipping Address *</label>
                <textarea
                  className="form-control"
                  name="shipping_address"
                  value={form.shipping_address}
                  onChange={handleChange}
                  placeholder="Enter your full shipping address"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>City</label>
                  <input className="form-control" name="shipping_city" value={form.shipping_city} onChange={handleChange} placeholder="City" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" name="shipping_phone" value={form.shipping_phone} onChange={handleChange} placeholder="+233 XX XXX XXXX" />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '24px' }}>💳 Payment Method</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { value: 'mobile_money', label: '📱 Mobile Money', desc: 'MTN, Vodafone, AirtelTigo' },
                  { value: 'card', label: '💳 Card', desc: 'Visa / Mastercard' },
                  { value: 'bank', label: '🏦 Bank Transfer', desc: 'Direct transfer' }
                ].map(method => (
                  <div
                    key={method.value}
                    className={`role-option ${form.payment_method === method.value ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, payment_method: method.value }))}
                  >
                    <div className="name">{method.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{method.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Order Notes (optional)</label>
              <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} placeholder="Any special instructions..." />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Placing Order...' : `Place Order — GHS ${total}`}
            </button>
          </form>

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
