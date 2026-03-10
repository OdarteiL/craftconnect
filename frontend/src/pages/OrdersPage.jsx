import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/orders')
      .then(r => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="page"><div className="container"><div className="empty-state">
        <h3>Please login to view orders</h3>
        <Link to="/login" className="btn btn-primary mt-2">Login</Link>
      </div></div></div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Orders</h1>
          <p>Track and manage your orders</p>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>No orders yet</h3>
            <p>Your order history will appear here after your first purchase.</p>
            <Link to="/products" className="btn btn-primary mt-2">Start Shopping</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{order.id.slice(0, 8)}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {order.items?.map(item => (
                          <span key={item.id} style={{ fontSize: '0.85rem' }}>
                            {item.product?.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--gold)' }}>GHS {parseFloat(order.total_amount).toFixed(2)}</td>
                    <td><span className={`status-badge ${order.status}`}>{order.status}</span></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.payment_method || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
