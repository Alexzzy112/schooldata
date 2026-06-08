import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_dashboard';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

import User from '../backend/models/User.js';
import Student from '../backend/models/Student.js';
import Subject from '../backend/models/Subject.js';
import Result from '../backend/models/Result.js';
import Class from '../backend/models/Class.js';
import Session from '../backend/models/Session.js';
import Notification from '../backend/models/Notification.js';

import authRoutes from '../backend/routes/auth.js';
import studentRoutes from '../backend/routes/students.js';
import subjectRoutes from '../backend/routes/subjects.js';
import resultRoutes from '../backend/routes/results.js';
import classRoutes from '../backend/routes/classes.js';
import sessionRoutes from '../backend/routes/sessions.js';
import analyticsRoutes from '../backend/routes/analytics.js';
import reportRoutes from '../backend/routes/reports.js';
import userRoutes from '../backend/routes/users.js';
import notificationRoutes from '../backend/routes/notifications.js';

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'School Dashboard API is running' });
});

export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
