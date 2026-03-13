import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1200&h=600&fit=crop',
    title: 'Handwoven Baskets',
    subtitle: 'Traditional basket weaving from Aburi artisans'
  },
  {
    image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=1200&h=600&fit=crop',
    title: 'Authentic Kente Cloth',
    subtitle: 'Vibrant textiles with rich cultural heritage'
  },
  {
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&h=600&fit=crop',
    title: 'Handcrafted Pottery',
    subtitle: 'Traditional ceramics shaped by skilled hands'
  },
  {
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=1200&h=600&fit=crop',
    title: 'Artisan Jewelry',
    subtitle: 'Unique beadwork and handmade accessories'
  }
];

const DUMMY_PRODUCTS = [
  { id: 1, name: 'Handwoven Basket Set', price: 85.00, artisan: 'Akua Mensah', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop', stock: 3 },
  { id: 2, name: 'Kente Cloth Runner', price: 120.00, artisan: 'Kwame Asante', image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400&h=400&fit=crop', stock: 8 },
  { id: 3, name: 'Clay Water Pot', price: 45.00, artisan: 'Ama Osei', image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop', stock: 12 },
  { id: 4, name: 'Beaded Necklace', price: 35.00, artisan: 'Yaa Boateng', image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&h=400&fit=crop', stock: 4 },
  { id: 5, name: 'Wood Carved Mask', price: 95.00, artisan: 'Kofi Mensah', image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=400&fit=crop', stock: 6 },
  { id: 6, name: 'Woven Table Mat Set', price: 28.00, artisan: 'Efua Darko', image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400&h=400&fit=crop', stock: 15 },
  { id: 7, name: 'Traditional Drum', price: 150.00, artisan: 'Kwabena Owusu', image: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&h=400&fit=crop', stock: 2 },
  { id: 8, name: 'Ceramic Bowl Set', price: 55.00, artisan: 'Abena Adjei', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=400&fit=crop', stock: 10 }
];

export default function HomePage() {
  const [featured, setFeatured] = useState(DUMMY_PRODUCTS);
  const [categories, setCategories] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    api.get('/products?limit=8').then(r => {
      if (r.data.products?.length > 0) setFeatured(r.data.products);
    }).catch(() => {});
    api.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});
    api.get('/auctions?status=active&limit=4').then(r => setAuctions(r.data.auctions || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <div className="homepage">
      {/* Hero Carousel */}
      <section className="hero-carousel">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="hero-overlay"></div>
            <div className="container hero-container">
              <div className="hero-text">
                <span className="hero-badge">Authentic Ghanaian Crafts</span>
                <h1 className="hero-title">{slide.title}</h1>
                <p className="hero-subtitle">{slide.subtitle}</p>
                <div className="hero-buttons">
                  <Link to="/products" className="btn btn-primary btn-hero">Shop Now</Link>
                  <Link to="/auctions" className="btn btn-outline-light btn-hero">View Auctions</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        <button className="carousel-btn prev" onClick={prevSlide}>‹</button>
        <button className="carousel-btn next" onClick={nextSlide}>›</button>
        <div className="carousel-dots">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="home-section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-scroll">
            {categories.map(cat => (
              <Link to={`/products?category=${cat.id}`} key={cat.id} className="category-item">
                <div className="category-icon-text">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="home-section bg-light">
        <div className="container">
          <div className="section-header-row">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/products" className="link-more">See all</Link>
          </div>
          <div className="products-grid">
            {featured.slice(0, 8).map(product => (
              <Link to={`/products/${product.id}`} key={product.id} className="product-card">
                <div className="product-image">
                  <img
                    src={product.images?.[0] || `https://placehold.co/300x300/2E7D32/FFF?text=${encodeURIComponent(product.name.substring(0, 15))}`}
                    alt={product.name}
                    loading="lazy"
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-artisan">by {product.artisan?.first_name || 'Artisan'}</p>
                  <div className="product-footer">
                    <span className="product-price">GHS {parseFloat(product.price).toFixed(2)}</span>
                    {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                      <span className="stock-badge">Only {product.stock_quantity} left</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      {auctions.length > 0 && (
        <section className="home-section">
          <div className="container">
            <div className="section-header-row">
              <h2 className="section-title">Live Auctions</h2>
              <Link to="/auctions" className="link-more">View all</Link>
            </div>
            <div className="auctions-grid">
              {auctions.map(auction => (
                <Link to={`/auctions/${auction.id}`} key={auction.id} className="auction-card">
                  <div className="auction-image">
                    <img
                      src={auction.product?.images?.[0] || `https://placehold.co/300x300/CC5500/FFF?text=Auction`}
                      alt={auction.product?.name}
                    />
                    <span className="auction-badge">Live Auction</span>
                  </div>
                  <div className="auction-info">
                    <h3 className="auction-name">{auction.product?.name || 'Auction Item'}</h3>
                    <div className="auction-details">
                      <div>
                        <span className="auction-label">Current Bid</span>
                        <span className="auction-price">GHS {parseFloat(auction.current_price || auction.starting_price).toFixed(2)}</span>
                      </div>
                      <div className="auction-bids">{auction.bid_count || 0} bids</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="home-section bg-light">
        <div className="container">
          <h2 className="section-title text-center">Why Shop With Us</h2>
          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-icon">✓</div>
              <h3>100% Authentic</h3>
              <p>Every item is handcrafted by verified artisans from Aburi, Ghana</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">→</div>
              <h3>Fast Delivery</h3>
              <p>Quick and secure shipping to your doorstep</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">♥</div>
              <h3>Support Artisans</h3>
              <p>Your purchase directly supports local craftspeople and their families</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon">⚡</div>
              <h3>Live Auctions</h3>
              <p>Bid on unique one-of-a-kind pieces in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="container text-center">
          <h2 className="cta-title">Are You an Artisan?</h2>
          <p className="cta-text">
            Join CraftConnect to showcase your crafts to buyers worldwide. 
            Manage products, run auctions, and grow your business.
          </p>
          <Link to="/login" className="btn btn-primary btn-hero">
            Start Selling Today
          </Link>
        </div>
      </section>
    </div>
  );
}
