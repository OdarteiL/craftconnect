import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

const DUMMY_PRODUCTS = [
  { id: 1, name: 'Handwoven Basket Set', price: 85.00, artisan: { first_name: 'Akua', last_name: 'Mensah', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400'], category: { name: 'Baskets & Weaving' }, stock: 3 },
  { id: 2, name: 'Kente Cloth Runner', price: 120.00, artisan: { first_name: 'Kwame', last_name: 'Asante', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400'], category: { name: 'Textiles & Kente' }, stock: 8 },
  { id: 3, name: 'Clay Water Pot', price: 45.00, artisan: { first_name: 'Ama', last_name: 'Osei', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400'], category: { name: 'Pottery & Ceramics' }, stock: 12 },
  { id: 4, name: 'Beaded Necklace', price: 35.00, artisan: { first_name: 'Yaa', last_name: 'Boateng', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400'], category: { name: 'Beads & Jewelry' }, stock: 4 },
  { id: 5, name: 'Wood Carved Mask', price: 95.00, artisan: { first_name: 'Kofi', last_name: 'Mensah', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400'], category: { name: 'Wood Carvings' }, stock: 6 },
  { id: 6, name: 'Woven Table Mat Set', price: 28.00, artisan: { first_name: 'Efua', last_name: 'Darko', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400'], category: { name: 'Baskets & Weaving' }, stock: 15 },
  { id: 7, name: 'Traditional Drum', price: 150.00, artisan: { first_name: 'Kwabena', last_name: 'Owusu', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400'], category: { name: 'Musical Instruments' }, stock: 2 },
  { id: 8, name: 'Ceramic Bowl Set', price: 55.00, artisan: { first_name: 'Abena', last_name: 'Adjei', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400'], category: { name: 'Pottery & Ceramics' }, stock: 10 },
  { id: 9, name: 'Leather Sandals', price: 65.00, artisan: { first_name: 'Kwesi', last_name: 'Appiah', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400'], category: { name: 'Leather Goods' }, stock: 7 },
  { id: 10, name: 'Painted Canvas Art', price: 180.00, artisan: { first_name: 'Adwoa', last_name: 'Frimpong', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400'], category: { name: 'Paintings & Art' }, stock: 3 },
  { id: 11, name: 'Brass Bracelet', price: 42.00, artisan: { first_name: 'Kojo', last_name: 'Mensah', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400'], category: { name: 'Beads & Jewelry' }, stock: 9 },
  { id: 12, name: 'Woven Wall Hanging', price: 75.00, artisan: { first_name: 'Esi', last_name: 'Agyeman', location: 'Aburi' }, images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400'], category: { name: 'Textiles & Kente' }, stock: 5 }
];

const DUMMY_CATEGORIES = [
  { id: 1, name: 'Baskets & Weaving' },
  { id: 2, name: 'Textiles & Kente' },
  { id: 3, name: 'Pottery & Ceramics' },
  { id: 4, name: 'Beads & Jewelry' },
  { id: 5, name: 'Wood Carvings' },
  { id: 6, name: 'Leather Goods' },
  { id: 7, name: 'Paintings & Art' },
  { id: 8, name: 'Musical Instruments' }
];

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState(DUMMY_PRODUCTS);
  const [categories, setCategories] = useState(DUMMY_CATEGORIES);
  const [pagination, setPagination] = useState({ pages: 1, total: DUMMY_PRODUCTS.length });
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  useEffect(() => {
    // Try to fetch real data, fallback to dummy
    api.get('/categories').then(r => {
      if (r.data.categories?.length > 0) setCategories(r.data.categories);
    }).catch(() => {});
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
        if (r.data.products?.length > 0) {
          setProducts(r.data.products);
          setPagination(r.data.pagination || {});
          setLoading(false);
          return;
        }
        throw new Error('No API data');
      })
      .catch(() => {
        // Use dummy data with filters
        let filtered = [...DUMMY_PRODUCTS];
        
        // Search filter
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchLower) ||
            p.artisan.first_name.toLowerCase().includes(searchLower) ||
            p.artisan.last_name.toLowerCase().includes(searchLower)
          );
        }
        
        // Category filter
        if (category && category.trim()) {
          filtered = filtered.filter(p => p.category.name === category);
        }
        
        // Sort
        if (sort === 'price_asc') {
          filtered.sort((a, b) => a.price - b.price);
        } else if (sort === 'price_desc') {
          filtered.sort((a, b) => b.price - a.price);
        } else if (sort === 'name') {
          filtered.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        setProducts(filtered);
        setPagination({ pages: 1, total: filtered.length });
        setLoading(false);
      });
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
          <input
            type="text"
            className="form-control"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '180px' }}
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
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
                    {product.stock < 5 && (
                      <span className="card-badge stock-low">Only {product.stock} left</span>
                    )}
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
