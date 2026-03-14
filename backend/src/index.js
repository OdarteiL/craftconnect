const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const { sequelize, testConnection } = require('./config/db');
const { testRedis } = require('./config/redis');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const auctionRoutes = require('./routes/auctions');
const reviewRoutes = require('./routes/reviews');
const categoryRoutes = require('./routes/categories');
const { admin, buildAdminRouter } = require('./admin');

const app = express();
const PORT = process.env.PORT || 4000;

// Setup AdminJS Router
const adminRouter = buildAdminRouter(app);
app.use(admin.options.rootPath, adminRouter);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'craftconnect-api' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/reviews', reviewRoutes);
// We will deprecate custom admin routes, using AdminJS instead
// app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.status === 401 || err.code === 'invalid_token' || err.code === 'unauthorized') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
async function start() {
  try {
    console.log('Starting CraftConnect API...');
    console.log('Testing database connection...');
    await testConnection();
    console.log('Synchronizing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized');

    console.log('Testing Redis connection...');
    await testRedis();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 CraftConnect API running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

console.log('Initializing server...');
start();
