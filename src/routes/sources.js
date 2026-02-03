const express = require('express');
const router = express.Router();
const Source = require('../models/Source');

// GET /api/sources - List all sources
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    const sources = active === 'true'
      ? await Source.findActive()
      : await Source.findAll();
    res.json({ sources });
  } catch (err) {
    console.error('Error fetching sources:', err);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// GET /api/sources/:id - Get single source
router.get('/:id', async (req, res) => {
  try {
    const source = await Source.findById(req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.json({ source });
  } catch (err) {
    console.error('Error fetching source:', err);
    res.status(500).json({ error: 'Failed to fetch source' });
  }
});

module.exports = router;
