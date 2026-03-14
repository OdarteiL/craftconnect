const express = require('express');
const { sequelize } = require('../config/db');
const { Order, OrderItem, CartItem, Product, User, Notification } = require('../models');
const { authenticate } = require('../middleware/auth');
const { sendOrderConfirmation } = require('../services/email');

const router = express.Router();

// POST /api/orders — place order from cart
router.post('/', authenticate, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { shipping_address, shipping_city, shipping_phone, payment_method, notes } = req.body;

    if (!shipping_address) {
      return res.status(400).json({ error: 'Shipping address is required.' });
    }

    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product, as: 'product' }]
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({ error: `Insufficient stock for ${item.product.name}.` });
      }
      const lineTotal = parseFloat(item.product.price) * item.quantity;
      totalAmount += lineTotal;
      orderItemsData.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price
      });
    }

    const order = await Order.create({
      buyer_id: req.user.id,
      total_amount: totalAmount.toFixed(2),
      shipping_address,
      shipping_city,
      shipping_phone,
      payment_method: payment_method || 'mobile_money',
      payment_ref: 'PAY-' + Date.now(),
      notes
    }, { transaction: t });

    for (const oid of orderItemsData) {
      await OrderItem.create({ ...oid, order_id: order.id }, { transaction: t });
    }

    // Decrease stock
    for (const item of cartItems) {
      await item.product.decrement('stock', { by: item.quantity, transaction: t });
    }

    // Clear cart
    await CartItem.destroy({ where: { user_id: req.user.id }, transaction: t });

    await t.commit();

    // Notification
    await Notification.create({
      user_id: req.user.id,
      type: 'order',
      title: 'Order Placed',
      message: `Your order #${order.id.slice(0,8)} has been placed successfully.`,
      link: `/orders/${order.id}`
    });

    // Email receipt
    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
    });
    sendOrderConfirmation(req.user, fullOrder, fullOrder.items).catch(err => console.error('Email error:', err));

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    await t.rollback();
    console.error('Order error:', err);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { buyer_id: req.user.id };

    const orders = await Order.findAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'images', 'price'] }]
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name', 'email'] },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (req.user.role !== 'admin' && order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
});

// PUT /api/orders/:id/status — admin/artisan update status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const { status } = req.body;
    const validStatuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    await order.update({ status });

    await Notification.create({
      user_id: order.buyer_id,
      type: 'order',
      title: 'Order Updated',
      message: `Your order #${order.id.slice(0,8)} status changed to ${status}.`,
      link: `/orders/${order.id}`
    });

    res.json({ message: 'Order status updated', order });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

module.exports = router;
