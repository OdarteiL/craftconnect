import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ImageUploader from '../components/ImageUploader';
import logo from '../assets/CraftConnect.png';
import './DashboardPage.css';

const NAV = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'orders',   label: 'Orders' },
  { key: 'auctions', label: 'Auctions' },
];

const EMPTY_FORM = { name: '', description: '', story: '', price: '', stock: '', category_id: '', materials: '', images: [] };

export default function DashboardPage() {
  const { user, isArtisan, isAdmin, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (!isArtisan && !isAdmin)) { navigate('/'); return; }
    Promise.all([
      api.get('/products?limit=100'),
      api.get('/orders').catch(() => ({ data: { orders: [] } })),
      api.get('/auctions?limit=100').catch(() => ({ data: { auctions: [] } })),
      api.get('/categories').catch(() => ({ data: { categories: [] } })),
    ]).then(([pr, or, au, ca]) => {
      setProducts((pr.data.products || []).filter(p => p.artisan_id === user.id));
      setOrders(or.data.orders || []);
      setAuctions((au.data.auctions || []).filter(a => a.artisan_id === user.id));
      setCategories(ca.data.categories || []);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0, materials: form.materials ? form.materials.split(',').map(m => m.trim()) : [] };
      await api.post('/products', payload);
      const r = await api.get('/products?limit=100');
      setProducts((r.data.products || []).filter(p => p.artisan_id === user.id));
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); } catch {}
    setProducts(p => p.filter(x => x.id !== id));
  };

  const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const liveAuctions = auctions.filter(a => a.status === 'active').length;

  if (!user || (!isArtisan && !isAdmin)) return null;

  return (
    <div className="db-shell">
      {/* Sidebar */}
      <aside className="db-sidebar">
        <div className="db-brand">
          <img src={logo} alt="CraftConnect" style={{ height: '72px', width: 'auto' }} />
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
            <div className="db-avatar">{user.first_name?.[0]}{user.last_name?.[0]}</div>
            <div className="db-user-info">
              <span className="db-user-name">{user.first_name} {user.last_name}</span>
              <span className="db-user-role">{user.role}</span>
            </div>
          </div>
          <button className="db-theme-btn" onClick={toggle}>
            {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="db-logout" onClick={async () => { await logout(); navigate('/login'); }}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="db-main">
        {loading ? (
          <div className="db-loading"><div className="db-spinner" /></div>
        ) : (
          <>
            {/* ── Overview ── */}
            {section === 'overview' && (
              <div className="db-section">
                <div className="db-page-header">
                  <div>
                    <h1 className="db-page-title">Welcome back, {user.first_name}</h1>
                    <span className="db-page-sub">Here's an overview of your shop</span>
                  </div>
                  <button className="db-btn-primary" onClick={() => setSection('products')}>+ New Product</button>
                </div>

                {/* Stats */}
                <div className="db-stats">
                  {[
                    { label: 'Products', value: products.length, sub: `${activeProducts} active`, trend: activeProducts > 0 ? 'up' : 'neutral' },
                    { label: 'Orders', value: orders.length, sub: `${pendingOrders} pending`, trend: pendingOrders > 0 ? 'up' : 'neutral' },
                    { label: 'Revenue', value: `GHS ${revenue.toFixed(2)}`, sub: 'all time', trend: revenue > 0 ? 'up' : 'neutral' },
                    { label: 'Auctions', value: auctions.length, sub: `${liveAuctions} live`, trend: liveAuctions > 0 ? 'up' : 'neutral' },
                  ].map(s => (
                    <div key={s.label} className="db-stat-card">
                      <span className="db-stat-label">{s.label}</span>
                      <span className="db-stat-value">{s.value}</span>
                      <span className={`db-stat-trend ${s.trend}`}>{s.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="db-quick-actions">
                  <button className="db-quick-action" onClick={() => { setSection('products'); setShowForm(true); }}>
                    Add Product
                  </button>
                  <button className="db-quick-action" onClick={() => setSection('orders')}>
                    View Orders
                  </button>
                  <Link to="/auctions" className="db-quick-action">
                    Browse Auctions
                  </Link>
                  <Link to="/products" className="db-quick-action">
                    Visit Shop
                  </Link>
                </div>

                <div className="db-overview-grid">
                  <div className="db-panel">
                    <div className="db-panel-header">
                      <span className="db-panel-title">Recent Products</span>
                      <button className="db-link" onClick={() => setSection('products')}>View all →</button>
                    </div>
                    <table className="db-table">
                      <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
                      <tbody>
                        {products.slice(0, 5).map(p => (
                          <tr key={p.id}>
                            <td className="db-td-primary">{p.name}</td>
                            <td>GHS {parseFloat(p.price).toFixed(2)}</td>
                            <td>{p.stock}</td>
                            <td><span className={`db-badge db-badge-${p.status}`}>{p.status}</span></td>
                          </tr>
                        ))}
                        {products.length === 0 && <tr><td colSpan={4} className="db-empty-row">No products yet</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <div className="db-panel">
                    <div className="db-panel-header">
                      <span className="db-panel-title">Recent Orders</span>
                      <button className="db-link" onClick={() => setSection('orders')}>View all →</button>
                    </div>
                    <table className="db-table">
                      <thead><tr><th>ID</th><th>Amount</th><th>Status</th></tr></thead>
                      <tbody>
                        {orders.slice(0, 5).map(o => (
                          <tr key={o.id}>
                            <td className="db-td-mono">#{o.id.slice(0, 8).toUpperCase()}</td>
                            <td>GHS {parseFloat(o.total_amount).toFixed(2)}</td>
                            <td><span className={`db-badge db-badge-${o.status}`}>{o.status}</span></td>
                          </tr>
                        ))}
                        {orders.length === 0 && <tr><td colSpan={3} className="db-empty-row">No orders yet</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Products ── */}
            {section === 'products' && (
              <div className="db-section">
                <div className="db-page-header">
                  <div>
                    <h1 className="db-page-title">Products</h1>
                    <span className="db-page-sub">{products.length} items · {activeProducts} active</span>
                  </div>
                  <button className="db-btn-primary" onClick={() => setShowForm(f => !f)}>
                    {showForm ? 'Cancel' : '+ New Product'}
                  </button>
                </div>

                {showForm && (
                  <div className="db-panel db-form-panel">
                    <div className="db-panel-header"><span className="db-panel-title">New Product</span></div>
                    <form onSubmit={handleSave} className="db-form">
                      <div className="db-form-grid">
                        <div className="db-field">
                          <label>Name *</label>
                          <input className="db-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        </div>
                        <div className="db-field">
                          <label>Category</label>
                          <select className="db-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                            <option value="">Select…</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="db-field">
                          <label>Price (GHS) *</label>
                          <input type="number" className="db-input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="0" step="0.01" />
                        </div>
                        <div className="db-field">
                          <label>Stock</label>
                          <input type="number" className="db-input" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} min="0" />
                        </div>
                      </div>
                      <div className="db-field">
                        <label>Description</label>
                        <textarea className="db-input db-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                      </div>
                      <div className="db-field">
                        <label>Cultural Story</label>
                        <textarea className="db-input db-textarea" value={form.story} onChange={e => setForm(f => ({ ...f, story: e.target.value }))} rows={3} />
                      </div>
                      <div className="db-field">
                        <label>Materials <span className="db-field-hint">(comma separated)</span></label>
                        <input className="db-input" value={form.materials} onChange={e => setForm(f => ({ ...f, materials: e.target.value }))} placeholder="Wood, Glass beads, Gold leaf" />
                      </div>
                      <div className="db-field">
                        <label>Images</label>
                        <ImageUploader images={form.images} onChange={imgs => setForm(f => ({ ...f, images: imgs }))} />
                      </div>
                      <div className="db-form-actions">
                        <button type="button" className="db-btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancel</button>
                        <button type="submit" className="db-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Product'}</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="db-panel">
                  <table className="db-table">
                    <thead>
                      <tr><th></th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Views</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td style={{ width: 44, padding: '8px 8px 8px 20px' }}>
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', display: 'block' }} />
                              : <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🏺</div>
                            }
                          </td>
                          <td><Link to={`/products/${p.id}`} className="db-td-primary db-td-link">{p.name}</Link></td>
                          <td className="db-td-muted">{p.category?.name || '—'}</td>
                          <td>GHS {parseFloat(p.price).toFixed(2)}</td>
                          <td>{p.stock}</td>
                          <td className="db-td-muted">{p.views || 0}</td>
                          <td><span className={`db-badge db-badge-${p.status}`}>{p.status}</span></td>
                          <td>
                            <button className="db-btn-danger-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr><td colSpan={8} className="db-empty-row">No products yet. Click "+ New Product" to add one.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Orders ── */}
            {section === 'orders' && (
              <div className="db-section">
                <div className="db-page-header">
                  <div>
                    <h1 className="db-page-title">Orders</h1>
                    <span className="db-page-sub">{orders.length} total · {pendingOrders} pending</span>
                  </div>
                </div>
                <div className="db-panel">
                  <table className="db-table">
                    <thead>
                      <tr><th>Order ID</th><th>Date</th><th>Amount</th><th>Payment</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id}>
                          <td className="db-td-mono">#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="db-td-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                          <td>GHS {parseFloat(o.total_amount).toFixed(2)}</td>
                          <td className="db-td-muted">{o.payment_method || '—'}</td>
                          <td><span className={`db-badge db-badge-${o.status}`}>{o.status}</span></td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr><td colSpan={5} className="db-empty-row">No orders yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Auctions ── */}
            {section === 'auctions' && (
              <div className="db-section">
                <div className="db-page-header">
                  <div>
                    <h1 className="db-page-title">Auctions</h1>
                    <span className="db-page-sub">{auctions.length} total · {liveAuctions} live</span>
                  </div>
                  <Link to="/auctions" className="db-btn-primary">Browse Auctions →</Link>
                </div>
                <div className="db-panel">
                  <table className="db-table">
                    <thead>
                      <tr><th>Product</th><th>Starting Price</th><th>Current Price</th><th>Bids</th><th>Ends</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {auctions.map(a => (
                        <tr key={a.id}>
                          <td className="db-td-primary">{a.product?.name || '—'}</td>
                          <td>GHS {parseFloat(a.starting_price).toFixed(2)}</td>
                          <td>GHS {parseFloat(a.current_price || a.starting_price).toFixed(2)}</td>
                          <td>{a.bid_count || 0}</td>
                          <td className="db-td-muted">{new Date(a.end_time).toLocaleDateString()}</td>
                          <td><span className={`db-badge db-badge-${a.status}`}>{a.status}</span></td>
                        </tr>
                      ))}
                      {auctions.length === 0 && (
                        <tr><td colSpan={6} className="db-empty-row">No auctions yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
