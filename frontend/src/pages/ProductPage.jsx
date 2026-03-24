import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

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
    window.scrollTo(0, 0);
    setLoading(true);
    api.get(`/products/${id}`)
      .then(r => setProduct(r.data.product))
      .catch(() => {})
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
      setMessage(err.response?.data?.error || 'Failed to add to cart.');
      setTimeout(() => setMessage(''), 3000);
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(212,160,23,0.15)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                  {product.artisan?.first_name?.[0]}{product.artisan?.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {product.artisan?.first_name} {product.artisan?.last_name}
                  </div>
                  {product.artisan?.location && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {product.artisan.location}</div>
                  )}
                </div>
              </div>
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
