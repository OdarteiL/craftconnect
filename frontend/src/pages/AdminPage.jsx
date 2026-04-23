import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/CraftConnect.png';
import '../pages/DashboardPage.css';

const NAV = [
  { key: 'overview', label: 'Overview' },
  { key: 'users',    label: 'Users' },
  { key: 'auctions', label: 'Auctions' },
];

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [users, setUsers] = useState([]);
  const [allAuctions, setAllAuctions] = useState([]);
  const [stats, setStats] = useState({ total: 0, buyers: 0, artisans: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [bidders, setBidders] = useState(null);
  const [loadingBidders, setLoadingBidders] = useState(false);

  const viewBidders = async (auction) => {
    setLoadingBidders(true);
    setBidders({ auctionName: auction.product?.name || 'Auction', bids: [] });
    try {
      const r = await api.get(`/auctions/${auction.id}/bids`);
      setBidders({ auctionName: auction.product?.name || 'Auction', bids: r.data.bids || [] });
    } catch {}
    setLoadingBidders(false);
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/auth/users')
      .then(res => {
        const list = res.data.users || [];
        setUsers(list);
        setStats({
          total: list.length,
          buyers: list.filter(u => u.role === 'buyer').length,
          artisans: list.filter(u => u.role === 'artisan').length,
          admins: list.filter(u => u.role === 'admin').length,
        });
      })
      .catch(err => setMessage(err.response?.data?.error || 'Failed to fetch users'))
      .finally(() => setLoading(false));

    api.get('/auctions?status=all&limit=100')
      .then(r => setAllAuctions(r.data.auctions || []))
      .catch(() => {});
  }, [isAdmin]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      setMessage('Role updated');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setStats(s => ({ ...s, total: s.total - 1 }));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (authLoading || loading) return <div className="db-loading"><div className="db-spinner" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="db-shell">
      <aside className="db-sidebar">
        <div className="db-brand">
          <img src={logo} alt="CraftConnect" style={{ height: '56px', width: 'auto' }} />
        </div>
        <nav className="db-nav">
          {NAV.map(n => (
            <button key={n.key} className={`db-nav-item ${section === n.key ? 'active' : ''}`} onClick={() => setSection(n.key)}>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="db-sidebar-footer">
          <div className="db-user-row">
            <div className="db-avatar">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
            <div className="db-user-info">
              <span className="db-user-name">{user?.first_name} {user?.last_name}</span>
              <span className="db-user-role">{user?.role}</span>
            </div>
          </div>
          <button className="db-theme-btn" onClick={toggle}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="db-logout" onClick={async () => { await logout(); navigate('/login'); }}>Sign out</button>
        </div>
      </aside>

      <main className="db-main">
        <div className="db-section">
          {section === 'overview' && (
            <>
              <div className="db-page-header">
                <div>
                  <h1 className="db-page-title">Admin Dashboard</h1>
                  <span className="db-page-sub">Welcome back, {user?.first_name}</span>
                </div>
              </div>

              <div className="db-stats">
                {[
                  { label: 'Total Users', value: stats.total },
                  { label: 'Buyers',      value: stats.buyers },
                  { label: 'Artisans',    value: stats.artisans },
                  { label: 'Admins',      value: stats.admins },
                ].map(s => (
                  <div key={s.label} className="db-stat-card">
                    <span className="db-stat-label">{s.label}</span>
                    <span className="db-stat-value">{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="db-quick-actions">
                <button className="db-quick-action" onClick={() => setSection('users')}>Manage Users</button>
                <Link to="/products" className="db-quick-action">View Products</Link>
                <Link to="/auctions" className="db-quick-action">View Auctions</Link>
              </div>
            </>
          )}

          {section === 'users' && (
            <>
              <div className="db-page-header">
                <div>
                  <h1 className="db-page-title">Users</h1>
                  <span className="db-page-sub">{users.length} registered</span>
                </div>
              </div>

              {message && <div className="db-panel" style={{ padding: '12px 20px', marginBottom: '16px', color: 'var(--gold)', fontSize: '0.875rem' }}>{message}</div>}

              <div className="db-panel">
                <table className="db-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="db-td-primary">{u.first_name} {u.last_name}</td>
                        <td className="db-td-muted">{u.email}</td>
                        <td>
                          <select className="db-input" style={{ padding: '4px 8px', width: 'auto' }} value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}>
                            <option value="buyer">Buyer</option>
                            <option value="artisan">Artisan</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td><span className={`db-badge ${u.is_verified ? 'db-badge-active' : 'db-badge-inactive'}`}>{u.is_verified ? 'Verified' : 'Unverified'}</span></td>
                        <td><button className="db-btn-danger-sm" onClick={() => handleDelete(u.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {section === 'auctions' && (
            <>
              <div className="db-page-header">
                <div>
                  <h1 className="db-page-title">All Auctions</h1>
                  <span className="db-page-sub">{allAuctions.length} total</span>
                </div>
              </div>
              <div className="db-panel">
                <table className="db-table">
                  <thead>
                    <tr><th>Product</th><th>Artisan</th><th>Current Price</th><th>Bids</th><th>Ends</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {allAuctions.map(a => (
                      <tr key={a.id}>
                        <td className="db-td-primary">{a.product?.name || '—'}</td>
                        <td className="db-td-muted">{a.artisan?.first_name} {a.artisan?.last_name}</td>
                        <td>GHS {parseFloat(a.current_price || a.starting_price).toFixed(2)}</td>
                        <td>{a.bid_count || 0}</td>
                        <td className="db-td-muted">{new Date(a.end_time).toLocaleDateString()}</td>
                        <td><span className={`db-badge db-badge-${a.status}`}>{a.status}</span></td>
                        <td>
                          {a.bid_count > 0 && (
                            <button className="db-btn-ghost" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => viewBidders(a)}>
                              View Bidders
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {allAuctions.length === 0 && <tr><td colSpan={7} className="db-empty-row">No auctions yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bidders Modal */}
      {bidders && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', width: '100%', maxWidth: '680px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="db-panel-header" style={{ padding: '16px 20px' }}>
              <span className="db-panel-title">Bidders — {bidders.auctionName}</span>
              <button className="db-link" onClick={() => setBidders(null)}>✕ Close</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loadingBidders ? (
                <div className="db-loading" style={{ height: '120px' }}><div className="db-spinner" /></div>
              ) : bidders.bids.length === 0 ? (
                <p className="db-empty-row">No bids yet.</p>
              ) : (
                <table className="db-table">
                  <thead>
                    <tr><th>Rank</th><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Bid (GHS)</th></tr>
                  </thead>
                  <tbody>
                    {bidders.bids.map((b, i) => (
                      <tr key={b.id}>
                        <td className="db-td-muted">#{i + 1}</td>
                        <td className="db-td-primary">{b.bidder?.first_name} {b.bidder?.last_name}</td>
                        <td className="db-td-muted">{b.bidder?.email || '—'}</td>
                        <td className="db-td-muted">{b.bidder?.phone || '—'}</td>
                        <td className="db-td-muted">{b.bidder?.location || '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{parseFloat(b.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
