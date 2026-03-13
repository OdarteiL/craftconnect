const express = require('express');
const { Op } = require('sequelize');
const { Product, User, Category, Review } = require('../models');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { getCache, setCache, invalidateCache } = require('../services/cache');

const router = express.Router();

// GET /api/products — list with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const { search, category, min_price, max_price, sort, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const where = { status: 'active' };

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category) {
      where.category_id = category;
    }

    if (min_price) where.price = { ...where.price, [Op.gte]: parseFloat(min_price) };
    if (max_price) where.price = { ...where.price, [Op.lte]: parseFloat(max_price) };

    let order = [['created_at', 'DESC']];
    if (sort === 'price_asc') order = [['price', 'ASC']];
    if (sort === 'price_desc') order = [['price', 'DESC']];
    if (sort === 'popular') order = [['views', 'DESC']];
    if (sort === 'name') order = [['name', 'ASC']];

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: User, as: 'artisan', attributes: ['id', 'first_name', 'last_name', 'location'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order,
      limit: parseInt(limit),
      offset
    });

    const result = {
      products: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    };

    await setCache(cacheKey, result, 120);
    res.json(result);
  } catch (err) {
    console.error('Products list error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  try {
    const cached = await getCache('products:featured');
    if (cached) return res.json(cached);

    const products = await Product.findAll({
      where: { status: 'active' },
      include: [
        { model: User, as: 'artisan', attributes: ['id', 'first_name', 'last_name', 'location'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['views', 'DESC']],
      limit: 8
    });

    await setCache('products:featured', products, 300);
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured products.' });
  }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: User, as: 'artisan', attributes: ['id', 'first_name', 'last_name', 'location', 'bio', 'avatar_url'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        {
          model: Review,
          as: 'reviews',
          include: [{ model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name', 'avatar_url'] }],
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!product) return res.status(404).json({ error: 'Product not found.' });

    // Increment views
    await product.increment('views');

    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

// POST /api/products — artisan create product
router.post('/', authenticate, requireRole('artisan', 'admin'), async (req, res) => {
  try {
    const { name, description, story, price, stock, category_id, images, materials } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Product name and price are required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const product = await Product.create({
      artisan_id: req.user.id,
      category_id,
      name,
      slug,
      description,
      story,
      price,
      stock: stock || 0,
      images: images || [],
      materials: materials || []
    });

    await invalidateCache('products:*');
    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// PUT /api/products/:id
router.put('/:id', authenticate, requireRole('artisan', 'admin'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (req.user.role !== 'admin' && product.artisan_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this product.' });
    }

    const { name, description, story, price, stock, category_id, images, materials, status } = req.body;
    await product.update({ name, description, story, price, stock, category_id, images, materials, status });

    await invalidateCache('products:*');
    res.json({ message: 'Product updated', product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, requireRole('artisan', 'admin'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    if (req.user.role !== 'admin' && product.artisan_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this product.' });
    }

    await product.destroy();
    await invalidateCache('products:*');
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

module.exports = router;
