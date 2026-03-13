const express = require('express');
const { User } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    let user = await User.findOne({ where: { auth0_id: auth0Id } });

    if (!user) {
      // Create user on first login
      user = await User.create({
        auth0_id: auth0Id,
        email: req.auth.payload.email || req.auth.payload.sub,
        first_name: req.auth.payload.given_name || 'User',
        last_name: req.auth.payload.family_name || '',
        role: 'buyer',
        is_verified: true,
        is_active: true
      });
    }

    res.json({ user });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { first_name, last_name, phone, bio, location, avatar_url } = req.body;
    
    const user = await User.findOne({ where: { auth0_id: auth0Id } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await user.update({ first_name, last_name, phone, bio, location, avatar_url });

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Profile update failed.' });
  }
});

// PUT /api/auth/role - Update user role (self-service for artisan)
router.put('/role', authenticate, async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { role } = req.body;
    
    if (!['buyer', 'artisan'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Choose buyer or artisan.' });
    }

    const user = await User.findOne({ where: { auth0_id: auth0Id } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await user.update({ role });
    res.json({ message: 'Role updated', user });
  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ error: 'Role update failed.' });
  }
});

// Admin routes
router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
    res.json({ users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

router.put('/users/:id/role', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['buyer', 'artisan', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await user.update({ role });
    res.json({ message: 'User role updated', user });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

module.exports = router;
