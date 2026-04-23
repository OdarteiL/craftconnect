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
];

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, buyers: 0, artisans: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
        </div>
      </main>
    </div>
  );
}
