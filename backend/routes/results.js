import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Result from '../models/Result.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { student, subject, term, session, class: className } = req.query;
    const filter = {};
    if (student) filter.student = student;
    if (subject) filter.subject = subject;
    if (term) filter.term = term;
    if (session) filter.session = session;

    let results = await Result.find(filter)
      .populate('student', 'name studentId class')
      .populate('subject', 'name code')
      .populate('session', 'name')
      .sort({ createdAt: -1 });

    if (className) {
      results = results.filter((r) => r.student?.class?.toString() === className);
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/student/:studentId', async (req, res) => {
  try {
    const results = await Result.find({ student: req.params.studentId })
      .populate('subject', 'name code')
      .populate('session', 'name')
      .sort({ term: 1 });
    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const { student, subject, score, term, session } = req.body;
    const existing = await Result.findOne({ student, subject, term, session });
    if (existing) {
      existing.score = score;
      await existing.save();
      const populated = await existing.populate(['student', 'subject', 'session']);
      return res.json({ result: populated, message: 'Score updated' });
    }
    const result = await Result.create({
      student,
      subject,
      score,
      term,
      session,
      enteredBy: req.user._id,
    });
    const populated = await result.populate(['student', 'subject', 'session']);
    res.status(201).json({ result: populated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', authorize('admin', 'teacher'), async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(req.params.id, { score: req.body.score }, { new: true, runValidators: true })
      .populate(['student', 'subject', 'session']);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json({ message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
