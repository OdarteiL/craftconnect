import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    bio: ''
  });
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || ''
      });
      setRole(user.role || 'buyer');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.put('/auth/profile', formData);
      await refreshUser();
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    setLoading(true);
    setMessage('');

    try {
      await api.put('/auth/role', { role: newRole });
      await refreshUser();
      setRole(newRole);
      setMessage(`Role updated to ${newRole}!`);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>

        {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}

        <div className="role-section">
          <h2>Account Type</h2>
          <p className="role-description">
            {role === 'buyer' ? 'You can browse and purchase products' : 'You can sell products and create auctions'}
          </p>
          <div className="role-buttons">
            <button
              className={`role-btn ${role === 'buyer' ? 'active' : ''}`}
              onClick={() => handleRoleChange('buyer')}
              disabled={loading || role === 'buyer'}
            >
              Buyer
            </button>
            <button
              className={`role-btn ${role === 'artisan' ? 'active' : ''}`}
              onClick={() => handleRoleChange('artisan')}
              disabled={loading || role === 'artisan'}
            >
              Artisan (Seller)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <h2>Personal Information</h2>

          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Aburi, Ghana"
            />
          </div>

          {role === 'artisan' && (
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell buyers about your craft..."
                rows="4"
              />
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
