'use strict';
require('./telemetry'); // must be first

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Op } = require('sequelize');

const { sequelize, testConnection } = require('./config/db');
const { testRedis } = require('./config/redis');
const { Auction, Bid, User } = require('./models');
const { metricsMiddleware, register, activeAuctionsGauge } = require('./services/metrics');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const auctionRoutes = require('./routes/auctions');
const reviewRoutes = require('./routes/reviews');
const categoryRoutes = require('./routes/categories');
const paymentRoutes = require('./routes/payments');
const { admin, buildAdminRouter } = require('./admin');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
});

// Expose io to routes
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join:auction', (auctionId) => {
    socket.join(`auction:${auctionId}`);
  });
  socket.on('leave:auction', (auctionId) => {
    socket.leave(`auction:${auctionId}`);
  });
});

// Metrics middleware (before routes)
app.use(metricsMiddleware);

// Prometheus scrape endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Setup AdminJS Router
const adminRouter = buildAdminRouter(app);
app.use(admin.options.rootPath, adminRouter);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Paystack webhook needs raw body — must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'craftconnect-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.status === 401) return res.status(401).json({ error: 'Unauthorized' });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ── Auction expiry job (runs every 30s) ──────────────────────────────────────
async function processExpiredAuctions() {
  try {
    const now = new Date();

    // Activate upcoming auctions
    await Auction.update(
      { status: 'active' },
      { where: { status: 'upcoming', start_time: { [Op.lte]: now }, end_time: { [Op.gt]: now } } }
    );

    // Find active auctions that have ended
    const ended = await Auction.findAll({
      where: { status: 'active', end_time: { [Op.lte]: now } }
    });

    for (const auction of ended) {
      // Find winning bid
      const winningBid = await Bid.findOne({
        where: { auction_id: auction.id },
        order: [['amount', 'DESC']],
        include: [{ model: User, as: 'bidder', attributes: ['id', 'first_name', 'last_name', 'email'] }]
      });

      await auction.update({
        status: 'ended',
        winner_id: winningBid?.bidder_id || null
      });

      // Notify room
      io.to(`auction:${auction.id}`).emit('auction:ended', {
        auctionId: auction.id,
        winner: winningBid?.bidder || null,
        final_price: auction.current_price
      });

      console.log(`Auction ${auction.id} ended. Winner: ${winningBid?.bidder?.first_name || 'none'}`);
    }

    // Update active auctions gauge
    const activeCount = await Auction.count({ where: { status: 'active' } });
    activeAuctionsGauge.set(activeCount);
  } catch (err) {
    console.error('Auction expiry job error:', err.message);
  }
}

async function start() {
  try {
    await testConnection();
    await sequelize.sync({ alter: true });
    await testRedis();

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP not configured — emails disabled.');
    }

    // Start auction expiry job
    setInterval(processExpiredAuctions, 30 * 1000);
    processExpiredAuctions(); // run immediately on start

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`CraftConnect API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
