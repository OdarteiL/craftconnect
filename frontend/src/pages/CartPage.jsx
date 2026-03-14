import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { user } = useAuth();
  const { items, total, count, updateQuantity, removeItem, clearCart } = useCart();

  if (!user) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="icon">🛒</div>
            <h3>Please login to view your cart</h3>
            <Link to="/login" className="btn btn-primary mt-2">Login</Link>
          </div>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="page-header">
            <h1>Shopping Cart</h1>
          </div>
          <div className="empty-state">
            <div className="icon">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Start exploring our marketplace for unique handcrafted products.</p>
            <Link to="/products" className="btn btn-primary mt-2">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Shopping Cart</h1>
          <p>{count} item{count !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }}>
          <div>
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  <img
                    src={item.product?.images?.[0] || `https://placehold.co/80x80/1A1A25/D4A017?text=Item`}
                    alt={item.product?.name}
                  />
                </div>
                <div className="cart-item-info">
                  <h3>
                    <Link to={`/products/${item.product_id}`} style={{ color: 'var(--text-primary)' }}>
                      {item.product?.name}
                    </Link>
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    By {item.product?.artisan?.first_name} {item.product?.artisan?.last_name}
                  </div>
                  <div className="price">GHS {parseFloat(item.product?.price || 0).toFixed(2)}</div>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="btn btn-sm btn-danger" onClick={() => removeItem(item.id)}>✕</button>
                </div>
              </div>
            ))}

            <button className="btn btn-secondary btn-sm mt-2" onClick={clearCart}>Clear Cart</button>
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            {items.map(item => (
              <div key={item.id} className="cart-summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>{item.product?.name} × {item.quantity}</span>
                <span>GHS {(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="cart-summary-row cart-summary-total">
              <span>Total</span>
              <span className="amount">GHS {total}</span>
            </div>
            <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '20px' }}>
              Proceed to Checkout →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
