import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">🏺</div>
          <span>CraftConnect</span>
        </Link>

        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          <Link to="/products" className={isActive('/products')} onClick={() => setOpen(false)}>Shop</Link>
          <Link to="/auctions" className={isActive('/auctions')} onClick={() => setOpen(false)}>Auctions</Link>

          {user && (
            <>
              <Link to="/orders" className={isActive('/orders')} onClick={() => setOpen(false)}>Orders</Link>
              {user.role === 'artisan' && (
                <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setOpen(false)}>Dashboard</Link>
              )}
              {user.role === 'admin' && (
                <a href="/admin" className={isActive('/admin')} onClick={() => setOpen(false)}>Admin</a>
              )}
            </>
          )}

          <Link to="/cart" className={`nav-cart ${isActive('/cart')}`} onClick={() => setOpen(false)}>
            🛒 Cart
            {count > 0 && <span className="badge">{count}</span>}
          </Link>

          <div className="nav-auth">
            {user ? (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px' }}>
                  Hi, {user.first_name}
                </span>
                <button onClick={() => { logout(); setOpen(false); }} className="btn btn-sm btn-outline">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`btn btn-sm btn-secondary ${isActive('/login')}`} onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className={`btn btn-sm btn-primary ${isActive('/register')}`} onClick={() => setOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
