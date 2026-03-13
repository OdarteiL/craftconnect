import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth0();
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span>CraftConnect</span>
        </Link>

        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          <Link to="/products" className={isActive('/products')} onClick={() => setOpen(false)}>Shop</Link>
          <Link to="/auctions" className={isActive('/auctions')} onClick={() => setOpen(false)}>Auctions</Link>

          {isAuthenticated && (
            <>
              <Link to="/orders" className={isActive('/orders')} onClick={() => setOpen(false)}>Orders</Link>
              <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setOpen(false)}>Dashboard</Link>
            </>
          )}

          <Link to="/cart" className={`nav-cart ${isActive('/cart')}`} onClick={() => setOpen(false)}>
            Cart
            {count > 0 && <span className="badge">{count}</span>}
          </Link>

          <div className="nav-auth">
            {isAuthenticated ? (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px' }}>
                  Hi, {user?.name || user?.email}
                </span>
                <button onClick={() => { logout({ logoutParams: { returnTo: window.location.origin } }); setOpen(false); }} className="btn btn-sm btn-outline">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { navigate('/login'); setOpen(false); }} className="btn btn-sm btn-primary">
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
