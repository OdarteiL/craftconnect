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
      // Create user on first login with role from metadata
      const role = req.auth.payload['https://craftconnect.com/role'] || 'buyer';
      
      user = await User.create({
        auth0_id: auth0Id,
        email: req.auth.payload.email || req.auth.payload.sub,
        first_name: req.auth.payload.given_name || 'User',
        last_name: req.auth.payload.family_name || '',
        role: ['buyer', 'artisan', 'admin'].includes(role) ? role : 'buyer',
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
    const users = await User.findAll({ 
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });
    res.json({ users });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.post('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { email, first_name, last_name, role, phone } = req.body;
    
    if (!email || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, first name, and last name are required.' });
    }

    if (!['buyer', 'artisan', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const user = await User.create({
      email,
      first_name,
      last_name,
      role,
      phone,
      is_verified: true,
      is_active: true
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    // Prevent deleting yourself
    const currentUser = await User.findOne({ where: { auth0_id: req.auth.payload.sub } });
    if (currentUser && currentUser.id === user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }
    
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
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
    res.json({ message: 'User role updated successfully', user });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

router.put('/users/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { is_active } = req.body;
    
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    await user.update({ is_active });
    res.json({ message: `User ${is_active ? 'activated' : 'deactivated'} successfully`, user });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

module.exports = router;
