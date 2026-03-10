import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const CATEGORY_ICONS = {
  'Beads & Jewelry': '📿',
  'Wood Carvings': '🪵',
  'Textiles & Kente': '🧵',
  'Baskets & Weaving': '🧺',
  'Pottery & Ceramics': '🏺',
  'Leather Goods': '👜',
  'Paintings & Art': '🎨',
  'Musical Instruments': '🥁'
};

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [auctions, setAuctions] = useState([]);

  useEffect(() => {
    api.get('/products/featured').then(r => setFeatured(r.data.products || [])).catch(() => {});
    api.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});
    api.get('/auctions?status=active&limit=4').then(r => setAuctions(r.data.auctions || [])).catch(() => {});
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-tag">✨ Authentic Handcrafted from Aburi, Ghana</div>
            <h1>
              Discover <span className="highlight">Indigenous Crafts</span> Made With Passion
            </h1>
            <p>
              CraftConnect brings you closer to the artisans of Aburi. Shop unique handmade beads,
              carvings, kente textiles, and more — or bid in live auctions for one-of-a-kind pieces.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary btn-lg">Explore Marketplace</Link>
              <Link to="/auctions" className="btn btn-outline btn-lg">Live Auctions 🔥</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="number">500+</div>
                <div className="label">Handcrafted Products</div>
              </div>
              <div className="hero-stat">
                <div className="number">120+</div>
                <div className="label">Local Artisans</div>
              </div>
              <div className="hero-stat">
                <div className="number">50+</div>
                <div className="label">Active Auctions</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Browse by <span className="accent">Category</span></h2>
            <Link to="/products" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          <div className="categories-grid">
            {categories.map(cat => (
              <Link to={`/products?category=${cat.id}`} key={cat.id} className="category-card">
                <div className="cat-icon">{CATEGORY_ICONS[cat.name] || '🎁'}</div>
                <div className="cat-name">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Featured <span className="accent">Products</span></h2>
            <Link to="/products" className="btn btn-secondary btn-sm">See More →</Link>
          </div>
          <div className="grid grid-4">
            {featured.map(product => (
              <Link to={`/products/${product.id}`} key={product.id} className="card">
                <div className="card-image">
                  <img
                    src={product.images?.[0] || `https://placehold.co/400x300/1A1A25/D4A017?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                  />
                  <span className="card-badge new">New</span>
                </div>
                <div className="card-body">
                  <div className="card-subtitle">{product.artisan?.first_name} {product.artisan?.last_name}</div>
                  <div className="card-title">{product.name}</div>
                  <div className="card-price">GHS {parseFloat(product.price).toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
          {featured.length === 0 && (
            <div className="empty-state">
              <div className="icon">🏺</div>
              <h3>Products coming soon</h3>
              <p>Our artisans are preparing their finest crafts.</p>
            </div>
          )}
        </div>
      </section>

      {/* Live Auctions */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Live <span className="accent">Auctions</span> 🔥</h2>
            <Link to="/auctions" className="btn btn-secondary btn-sm">All Auctions →</Link>
          </div>
          <div className="grid grid-4">
            {auctions.map(auction => (
              <Link to={`/auctions/${auction.id}`} key={auction.id} className="card">
                <div className="card-image">
                  <img
                    src={auction.product?.images?.[0] || `https://placehold.co/400x300/1A1A25/CC5500?text=Auction`}
                    alt={auction.product?.name}
                  />
                  <span className="card-badge auction">🔨 Auction</span>
                </div>
                <div className="card-body">
                  <div className="card-title">{auction.product?.name || 'Auction Item'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Bid</div>
                      <div className="card-price">GHS {parseFloat(auction.current_price || auction.starting_price).toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bids</div>
                      <div style={{ fontWeight: 700, color: 'var(--terracotta)' }}>{auction.bid_count || 0}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {auctions.length === 0 && (
            <div className="empty-state">
              <div className="icon">🔨</div>
              <h3>No active auctions</h3>
              <p>Check back soon for exciting auction items.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container text-center">
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '16px' }}>
            Are You an <span style={{ color: 'var(--gold)' }}>Artisan</span>?
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 32px', fontSize: '1.05rem' }}>
            Join CraftConnect to showcase your handcrafted products to buyers worldwide. Set up auctions, manage orders, and grow your craft business.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">Start Selling Today →</Link>
        </div>
      </section>
    </>
  );
}
