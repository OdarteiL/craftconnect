const express = require('express');
const { CartItem, Product, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/cart
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Product,
        as: 'product',
        include: [{ model: User, as: 'artisan', attributes: ['id', 'first_name', 'last_name'] }]
      }],
      order: [['created_at', 'DESC']]
    });

    const total = items.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);

    res.json({ items, total: total.toFixed(2), count: items.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

// POST /api/cart
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) return res.status(400).json({ error: 'Product ID is required.' });

    const product = await Product.findByPk(product_id);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ error: 'Product not available.' });
    }

    const [item, created] = await CartItem.findOrCreate({
      where: { user_id: req.user.id, product_id },
      defaults: { quantity }
    });

    if (!created) {
      item.quantity += parseInt(quantity);
      await item.save();
    }

    res.status(created ? 201 : 200).json({ message: 'Added to cart', item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart.' });
  }
});

// PUT /api/cart/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const item = await CartItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return res.status(404).json({ error: 'Cart item not found.' });

    const { quantity } = req.body;
    if (quantity <= 0) {
      await item.destroy();
      return res.json({ message: 'Item removed from cart' });
    }

    item.quantity = quantity;
    await item.save();
    res.json({ message: 'Cart updated', item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await CartItem.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!item) return res.status(404).json({ error: 'Cart item not found.' });

    await item.destroy();
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item.' });
  }
});

// DELETE /api/cart
router.delete('/', authenticate, async (req, res) => {
  try {
    await CartItem.destroy({ where: { user_id: req.user.id } });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
});

module.exports = router;
