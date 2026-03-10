import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    params.set('page', page);
    params.set('limit', 12);

    api.get(`/products?${params.toString()}`)
      .then(r => {
        setProducts(r.data.products || []);
        setPagination(r.data.pagination || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Marketplace</h1>
          <p>Explore authentic handcrafted products from Aburi's finest artisans</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </form>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '180px' }}
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '160px' }}
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
          >
            <option value="">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="popular">Most Popular</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-4">
              {products.map(product => (
                <Link to={`/products/${product.id}`} key={product.id} className="card">
                  <div className="card-image">
                    <img
                      src={product.images?.[0] || `https://placehold.co/400x300/1A1A25/D4A017?text=${encodeURIComponent(product.name)}`}
                      alt={product.name}
                    />
                  </div>
                  <div className="card-body">
                    <div className="card-subtitle">
                      {product.artisan?.first_name} {product.artisan?.last_name}
                      {product.artisan?.location && ` · ${product.artisan.location}`}
                    </div>
                    <div className="card-title">{product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="card-price">GHS {parseFloat(product.price).toFixed(2)}</div>
                      {product.category && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                          {product.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >← Previous</button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--text-muted)' }}>
                  Page {page} of {pagination.pages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                >Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
