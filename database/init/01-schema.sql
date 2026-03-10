-- CraftConnect Database Schema
-- PostgreSQL 16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) UNIQUE NOT NULL,
    auth0_id VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'buyer',
    phone VARCHAR(20),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artisan_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    story TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    images TEXT[] DEFAULT '{}',
    materials TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_artisan ON products(artisan_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);

-- ============================================
-- CART ITEMS
-- ============================================
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_phone VARCHAR(20),
    payment_method VARCHAR(50),
    payment_ref VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUCTIONS
-- ============================================
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    artisan_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    starting_price DECIMAL(10,2) NOT NULL CHECK (starting_price > 0),
    current_price DECIMAL(10,2),
    reserve_price DECIMAL(10,2),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming',
    winner_id UUID REFERENCES users(id),
    bid_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (end_time > start_time)
);

CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end ON auctions(end_time);

-- ============================================
-- BIDS
-- ============================================
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bids_auction ON bids(auction_id);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, buyer_id)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================
-- SEED DATA: Categories
-- ============================================
INSERT INTO categories (name, slug, description) VALUES
    ('Beads & Jewelry', 'beads-jewelry', 'Handcrafted beads, necklaces, bracelets, and traditional Ghanaian jewelry'),
    ('Wood Carvings', 'wood-carvings', 'Intricately carved wooden sculptures, masks, and decorative items'),
    ('Textiles & Kente', 'textiles-kente', 'Traditional Kente cloth, hand-woven fabrics, and textile art'),
    ('Baskets & Weaving', 'baskets-weaving', 'Hand-woven baskets, bags, and decorative woven pieces'),
    ('Pottery & Ceramics', 'pottery-ceramics', 'Traditional clay pottery, vases, bowls, and ceramic art'),
    ('Leather Goods', 'leather-goods', 'Handcrafted leather sandals, bags, belts, and accessories'),
    ('Paintings & Art', 'paintings-art', 'Original paintings, prints, and contemporary African art'),
    ('Musical Instruments', 'musical-instruments', 'Traditional drums, shakers, and handmade musical instruments');

-- ============================================
-- SEED DATA: Admin user (password: Admin@123)
-- ============================================
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES (
    'admin@craftconnect.com',
    '$2a$10$vQ.86LYGl/IDxZPa/hGCl.Gqnex9nkXgcOlKBGqIeUueyl58qwCN.',
    'System',
    'Admin',
    'admin',
    TRUE
);
