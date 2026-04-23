import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/CraftConnect.png';
import './DashboardPage.css';

const NAV = [
  { key: 'orders',  label: 'My Orders' },
];

export default function OrdersPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/orders')
      .then(r => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="db-shell">
      <aside className="db-sidebar">
        <div className="db-brand">
          <img src={logo} alt="CraftConnect" style={{ height: '56px', width: 'auto' }} />
        </div>
        <nav className="db-nav">
          {NAV.map(n => (
            <button key={n.key} className="db-nav-item active">
              <span>{n.label}</span>
            </button>
          ))}
          <Link to="/products" className="db-nav-item" style={{ textDecoration: 'none' }}>Shop</Link>
          <Link to="/auctions" className="db-nav-item" style={{ textDecoration: 'none' }}>Auctions</Link>
          <Link to="/cart" className="db-nav-item" style={{ textDecoration: 'none' }}>Cart</Link>
        </nav>
        <div className="db-sidebar-footer">
          <div className="db-user-row">
            <div className="db-avatar">{user.first_name?.[0]}{user.last_name?.[0]}</div>
            <div className="db-user-info">
              <span className="db-user-name">{user.first_name} {user.last_name}</span>
              <span className="db-user-role">{user.role}</span>
            </div>
          </div>
          <button className="db-theme-btn" onClick={toggle}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="db-logout" onClick={async () => { await logout(); navigate('/login'); }}>Sign out</button>
        </div>
      </aside>

      <main className="db-main">
        {loading ? (
          <div className="db-loading"><div className="db-spinner" /></div>
        ) : (
          <div className="db-section">
            <div className="db-page-header">
              <div>
                <h1 className="db-page-title">My Orders</h1>
                <span className="db-page-sub">{orders.length} total</span>
              </div>
              <Link to="/products" className="db-btn-primary">Continue Shopping</Link>
            </div>

            <div className="db-panel">
              <table className="db-table">
                <thead>
                  <tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td className="db-td-mono">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="db-td-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        {order.items?.map(item => (
                          <div key={item.id} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {item.product?.name} × {item.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="db-td-primary" style={{ fontWeight: 600 }}>GHS {parseFloat(order.total_amount).toFixed(2)}</td>
                      <td className="db-td-muted">{order.payment_method || '—'}</td>
                      <td><span className={`db-badge db-badge-${order.status}`}>{order.status}</span></td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={6} className="db-empty-row">No orders yet. <Link to="/products" style={{ color: 'var(--gold)' }}>Start shopping</Link></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
