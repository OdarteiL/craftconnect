const { auth } = require('express-oauth2-jwt-bearer');
const { User } = require('../models');

const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
});

async function authenticate(req, res, next) {
  checkJwt(req, res, async (err) => {
    if (err) return next(err);
    
    try {
      const auth0Id = req.auth.payload.sub;
      let user = await User.findOne({ where: { auth0_id: auth0Id } });

      if (!user) {
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

      req.user = { id: user.id, role: user.role, email: user.email };
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  authenticate(req, res, next);
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, optionalAuth, requireRole };
