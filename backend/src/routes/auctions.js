const express = require('express');
const { Op } = require('sequelize');
const { Auction, Bid, Product, User, Notification } = require('../models');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { getCache, setCache, invalidateCache } = require('../services/cache');

const router = express.Router();

// GET /api/auctions
router.get('/', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = `auctions:${status}:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    // Auto-update auction statuses
    const now = new Date();
    await Auction.update(
      { status: 'active' },
      { where: { status: 'upcoming', start_time: { [Op.lte]: now }, end_time: { [Op.gt]: now } } }
    );
    await Auction.update(
      { status: 'ended' },
      { where: { status: 'active', end_time: { [Op.lte]: now } } }
    );

    const where = {};
    if (status !== 'all') where.status = status;

    const { count, rows } = await Auction.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'images', 'description'] },
        { model: User, as: 'artisan', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['end_time', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    const result = {
      auctions: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) }
    };

    await setCache(cacheKey, result, 30);
    res.json(result);
  } catch (err) {
    console.error('Auctions list error:', err);
    res.status(500).json({ error: 'Failed to fetch auctions.' });
  }
});

// GET /api/auctions/:id
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product', include: [{ model: User, as: 'artisan', attributes: ['id', 'first_name', 'last_name', 'location', 'avatar_url'] }] },
        { model: User, as: 'artisan', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: Bid,
          as: 'bids',
          include: [{ model: User, as: 'bidder', attributes: ['id', 'first_name', 'last_name'] }],
          order: [['amount', 'DESC']],
          limit: 20
        },
        { model: User, as: 'winner', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    if (!auction) return res.status(404).json({ error: 'Auction not found.' });
    res.json({ auction });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch auction.' });
  }
});

// POST /api/auctions — create auction
router.post('/', authenticate, requireRole('artisan', 'admin'), async (req, res) => {
  try {
    const { product_id, starting_price, reserve_price, start_time, end_time } = req.body;

    if (!product_id || !starting_price || !start_time || !end_time) {
      return res.status(400).json({ error: 'Product, starting price, start time, and end time are required.' });
    }

    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (req.user.role !== 'admin' && product.artisan_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const now = new Date();
    const startDate = new Date(start_time);
    const auctionStatus = startDate <= now ? 'active' : 'upcoming';

    const auction = await Auction.create({
      product_id,
      artisan_id: req.user.id,
      starting_price,
      current_price: starting_price,
      reserve_price,
      start_time,
      end_time,
      status: auctionStatus
    });

    await invalidateCache('auctions:*');
    res.status(201).json({ message: 'Auction created', auction });
  } catch (err) {
    console.error('Create auction error:', err);
    res.status(500).json({ error: 'Failed to create auction.' });
  }
});

// POST /api/auctions/:id/bid — place bid
router.post('/:id/bid', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'Bid amount is required.' });

    const auction = await Auction.findByPk(req.params.id);
    if (!auction) return res.status(404).json({ error: 'Auction not found.' });

    if (auction.status !== 'active') {
      return res.status(400).json({ error: 'Auction is not currently active.' });
    }

    if (new Date() > new Date(auction.end_time)) {
      await auction.update({ status: 'ended' });
      return res.status(400).json({ error: 'Auction has ended.' });
    }

    if (auction.artisan_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot bid on your own auction.' });
    }

    const bidAmount = parseFloat(amount);
    const currentPrice = parseFloat(auction.current_price || auction.starting_price);

    if (bidAmount <= currentPrice) {
      return res.status(400).json({ error: `Bid must be higher than current price (GHS ${currentPrice.toFixed(2)}).` });
    }

    const bid = await Bid.create({
      auction_id: auction.id,
      bidder_id: req.user.id,
      amount: bidAmount
    });

    await auction.update({
      current_price: bidAmount,
      bid_count: auction.bid_count + 1
    });

    // Notify artisan
    await Notification.create({
      user_id: auction.artisan_id,
      type: 'bid',
      title: 'New Bid Received',
      message: `A new bid of GHS ${bidAmount.toFixed(2)} was placed on your auction.`,
      link: `/auctions/${auction.id}`
    });

    await invalidateCache('auctions:*');
    res.status(201).json({ message: 'Bid placed successfully', bid, current_price: bidAmount });
  } catch (err) {
    console.error('Bid error:', err);
    res.status(500).json({ error: 'Failed to place bid.' });
  }
});

module.exports = router;
