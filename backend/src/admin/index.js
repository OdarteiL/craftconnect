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
          // Constrain to the app's actual valid roles (see the whitelist
          // enforced in routes/auth.js) instead of a free-text field --
          // a typo here would silently bypass every role check in the app
          // since the `role` column has no DB-level constraint.
          role: {
            availableValues: [
              { value: 'buyer', label: 'Buyer' },
              { value: 'artisan', label: 'Artisan (Seller)' },
              { value: 'admin', label: 'Admin' },
            ],
          },
          // Hidden everywhere: a raw bcrypt hash has no legitimate reason
          // to be hand-typed by an admin. Set/reset passwords via the
          // app's own auth flows (register + promote, or password reset)
          // instead of editing this field directly.
          password_hash: {
            isVisible: false,
          },
          // System-managed bookkeeping fields: useful to see on a user's
          // detail page for support/debugging, but never something an
          // admin should hand-type when creating or editing a user.
          last_login_ip: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          last_login_at: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          lock_until: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          login_attempts: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          refresh_tokens: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          password_reset_expires: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          password_reset_token: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          email_verification_expires: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          email_verification_token: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
        },
        actions: {
          // Several tables that reference users (auctions.artisan_id/
          // winner_id, bids.bidder_id, reviews.buyer_id) have no ON DELETE
          // behavior at the database level, so deleting a user with any
          // auction/bid/review history throws an unhandled
          // SequelizeForeignKeyConstraintError -- AdminJS's own delete
          // handler only catches ValidationError and re-throws everything
          // else, so this surfaced as a raw 500 with the underlying
          // Postgres error message. Deliberately not changing the FK
          // behavior to CASCADE: that would risk deleting other users'
          // bid history (e.g. every bid anyone placed on a deleted
          // artisan's auctions). The app already has an `is_active`
          // toggle built for exactly this "remove without deleting"
          // case -- point admins there instead.
          delete: {
            handler: async (request, response, context) => {
              const { record, resource, currentAdmin, h, translateMessage } = context;
              try {
                await resource.delete(request.params.recordId, context);
              } catch (error) {
                if (error.name === 'SequelizeForeignKeyConstraintError') {
                  return {
                    record: record.toJSON(currentAdmin),
                    notice: {
                      message: 'This user has related auction, bid, or review history and cannot be deleted. Deactivate the account (Is Active) instead.',
                      type: 'error',
                    },
                  };
                }
                throw error;
              }
              return {
                record: record.toJSON(currentAdmin),
                redirectUrl: h.resourceUrl({ resourceId: resource._decorated?.id() || resource.id() }),
                notice: {
                  message: translateMessage('successfullyDeleted', resource.id()),
                  type: 'success',
                },
              };
            },
          },
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
