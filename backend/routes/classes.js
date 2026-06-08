import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Class from '../models/Class.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true }).sort({ name: 1 });
    res.json({ classes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post(
  '/',
  authorize('admin'),
  [body('name').notEmpty().trim().withMessage('Class name is required'), validate],
  async (req, res) => {
    try {
      const existing = await Class.findOne({ name: req.body.name });
      if (existing) return res.status(400).json({ message: 'Class already exists' });
      const cls = await Class.create(req.body);
      res.status(201).json({ class: cls });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({ class: cls });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({ message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
