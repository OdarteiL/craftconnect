import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const DUMMY_PRODUCTS = {
  1: { 
    id: 1, name: 'Handwoven Basket Set', price: 85.00, stock: 3,
    artisan: { first_name: 'Akua', last_name: 'Mensah', location: 'Aburi' }, 
    images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800'], 
    category: { name: 'Baskets & Weaving' }, 
    views: 234,
    description: 'Beautiful handwoven basket set crafted from natural raffia palm. Each basket is meticulously woven by skilled artisans using traditional techniques passed down through generations. Perfect for storage, decoration, or as a unique gift.',
    story: 'These baskets are woven by Akua Mensah, a master weaver from Aburi who learned the craft from her grandmother. Each piece takes 3-4 days to complete and represents over 30 years of weaving expertise.',
    materials: ['Raffia Palm', 'Natural Dyes', 'Cotton Thread'],
    reviews: [
      { id: 1, rating: 5, comment: 'Absolutely beautiful craftsmanship! The quality is outstanding.', buyer: { first_name: 'John', last_name: 'Doe' }, created_at: '2026-03-10' },
      { id: 2, rating: 4, comment: 'Love these baskets. Great for organizing my home.', buyer: { first_name: 'Jane', last_name: 'Smith' }, created_at: '2026-03-08' }
    ]
  },
  2: { 
    id: 2, name: 'Kente Cloth Runner', price: 120.00, stock: 8,
    artisan: { first_name: 'Kwame', last_name: 'Asante', location: 'Aburi' }, 
    images: ['https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800'], 
    category: { name: 'Textiles & Kente' }, 
    views: 456,
    description: 'Authentic Kente cloth table runner featuring vibrant traditional patterns. Hand-woven on traditional looms using premium cotton threads. Each pattern tells a story and carries cultural significance.',
    story: 'Kwame Asante is a third-generation Kente weaver. This particular pattern, called "Fathia Fata Nkrumah," symbolizes beauty, excellence, and genuineness. It was originally created to honor Ghana\'s first lady.',
    materials: ['Cotton Thread', 'Silk Blend', 'Traditional Dyes'],
    reviews: [
      { id: 3, rating: 5, comment: 'The colors are even more vibrant in person! A true work of art.', buyer: { first_name: 'Sarah', last_name: 'Johnson' }, created_at: '2026-03-12' }
    ]
  },
  3: { 
    id: 3, name: 'Clay Water Pot', price: 45.00, stock: 12,
    artisan: { first_name: 'Ama', last_name: 'Osei', location: 'Aburi' }, 
    images: ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800'], 
    category: { name: 'Pottery & Ceramics' }, 
    views: 189,
    description: 'Traditional clay water pot handcrafted using ancient pottery techniques. Naturally porous clay keeps water cool and fresh. Perfect for both functional use and decorative display.',
    story: 'Ama Osei shapes each pot by hand without using a pottery wheel, following methods used by her ancestors for centuries. The clay is sourced from local riverbeds and fired in traditional kilns.',
    materials: ['Natural Clay', 'River Sand', 'Wood Ash Glaze'],
    reviews: []
  },
  4: { 
    id: 4, name: 'Beaded Necklace', price: 35.00, stock: 4,
    artisan: { first_name: 'Yaa', last_name: 'Boateng', location: 'Aburi' }, 
    images: ['https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800'], 
    category: { name: 'Beads & Jewelry' }, 
    views: 312,
    description: 'Stunning handcrafted beaded necklace featuring traditional Ghanaian glass beads. Each bead is individually made and strung with care. A statement piece that celebrates African heritage.',
    story: 'Yaa creates her beads using recycled glass, melting and shaping each one by hand. The patterns and colors are inspired by traditional Krobo bead designs that date back hundreds of years.',
    materials: ['Recycled Glass Beads', 'Cotton Cord', 'Brass Clasp'],
    reviews: [
      { id: 4, rating: 5, comment: 'Gorgeous! I get compliments every time I wear it.', buyer: { first_name: 'Emily', last_name: 'Brown' }, created_at: '2026-03-11' },
      { id: 5, rating: 5, comment: 'The craftsmanship is incredible. Worth every penny.', buyer: { first_name: 'Michael', last_name: 'Lee' }, created_at: '2026-03-09' }
    ]
  }
};

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`star ${i <= rating ? '' : 'empty'}`}>★</span>
      ))}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then(r => setProduct(r.data.product))
      .catch(() => {
        // Use dummy data
        const dummy = DUMMY_PRODUCTS[id];
        if (dummy) setProduct(dummy);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      setMessage('Please login to add items to cart.');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      setMessage('✓ Added to cart!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to add to cart.');
    }
    setAdding(false);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage('Please login to leave a review.');
      return;
    }
    if (!reviewForm.comment.trim()) {
      alert('Please write a comment for your review.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { product_id: product.id, ...reviewForm });
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
      setReviewForm({ rating: 5, comment: '' });
      setMessage('✓ Review submitted!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="page"><div className="container"><div className="loading"><div className="spinner" /></div></div></div>;
  if (!product) return <div className="page"><div className="container"><div className="empty-state"><h3>Product not found</h3></div></div></div>;

  const avgRating = product.reviews?.length > 0 
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : 0;

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '24px' }}>
          <Link to="/products" className="breadcrumb">← Back to Marketplace</Link>
        </div>

        <div className="product-detail">
          <div>
            <div className="product-gallery">
              <img
                src={product.images?.[selectedImage] || product.images?.[0] || `https://placehold.co/600x600/1A1A25/D4A017?text=${encodeURIComponent(product.name)}`}
                alt={product.name}
              />
            </div>
            {product.images?.length > 1 && (
              <div className="product-thumbnails">
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    className={selectedImage === i ? 'active' : ''}
                    onClick={() => setSelectedImage(i)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="product-info">
            {product.category && (
              <span className="product-category">{product.category.name}</span>
            )}
            <h1>{product.name}</h1>

            <div className="product-meta">
              <span>By <strong>{product.artisan?.first_name} {product.artisan?.last_name}</strong></span>
              {product.artisan?.location && <span>📍 {product.artisan.location}</span>}
              {product.reviews?.length > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Stars rating={Math.round(avgRating)} />
                  <span>({avgRating})</span>
                </span>
              )}
            </div>

            <div className="product-price-lg">GHS {parseFloat(product.price).toFixed(2)}</div>

            <div className="product-description">{product.description || 'No description available.'}</div>

            {product.story && (
              <div className="product-story">
                <h3>📖 The Story Behind This Craft</h3>
                <p>{product.story}</p>
              </div>
            )}

            {product.materials?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Materials Used</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.materials.map((m, i) => (
                    <span key={i} className="material-tag">{m}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="stock-info">
              <span className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                {product.stock > 0 ? `✓ ${product.stock} in stock` : '✕ Out of stock'}
              </span>
              {product.stock > 0 && product.stock < 5 && (
                <span className="stock-warning">⚠️ Only {product.stock} left!</span>
              )}
            </div>

            <div className="product-actions">
              {product.stock > 0 && (
                <div className="quantity-selector">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))} />
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
                </div>
              )}
              <button
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
                disabled={adding || product.stock <= 0}
              >
                {adding ? 'Adding...' : '🛒 Add to Cart'}
              </button>
            </div>

            {message && (
              <div className={`alert ${message.includes('✓') ? 'alert-success' : 'alert-info'}`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="reviews-section">
          <h2>Customer Reviews ({product.reviews?.length || 0})</h2>

          {user && (
            <div className="review-form">
              <h3>Write a Review</h3>
              <form onSubmit={handleReview}>
                <div className="form-group">
                  <label>Your Rating</label>
                  <div className="rating-selector">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span
                        key={i}
                        className={`star ${i <= reviewForm.rating ? '' : 'empty'}`}
                        onClick={() => setReviewForm(f => ({ ...f, rating: i }))}
                      >★</span>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Your Review</label>
                  <textarea
                    className="form-control"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows="4"
                  />
                </div>
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          <div className="reviews-list">
            {product.reviews?.length > 0 ? (
              product.reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar">
                      {review.buyer?.first_name?.[0]}{review.buyer?.last_name?.[0]}
                    </div>
                    <div>
                      <div className="review-name">{review.buyer?.first_name} {review.buyer?.last_name}</div>
                      <Stars rating={review.rating} />
                    </div>
                    <div className="review-date">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {review.comment && <div className="review-text">{review.comment}</div>}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
