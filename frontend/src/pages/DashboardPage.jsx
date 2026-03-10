import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', story: '', price: '', stock: '', category_id: '', materials: '' });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role === 'buyer') { navigate('/'); return; }
    api.get('/products?limit=100').then(r => {
      const mine = (r.data.products || []).filter(p => p.artisan_id === user.id);
      setProducts(mine);
    }).catch(() => {}).finally(() => setLoading(false));
    api.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        materials: form.materials ? form.materials.split(',').map(m => m.trim()) : []
      };
      await api.post('/products', payload);
      setShowForm(false);
      setForm({ name: '', description: '', story: '', price: '', stock: '', category_id: '', materials: '' });
      const r = await api.get('/products?limit=100');
      setProducts((r.data.products || []).filter(p => p.artisan_id === user.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create product.');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  if (!user || user.role === 'buyer') return null;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Artisan Dashboard</h1>
          <p>Manage your products and track your sales</p>
        </div>

        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Products Listed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{products.filter(p => p.status === 'active').length}</div>
            <div className="stat-label">Active Products</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👁</div>
            <div className="stat-value">{products.reduce((s, p) => s + (p.views || 0), 0)}</div>
            <div className="stat-label">Total Views</div>
          </div>
        </div>

        <div className="flex-between mb-3">
          <h2>Your Products</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '20px' }}>New Product</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Product Name *</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-control" value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Price (GHS) *</label>
                <input type="number" className="form-control" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" className="form-control" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} min="0" />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your product..." />
            </div>
            <div className="form-group">
              <label>Cultural Story</label>
              <textarea className="form-control" value={form.story} onChange={(e) => setForm(f => ({ ...f, story: e.target.value }))} placeholder="Tell the story behind this craft..." />
            </div>
            <div className="form-group">
              <label>Materials (comma separated)</label>
              <input className="form-control" value={form.materials} onChange={(e) => setForm(f => ({ ...f, materials: e.target.value }))} placeholder="Wood, Glass beads, Gold leaf" />
            </div>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Product'}</button>
          </form>
        )}

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🎨</div>
            <h3>No products yet</h3>
            <p>Click "Add Product" to list your first craft.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Views</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/products/${p.id}`} style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</Link>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.category?.name || '—'}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: 600 }}>GHS {parseFloat(p.price).toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td>{p.views}</td>
                    <td><span className={`status-badge ${p.status}`}>{p.status}</span></td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                    </td>
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
