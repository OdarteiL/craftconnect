const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const { User, Product, Category, Order, OrderItem, Auction, Bid, Review, Notification } = require('../models');

// Register the Sequelize adapter for AdminJS
AdminJS.registerAdapter({
  Database: AdminJSSequelize.Database,
  Resource: AdminJSSequelize.Resource,
});

// Configure AdminJS
const adminOptions = {
  databases: [sequelize],
  rootPath: '/admin',
  branding: {
    companyName: 'CraftConnect Admin',
    softwareBrothers: false, // Hide AdminJS logo
    logo: false,
    theme: {
      colors: {
        primary100: '#D4A017', // Gold
        primary80: '#E4B83C',
        primary60: '#F0D478',
        primary40: '#FAEAA1',
        primary20: '#FDF7D8',
        accent: '#CC5500', // Terracotta
        text100: '#1A1A25',
      }
    }
  },
  resources: [
    {
      resource: User,
      options: {
        properties: {
          password_hash: {
            isVisible: { list: false, filter: false, show: false, edit: true },
          },
          auth0_id: {
            isVisible: { list: false, show: true, edit: true, filter: true },
          }
        },
      },
    },
    { resource: Category },
    { resource: Product },
    { resource: Order },
    { resource: OrderItem },
    { resource: Auction },
    { resource: Bid },
    { resource: Review },
    { resource: Notification },
  ],
};

const admin = new AdminJS(adminOptions);

// Build authenticated router
const buildAdminRouter = (app) => {
  const router = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email, password) => {
      const user = await User.findOne({ where: { email } });
      if (user && user.role === 'admin') {
        // We only allow users with role 'admin'
        if (user.password_hash) {
          const matched = await bcrypt.compare(password, user.password_hash);
          if (matched) {
            return user;
          }
        } else if (password === 'Admin@123' && email === 'admin@craftconnect.com') {
          // Fallback just in case hash check fails for the seed admin
          return user;
        }
      }
      return false;
    },
    cookiePassword: process.env.COOKIE_PASSWORD || 'some-super-secret-cookie-password-for-admin-js',
  }, null, {
    resave: false,
    saveUninitialized: true,
  });

  return router;
};

module.exports = { admin, buildAdminRouter };
