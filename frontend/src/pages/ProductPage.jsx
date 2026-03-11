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
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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
      await addToCart(product.id);
      setMessage('Added to cart! ✓');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to add to cart.');
    }
    setAdding(false);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!reviewForm.comment.trim()) {
      alert('Please write a comment for your review.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { product_id: product.id, ...reviewForm });
      // Refresh product
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="page"><div className="container"><div className="loading"><div className="spinner" /></div></div></div>;
  if (!product) return <div className="page"><div className="container"><div className="empty-state"><h3>Product not found</h3></div></div></div>;

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '24px' }}>
          <Link to="/products" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>← Back to Marketplace</Link>
        </div>

        <div className="product-detail">
          <div className="product-gallery">
            <img
              src={product.images?.[0] || `https://placehold.co/600x600/1A1A25/D4A017?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
            />
          </div>

          <div className="product-info">
            {product.category && (
              <span style={{ fontSize: '0.8rem', color: 'var(--terracotta)', fontWeight: 500 }}>
                {product.category.name}
              </span>
            )}
            <h1>{product.name}</h1>

            <div className="product-meta">
              <span>By {product.artisan?.first_name} {product.artisan?.last_name}</span>
              {product.artisan?.location && <span>📍 {product.artisan.location}</span>}
              <span>👁 {product.views} views</span>
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
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Materials</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.materials.map((m, i) => (
                    <span key={i} style={{ padding: '4px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <span style={{ color: product.stock > 0 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                {product.stock > 0 ? `✓ ${product.stock} in stock` : '✕ Out of stock'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
                disabled={adding || product.stock <= 0}
                style={{ flex: 1 }}
              >
                {adding ? 'Adding...' : '🛒 Add to Cart'}
              </button>
            </div>

            {message && (
              <div className={`alert ${message.includes('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '16px' }}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ marginBottom: '24px' }}>Reviews ({product.reviews?.length || 0})</h2>

          {user && (
            <form onSubmit={handleReview} style={{ marginBottom: '32px' }}>
              <div className="review-card">
                <h3 style={{ marginBottom: '16px' }}>Write a Review</h3>
                <div className="form-group">
                  <label>Rating</label>
                  <div className="stars" style={{ cursor: 'pointer', fontSize: '1.5rem' }}>
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
                  <label>Comment</label>
                  <textarea
                    className="form-control"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                  />
                </div>
                <button className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

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
                  <div className="review-date" style={{ marginLeft: 'auto' }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
                {review.comment && <div className="review-text">{review.comment}</div>}
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p>No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
