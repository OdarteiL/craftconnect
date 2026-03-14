const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendEmail } = require('../services/email');

const router = express.Router();

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function issueTokens(user) {
  const payload = { id: user.id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });
  return { accessToken, refreshToken };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, role = 'buyer', phone, location } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Email, password, first name and last name are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!['buyer', 'artisan'].includes(role)) {
      return res.status(400).json({ error: 'Role must be buyer or artisan.' });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });

    const password_hash = await bcrypt.hash(password, 12);

    // Generate email verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);

    const user = await User.create({
      email: email.toLowerCase(),
      password_hash,
      first_name,
      last_name,
      role,
      phone,
      location,
      is_verified: false,
      email_verification_token: hashedToken,
      email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Send verification email (non-blocking)
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
    sendEmail({
      to: user.email,
      subject: 'Verify your CraftConnect email',
      html: verificationEmailHtml(user.first_name, verifyUrl),
    }).catch(console.error);

    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// GET /api/auth/verify-email?token=
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token is required.' });

    const hashed = hashToken(token);
    const user = await User.findOne({
      where: {
        email_verification_token: hashed,
        email_verification_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token.' });

    await user.update({
      is_verified: true,
      email_verification_token: null,
      email_verification_expires: null,
    });

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email: email?.toLowerCase() } });

    // Always return success to prevent user enumeration
    if (!user || user.is_verified) {
      return res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    await user.update({
      email_verification_token: hashToken(rawToken),
      email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
    sendEmail({
      to: user.email,
      subject: 'Verify your CraftConnect email',
      html: verificationEmailHtml(user.first_name, verifyUrl),
    }).catch(console.error);

    res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend verification.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    // Check account lock
    if (user.lock_until && user.lock_until > new Date()) {
      const mins = Math.ceil((user.lock_until - Date.now()) / 60000);
      return res.status(429).json({ error: `Account locked. Try again in ${mins} minute(s).` });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const attempts = (user.login_attempts || 0) + 1;
      const update = { login_attempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        update.lock_until = new Date(Date.now() + LOCK_DURATION_MS);
        update.login_attempts = 0;
      }
      await user.update(update);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.', code: 'EMAIL_NOT_VERIFIED' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    const { accessToken, refreshToken } = issueTokens(user);

    // Store hashed refresh token
    const tokens = (user.refresh_tokens || []).filter(t => new Date(t.expiresAt) > new Date());
    tokens.push({
      token: hashToken(refreshToken),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      ip: req.ip,
    });

    await user.update({
      login_attempts: 0,
      lock_until: null,
      last_login_at: new Date(),
      last_login_ip: req.ip,
      refresh_tokens: tokens,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TTL_MS,
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        is_verified: user.is_verified,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token.' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await User.findByPk(payload.id);
    if (!user || !user.is_active) return res.status(401).json({ error: 'Unauthorized.' });

    const hashed = hashToken(token);
    const stored = (user.refresh_tokens || []).find(t => t.token === hashed && new Date(t.expiresAt) > new Date());
    if (!stored) return res.status(401).json({ error: 'Refresh token revoked.' });

    // Rotation: remove old, issue new
    const { accessToken, refreshToken: newRefresh } = issueTokens(user);
    const tokens = (user.refresh_tokens || [])
      .filter(t => t.token !== hashed && new Date(t.expiresAt) > new Date());
    tokens.push({
      token: hashToken(newRefresh),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      ip: req.ip,
    });

    await user.update({ refresh_tokens: tokens });

    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TTL_MS,
    });

    res.json({ accessToken });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed.' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const payload = jwt.decode(token);
      if (payload?.id) {
        const user = await User.findByPk(payload.id);
        if (user) {
          const hashed = hashToken(token);
          await user.update({
            refresh_tokens: (user.refresh_tokens || []).filter(t => t.token !== hashed),
          });
        }
      }
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out.' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    // Always same response to prevent enumeration
    const msg = 'If that email is registered, a reset link has been sent.';

    const user = await User.findOne({ where: { email: email?.toLowerCase() } });
    if (!user) return res.json({ message: msg });

    const rawToken = crypto.randomBytes(64).toString('hex');
    await user.update({
      password_reset_token: hashToken(rawToken),
      password_reset_expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    sendEmail({
      to: user.email,
      subject: 'Reset your CraftConnect password',
      html: resetPasswordEmailHtml(user.first_name, resetUrl),
    }).catch(console.error);

    res.json({ message: msg });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const hashed = hashToken(token);
    const user = await User.findOne({
      where: {
        password_reset_token: hashed,
        password_reset_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token.' });

    await user.update({
      password_hash: await bcrypt.hash(password, 12),
      password_reset_token: null,
      password_reset_expires: null,
      refresh_tokens: [], // invalidate all sessions
    });

    res.clearCookie('refreshToken');
    sendEmail({
      to: user.email,
      subject: 'Your CraftConnect password was changed',
      html: passwordChangedEmailHtml(user.first_name),
    }).catch(console.error);

    res.json({ message: 'Password reset successful. Please log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'email_verification_token', 'email_verification_expires', 'password_reset_token', 'password_reset_expires', 'refresh_tokens', 'login_attempts', 'lock_until'] },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { first_name, last_name, phone, bio, location, avatar_url } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    await user.update({ first_name, last_name, phone, bio, location, avatar_url });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords are required.' });
    if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    const user = await User.findByPk(req.user.id);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    await user.update({
      password_hash: await bcrypt.hash(new_password, 12),
      refresh_tokens: [],
    });
    res.clearCookie('refreshToken');
    res.json({ message: 'Password changed. Please log in again.' });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed.' });
  }
});

// ── Admin user management ──────────────────────────────────────────────────

router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash', 'email_verification_token', 'password_reset_token', 'refresh_tokens'] },
      order: [['created_at', 'DESC']],
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

router.post('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { email, first_name, last_name, role, phone } = req.body;
    if (!email || !first_name || !last_name) return res.status(400).json({ error: 'Email, first name, and last name are required.' });
    if (!['buyer', 'artisan', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    if (await User.findOne({ where: { email } })) return res.status(400).json({ error: 'Email already exists.' });

    const user = await User.create({ email, first_name, last_name, role, phone, is_verified: true, is_active: true });
    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account.' });
    await user.destroy();
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

router.put('/users/:id/role', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['buyer', 'artisan', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    await user.update({ role });
    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

router.put('/users/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { is_active } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    await user.update({ is_active });
    res.json({ message: `User ${is_active ? 'activated' : 'deactivated'}.`, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// ── Email templates (inline, minimal) ─────────────────────────────────────

function verificationEmailHtml(name, url) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:auto">
    <h2 style="color:#D4A017">Welcome to CraftConnect, ${name}!</h2>
    <p>Please verify your email address to get started.</p>
    <a href="${url}" style="display:inline-block;padding:12px 24px;background:#D4A017;color:#000;text-decoration:none;border-radius:6px;font-weight:bold">Verify Email</a>
    <p style="color:#888;font-size:12px;margin-top:24px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
  </div>`;
}

function resetPasswordEmailHtml(name, url) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:auto">
    <h2 style="color:#D4A017">Password Reset Request</h2>
    <p>Hi ${name}, click below to reset your password. This link expires in 1 hour.</p>
    <a href="${url}" style="display:inline-block;padding:12px 24px;background:#D4A017;color:#000;text-decoration:none;border-radius:6px;font-weight:bold">Reset Password</a>
    <p style="color:#888;font-size:12px;margin-top:24px">If you didn't request this, ignore this email. Your password won't change.</p>
  </div>`;
}

function passwordChangedEmailHtml(name) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:auto">
    <h2 style="color:#D4A017">Password Changed</h2>
    <p>Hi ${name}, your CraftConnect password was successfully changed.</p>
    <p style="color:#888;font-size:12px">If you didn't do this, contact support immediately.</p>
  </div>`;
}

module.exports = router;
