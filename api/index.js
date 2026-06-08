import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_dashboard';

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

import User from '../backend/models/User.js';
import Class from '../backend/models/Class.js';
import Subject from '../backend/models/Subject.js';
import Session from '../backend/models/Session.js';

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.json({ token, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.get('/api/auth/seed', async (req, res) => {
  try {
    await connectDB();
    const existing = await User.countDocuments();
    if (existing > 0) {
      return res.json({ message: 'Already has data', seeded: false });
    }
    const bcrypt = (await import('bcryptjs')).default;
    await User.create([{ username: 'admin', email: 'admin@school.com', password: 'admin123', role: 'admin' },
      { username: 'teacher', email: 'teacher@school.com', password: 'teacher123', role: 'teacher' },
      { username: 'principal', email: 'principal@school.com', password: 'principal123', role: 'viewer' }]);
    const subjects = ['Mathematics','English','Biology','Chemistry','Physics','Computer Science','History','Geography','Economics','Literature'];
    const classes = ['SS1','SS2','SS3','JSS1','JSS2','JSS3'];
    await Class.insertMany(classes.map(n => ({ name: n, code: n })));
    await Subject.insertMany(subjects.map(n => ({ name: n, code: n.substring(0,3).toUpperCase() })));
    await Session.create({ name: '2024/2025', startYear: 2024, endYear: 2025, isActive: true, isCurrent: true });
    res.json({ message: 'Database seeded', seeded: true });
  } catch (error) {
    res.status(500).json({ message: 'Seed failed', error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'School Dashboard API is running' });
});

export default app;
