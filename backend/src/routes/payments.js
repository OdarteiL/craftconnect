const express = require('express');
const { sequelize } = require('../config/db');
const { Order, OrderItem, CartItem, Product, Notification } = require('../models');
const { authenticate } = require('../middleware/auth');
const { initializePayment, verifyPayment, verifyWebhookSignature } = require('../services/payment');
const { sendOrderConfirmation } = require('../services/email');

const router = express.Router();

// POST /api/payments/initialize
// Creates a pending order and returns a Paystack payment URL
router.post('/initialize', authenticate, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { shipping_address, shipping_city, shipping_phone, notes } = req.body;

    if (!shipping_address) {
      await t.rollback();
      return res.status(400).json({ error: 'Shipping address is required.' });
    }

    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product, as: 'product' }]
    });

    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    // Validate stock and compute total
    let totalAmount = 0;
    const orderItemsData = [];
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({ error: `Insufficient stock for "${item.product.name}".` });
      }
      totalAmount += parseFloat(item.product.price) * item.quantity;
      orderItemsData.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price
      });
    }

    // Generate idempotent reference
    const reference = `CC-${req.user.id.slice(0, 8)}-${Date.now()}`;

    // Create order in PENDING state — not fulfilled until payment confirmed
    const order = await Order.create({
      buyer_id: req.user.id,
      total_amount: totalAmount.toFixed(2),
      shipping_address,
      shipping_city,
      shipping_phone,
      payment_method: 'paystack',
      payment_ref: reference,
      status: 'pending',
      notes
    }, { transaction: t });

    for (const item of orderItemsData) {
      await OrderItem.create({ ...item, order_id: order.id }, { transaction: t });
    }

    await t.commit();

    // Initialize Paystack transaction
    const callbackUrl = `${process.env.FRONTEND_URL}/payment/verify?reference=${reference}&order_id=${order.id}`;

    const paystack = await initializePayment({
      email: req.user.email,
      amount_ghs: totalAmount,
      reference,
      callback_url: callbackUrl,
      metadata: {
        order_id: order.id,
        buyer_id: req.user.id,
        buyer_name: `${req.user.first_name} ${req.user.last_name}`
      }
    });

    res.json({
      authorization_url: paystack.authorization_url,
      reference,
      order_id: order.id
    });
  } catch (err) {
    await t.rollback();
    console.error('Payment init error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to initialize payment.' });
  }
});

// GET /api/payments/verify?reference=xxx
// Called after user returns from Paystack — verifies and fulfills order
router.get('/verify', authenticate, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { reference } = req.query;
    if (!reference) return res.status(400).json({ error: 'Reference is required.' });

    const order = await Order.findOne({
      where: { payment_ref: reference, buyer_id: req.user.id },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Idempotency — already verified
    if (order.status !== 'pending') {
      await t.rollback();
      return res.json({ status: order.status, order_id: order.id });
    }

    const transaction = await verifyPayment(reference);

    if (transaction.status !== 'success') {
      await order.update({ status: 'cancelled' }, { transaction: t });
      await t.commit();
      return res.status(400).json({ error: 'Payment was not successful.', status: transaction.status });
    }

    // Verify amount matches (prevent tampering)
    const expectedPesewas = Math.round(parseFloat(order.total_amount) * 100);
    if (transaction.amount !== expectedPesewas) {
      await order.update({ status: 'cancelled' }, { transaction: t });
      await t.commit();
      console.error(`Amount mismatch: expected ${expectedPesewas}, got ${transaction.amount}`);
      return res.status(400).json({ error: 'Payment amount mismatch.' });
    }

    // Deduct stock and clear cart
    for (const item of order.items) {
      await item.product.decrement('stock', { by: item.quantity, transaction: t });
    }
    await CartItem.destroy({ where: { user_id: req.user.id }, transaction: t });

    await order.update({
      status: 'confirmed',
      payment_method: transaction.channel // 'mobile_money' | 'card' | 'bank'
    }, { transaction: t });

    await t.commit();

    await Notification.create({
      user_id: req.user.id,
      type: 'order',
      title: 'Payment Confirmed',
      message: `Payment for order #${order.id.slice(0, 8).toUpperCase()} confirmed via ${transaction.channel}.`,
      link: `/orders`
    });

    sendOrderConfirmation(req.user, order, order.items).catch(e => console.error('Email error:', e));

    res.json({ status: 'success', order_id: order.id });
  } catch (err) {
    await t.rollback();
    console.error('Payment verify error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to verify payment.' });
  }
});

// POST /api/payments/webhook
// Paystack server-to-server webhook — backup confirmation
// Must be raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);

  if (event.event === 'charge.success') {
    const { reference, amount, channel } = event.data;
    try {
      const order = await Order.findOne({ where: { payment_ref: reference } });
      if (order && order.status === 'pending') {
        const expectedPesewas = Math.round(parseFloat(order.total_amount) * 100);
        if (amount === expectedPesewas) {
          await order.update({ status: 'confirmed', payment_method: channel });

          // Deduct stock
          const items = await OrderItem.findAll({
            where: { order_id: order.id },
            include: [{ model: Product, as: 'product' }]
          });
          for (const item of items) {
            await item.product.decrement('stock', { by: item.quantity });
          }
          await CartItem.destroy({ where: { user_id: order.buyer_id } });

          console.log(`Webhook: order ${order.id} confirmed via ${channel}`);
        }
      }
    } catch (err) {
      console.error('Webhook processing error:', err.message);
    }
  }

  res.sendStatus(200); // Always 200 to Paystack
});

module.exports = router;
