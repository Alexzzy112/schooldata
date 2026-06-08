import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Session from '../models/Session.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }
      const token = generateToken(user._id);
      res.json({ token, user: user.toJSON() });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.post(
  '/register',
  [
    body('username').notEmpty().trim().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
  ],
  async (req, res) => {
    try {
      const { username, email, password, role } = req.body;
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      const user = await User.create({ username, email, password, role: role || 'teacher' });
      const token = generateToken(user._id);
      res.status(201).json({ token, user: user.toJSON() });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/seed', async (req, res) => {
  try {
    const existing = await User.countDocuments();
    if (existing > 0) {
      return res.json({ message: 'Database already has data', seeded: false });
    }

    await User.create({ username: 'admin', email: 'admin@school.com', password: 'admin123', role: 'admin' });
    await User.create({ username: 'teacher', email: 'teacher@school.com', password: 'teacher123', role: 'teacher' });
    await User.create({ username: 'principal', email: 'principal@school.com', password: 'principal123', role: 'viewer' });

    const subjectsList = ['Mathematics', 'English', 'Biology', 'Chemistry', 'Physics', 'Computer Science', 'History', 'Geography', 'Economics', 'Literature'];
    const classList = ['SS1', 'SS2', 'SS3', 'JSS1', 'JSS2', 'JSS3'];

    await Class.insertMany(classList.map((name) => ({ name, code: name })));
    await Subject.insertMany(subjectsList.map((name) => ({ name, code: name.substring(0, 3).toUpperCase() })));
    await Session.create({ name: '2024/2025', startYear: 2024, endYear: 2025, isActive: true, isCurrent: true });

    res.json({ message: 'Database seeded successfully', seeded: true });
  } catch (error) {
    res.status(500).json({ message: 'Seed failed', error: error.message });
  }
});

export default router;
