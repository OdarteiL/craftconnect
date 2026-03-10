const express = require('express');
const { Review, Product, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { product_id: req.params.productId },
      include: [{ model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']]
    });

    const avg = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ reviews, average_rating: parseFloat(avg), count: reviews.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// POST /api/reviews
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ error: 'Product ID and rating are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const existing = await Review.findOne({ where: { product_id, buyer_id: req.user.id } });
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this product.' });
    }

    const review = await Review.create({
      product_id,
      buyer_id: req.user.id,
      rating,
      comment
    });

    res.status(201).json({ message: 'Review added', review });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to add review.' });
  }
});

module.exports = router;
