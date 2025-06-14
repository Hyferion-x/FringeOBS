const express = require('express');
const router = express.Router();
const Merchandise = require('../models/Merchandise');
const authMiddleware = require('../Middlewares/Auth/authMiddleware');

// GET all merchandise
router.get('/', async (req, res) => {
  try {
    const merch = await Merchandise.find();
    res.json(merch);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch merchandise.' });
  }
});

// GET one merchandise by id
router.get('/:id', async (req, res) => {
  try {
    const merch = await Merchandise.findById(req.params.id);
    if (!merch) return res.status(404).json({ message: 'Not found.' });
    res.json(merch);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch merchandise.' });
  }
});

// CREATE merchandise (admin only)
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, price, description, images, type, sizes } = req.body;
    const merch = new Merchandise({
      name,
      price,
      description,
      images: images.map(i => i.trim()).filter(Boolean),
      type,
      sizes: type === 'clothing' ? (sizes.map(s => s.trim()).filter(Boolean)) : [],
    });
    await merch.save();
    res.status(201).json(merch);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create merchandise.' });
  }
});

// UPDATE merchandise (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, price, description, images, type, sizes } = req.body;
    const merch = await Merchandise.findById(req.params.id);
    if (!merch) return res.status(404).json({ message: 'Not found.' });
    merch.name = name;
    merch.price = price;
    merch.description = description;
    merch.images = images.map(i => i.trim()).filter(Boolean);
    merch.type = type;
    merch.sizes = type === 'clothing' ? (sizes.map(s => s.trim()).filter(Boolean)) : [];
    merch.updatedAt = new Date();
    await merch.save();
    res.json(merch);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update merchandise.' });
  }
});

// DELETE merchandise (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const merch = await Merchandise.findByIdAndDelete(req.params.id);
    if (!merch) return res.status(404).json({ message: 'Not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete merchandise.' });
  }
});

module.exports = router; 