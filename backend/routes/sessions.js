import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Session from '../models/Session.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ startYear: -1 });
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post(
  '/',
  authorize('admin'),
  [
    body('name').notEmpty().trim().withMessage('Session name is required'),
    body('startYear').isInt().withMessage('Start year is required'),
    body('endYear').isInt().withMessage('End year is required'),
    validate,
  ],
  async (req, res) => {
    try {
      const session = await Session.create(req.body);
      res.status(201).json({ session });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.put('/:id/set-current', authorize('admin'), async (req, res) => {
  try {
    await Session.updateMany({}, { isCurrent: false });
    const session = await Session.findByIdAndUpdate(req.params.id, { isCurrent: true, isActive: true }, { new: true });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
