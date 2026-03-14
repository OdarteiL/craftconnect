import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, buyers: 0, artisans: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      const list = res.data.users || [];
      setUsers(list);
      setStats({
        total: list.length,
        buyers: list.filter(u => u.role === 'buyer').length,
        artisans: list.filter(u => u.role === 'artisan').length,
        admins: list.filter(u => u.role === 'admin').length,
      });
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      setMessage('Role updated successfully');
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      setMessage('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (authLoading || loading) return <div className="admin-page"><p style={{ color: '#fff', padding: '2rem' }}>Loading...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>⚙️ Admin Dashboard</h1>
            <p className="subtitle">Welcome back, {user?.first_name || 'Admin'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-icon">👥</div>
            <div className="admin-stat-value">{stats.total}</div>
            <div className="admin-stat-label">Total Users</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🛍️</div>
            <div className="admin-stat-value">{stats.buyers}</div>
            <div className="admin-stat-label">Buyers</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🎨</div>
            <div className="admin-stat-value">{stats.artisans}</div>
            <div className="admin-stat-label">Artisans</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🔑</div>
            <div className="admin-stat-value">{stats.admins}</div>
            <div className="admin-stat-label">Admins</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="admin-quick-links">
          <Link to="/admin/users" className="admin-quick-link">
            <span>👤</span> User Management
          </Link>
          <Link to="/products" className="admin-quick-link">
            <span>📦</span> View Products
          </Link>
          <Link to="/auctions" className="admin-quick-link">
            <span>🔨</span> View Auctions
          </Link>
        </div>

        {/* User Table */}
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ color: '#D4A017', marginBottom: '1rem' }}>User Management</h2>

          {message && <div className="message">{message}</div>}

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="buyer">Buyer</option>
                        <option value="artisan">Artisan</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status ${u.is_active ? 'active' : 'inactive'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleDeleteUser(u.id)} className="delete-btn">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
