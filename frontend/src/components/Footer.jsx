import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🏺 CraftConnect</h3>
            <p>Empowering indigenous artisans in Aburi, Ghana to showcase and sell their handcrafted products to the world. Preserving culture through digital commerce.</p>
          </div>
          <div className="footer-col">
            <h4>Marketplace</h4>
            <Link to="/products">All Products</Link>
            <Link to="/auctions">Live Auctions</Link>
            <Link to="/products?category=beads-jewelry">Beads & Jewelry</Link>
            <Link to="/products?category=textiles-kente">Textiles & Kente</Link>
          </div>
          <div className="footer-col">
            <h4>For Artisans</h4>
            <Link to="/register">Become a Seller</Link>
            <Link to="/dashboard">Seller Dashboard</Link>
            <a href="#">Seller Guide</a>
            <a href="#">Pricing</a>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Contact Us</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
        <div className="kente-border" style={{ marginBottom: '24px' }} />
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} CraftConnect. Handcrafted with ❤️ in Ghana. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
