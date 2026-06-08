import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Notification from '../models/Notification.js';
import Student from '../models/Student.js';
import Result from '../models/Result.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') filter.recipient = req.user._id;
    const notifications = await Notification.find(filter)
      .populate('relatedStudent', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/generate-alerts', authorize('admin'), async (req, res) => {
  try {
    const results = await Result.find()
      .populate('student', 'name studentId')
      .populate('subject', 'name')
      .lean();

    const lowPerforming = results.filter((r) => r.score < 40);
    const alertPromises = lowPerforming.slice(0, 10).map((r) =>
      Notification.create({
        title: 'Low Performance Alert',
        message: `${r.student?.name} scored ${r.score} in ${r.subject?.name}`,
        type: 'warning',
        category: 'performance',
        relatedStudent: r.student?._id,
      })
    );

    await Promise.all(alertPromises);
    res.json({ message: `Generated ${alertPromises.length} alerts`, count: alertPromises.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
