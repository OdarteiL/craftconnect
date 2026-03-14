const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'buyer'
  },
  phone: DataTypes.STRING(20),
  avatar_url: DataTypes.TEXT,
  bio: DataTypes.TEXT,
  location: DataTypes.STRING(255),
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  email_verification_token: DataTypes.STRING(255),
  email_verification_expires: DataTypes.DATE,
  password_reset_token: DataTypes.STRING(255),
  password_reset_expires: DataTypes.DATE,
  refresh_tokens: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lock_until: DataTypes.DATE,
  last_login_at: DataTypes.DATE,
  last_login_ip: DataTypes.STRING(45)
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: DataTypes.TEXT,
  image_url: DataTypes.TEXT
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  artisan_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  category_id: DataTypes.UUID,
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: DataTypes.TEXT,
  story: DataTypes.TEXT,
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  materials: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'cart_items',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  buyer_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shipping_city: DataTypes.STRING(100),
  shipping_phone: DataTypes.STRING(20),
  payment_method: DataTypes.STRING(50),
  payment_ref: DataTypes.STRING(255),
  notes: DataTypes.TEXT
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Auction = sequelize.define('Auction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  artisan_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  starting_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  current_price: DataTypes.DECIMAL(10, 2),
  reserve_price: DataTypes.DECIMAL(10, 2),
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'upcoming'
  },
  winner_id: DataTypes.UUID,
  bid_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'auctions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Bid = sequelize.define('Bid', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  auction_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  bidder_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'bids',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  buyer_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  comment: DataTypes.TEXT
}, {
  tableName: 'reviews',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  link: DataTypes.STRING(500)
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

// ============================================
// ASSOCIATIONS
// ============================================

// User -> Products
User.hasMany(Product, { foreignKey: 'artisan_id', as: 'products' });
Product.belongsTo(User, { foreignKey: 'artisan_id', as: 'artisan' });

// Category -> Products
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// User -> CartItems
User.hasMany(CartItem, { foreignKey: 'user_id', as: 'cartItems' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User -> Orders
User.hasMany(Order, { foreignKey: 'buyer_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });

// Order -> OrderItems
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product -> Auctions
Product.hasOne(Auction, { foreignKey: 'product_id', as: 'auction' });
Auction.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Auction.belongsTo(User, { foreignKey: 'artisan_id', as: 'artisan' });
Auction.belongsTo(User, { foreignKey: 'winner_id', as: 'winner' });

// Auction -> Bids
Auction.hasMany(Bid, { foreignKey: 'auction_id', as: 'bids' });
Bid.belongsTo(Auction, { foreignKey: 'auction_id' });
Bid.belongsTo(User, { foreignKey: 'bidder_id', as: 'bidder' });

// Product -> Reviews
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'product_id' });
Review.belongsTo(User, { foreignKey: 'buyer_id', as: 'buyer' });

// User -> Notifications
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User, Category, Product, CartItem, Order, OrderItem,
  Auction, Bid, Review, Notification
};
