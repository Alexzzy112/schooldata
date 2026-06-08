import express from 'express';
import { body, query } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Student from '../models/Student.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { search, class: className, session, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }
    if (className) filter.class = className;
    if (session) filter.session = session;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('class', 'name code')
        .populate('session', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Student.countDocuments(filter),
    ]);

    res.json({ students, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('class', 'name code')
      .populate('session', 'name');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post(
  '/',
  authorize('admin', 'teacher'),
  [
    body('studentId').notEmpty().trim().withMessage('Student ID is required'),
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
    body('age').isInt({ min: 1, max: 100 }).withMessage('Valid age is required'),
    body('class').notEmpty().withMessage('Class is required'),
    body('session').notEmpty().withMessage('Session is required'),
    validate,
  ],
  async (req, res) => {
    try {
      const existing = await Student.findOne({ studentId: req.body.studentId });
      if (existing) return res.status(400).json({ message: 'Student ID already exists' });
      const student = await Student.create(req.body);
      const populated = await student.populate(['class', 'session']);
      res.status(201).json({ student: populated });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.put('/:id', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(['class', 'session']);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
