import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/CraftConnect.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const close = () => setOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={close}>
          <img src={logo} alt="CraftConnect" style={{ height: '72px', width: 'auto' }} />
        </Link>

        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          {(!user || user.role === 'buyer') && (
            <>
              <Link to="/products" className={isActive('/products')} onClick={close}>Shop</Link>
              <Link to="/auctions" className={isActive('/auctions')} onClick={close}>Auctions</Link>
            </>
          )}

          {user?.role === 'artisan' && (
            <>
              <Link to="/dashboard" className={isActive('/dashboard')} onClick={close}>Dashboard</Link>
              <Link to="/products" className={isActive('/products')} onClick={close}>Shop</Link>
              <Link to="/auctions" className={isActive('/auctions')} onClick={close}>Auctions</Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link to="/admin" className={isActive('/admin')} onClick={close}>Dashboard</Link>
              <Link to="/admin/users" className={isActive('/admin/users')} onClick={close}>Users</Link>
            </>
          )}

          {user?.role === 'buyer' && (
            <Link to="/orders" className={isActive('/orders')} onClick={close}>Orders</Link>
          )}

          {(!user || user.role === 'buyer') && (
            <Link to="/cart" className={`nav-cart ${isActive('/cart')}`} onClick={close}>
              Cart {count > 0 && <span className="badge">{count}</span>}
            </Link>
          )}

          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div className="nav-auth">
            {user ? (
              <>
                <Link to="/profile" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px' }} onClick={close}>
                  {user.first_name}
                  {user.role !== 'buyer' && (
                    <span style={{ marginLeft: '4px', color: 'var(--gold)', fontSize: '0.75rem' }}>({user.role})</span>
                  )}
                </Link>
                <button onClick={() => { logout(); close(); navigate('/login'); }} className="btn btn-sm btn-outline">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => { navigate('/login'); close(); }} className="btn btn-sm btn-primary">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
