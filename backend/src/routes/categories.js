const express = require('express');
const { Category } = require('../models');
const { getCache, setCache } = require('../services/cache');

const router = express.Router();

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const cached = await getCache('categories:all');
    if (cached) return res.json(cached);

    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    const result = { categories };
    await setCache('categories:all', result, 600);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

module.exports = router;
