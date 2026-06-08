import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = 'mongodb+srv://students_data:Alexzzy_11@cluster0.dcfjjzb.mongodb.net/school_dashboard?appName=Cluster0';
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(MONGODB_URI).then(m => m);
  cached.conn = await cached.promise;
  return cached.conn;
}

async function getModel(name) {
  return (await import(`../backend/models/${name}.js`)).default;
}

app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const User = await getModel('User');
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid email or password' });
    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback', { expiresIn: '7d' });
    res.json({ token, user: user.toJSON() });
  } catch (e) { res.status(500).json({ message: 'Login failed', error: e.message }); }
});

app.get('/api/auth/seed', async (req, res) => {
  try {
    await connectDB();
    const [User, Class, Subject, Session] = await Promise.all([
      getModel('User'), getModel('Class'), getModel('Subject'), getModel('Session'),
    ]);
    if (await User.countDocuments() > 0) return res.json({ message: 'Already seeded' });
    await User.create([
      { username: 'admin', email: 'admin@school.com', password: 'admin123', role: 'admin' },
      { username: 'teacher', email: 'teacher@school.com', password: 'teacher123', role: 'teacher' },
      { username: 'principal', email: 'principal@school.com', password: 'principal123', role: 'viewer' },
    ]);
    await Class.insertMany(['SS1','SS2','SS3','JSS1','JSS2','JSS3'].map(n => ({ name: n, code: n })));
    await Subject.insertMany(['Mathematics','English','Biology','Chemistry','Physics','Computer Science','History','Geography','Economics','Literature'].map(n => ({ name: n, code: n.substring(0,3).toUpperCase() })));
    await Session.create({ name: '2024/2025', startYear: 2024, endYear: 2025, isActive: true, isCurrent: true });
    res.json({ message: 'Database seeded!', seeded: true });
  } catch (e) { res.status(500).json({ message: 'Seed failed', error: e.message }); }
});

app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    await connectDB();
    const [Student, Result] = await Promise.all([getModel('Student'), getModel('Result')]);
    const [totalStudents, results] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Result.find().populate('student', 'name class').populate('subject', 'name').lean(),
    ]);
    const students = await Student.find({ isActive: true }).populate('class', 'name').lean();
    const totalClasses = new Set(students.map(s => s.class?.name).filter(Boolean)).size;
    const subjects = new Set(results.map(r => r.subject?.name).filter(Boolean));
    const scores = results.map(r => r.score);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    const passed = scores.filter(s => s >= 40).length;
    const passRate = scores.length ? ((passed / scores.length) * 100).toFixed(1) : 0;
    res.json({ totalStudents, totalClasses, totalSubjects: subjects.size, avgScore: parseFloat(avg), passRate: parseFloat(passRate), failRate: parseFloat((100 - parseFloat(passRate)).toFixed(1)) });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/analytics/ranking', async (req, res) => {
  try {
    await connectDB();
    const Result = await getModel('Result');
    const results = await Result.find().populate('student', 'name studentId').lean();
    const map = {};
    results.forEach(r => { const id = r.student?._id?.toString(); if (!id) return; if (!map[id]) map[id] = { name: r.student.name, studentId: r.student.studentId, scores: [] }; map[id].scores.push(r.score); });
    const ranked = Object.entries(map).map(([id, d]) => ({ _id: id, name: d.name, studentId: d.studentId, average: d.scores.reduce((a, b) => a + b, 0) / d.scores.length })).sort((a, b) => b.average - a.average).slice(0, 10);
    res.json({ topStudents: ranked, topClasses: [] });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/analytics/subject-comparison', async (req, res) => {
  try {
    await connectDB();
    const Result = await getModel('Result');
    const results = await Result.find().populate('subject', 'name').lean();
    const map = {};
    results.forEach(r => { const name = r.subject?.name || 'Unknown'; if (!map[name]) map[name] = []; map[name].push(r.score); });
    const comparison = Object.entries(map).map(([subject, scores]) => ({ subject, average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1), passRate: ((scores.filter(s => s >= 40).length / scores.length) * 100).toFixed(1) }));
    res.json({ comparison });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/analytics/gender-analysis', async (req, res) => {
  try {
    await connectDB();
    const Result = await getModel('Result');
    const results = await Result.find().populate('student', 'gender').lean();
    const data = { Male: [], Female: [] };
    results.forEach(r => { if (r.student && data[r.student.gender]) data[r.student.gender].push(r.score); });
    const analysis = Object.entries(data).map(([gender, scores]) => ({ gender, average: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0, count: scores.length }));
    res.json({ analysis });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/analytics/trends', async (req, res) => {
  try {
    await connectDB();
    const Result = await getModel('Result');
    const results = await Result.find().populate('session', 'name').populate('subject', 'name').lean();
    const trends = {};
    results.forEach(r => { const s = r.session?.name || 'Unknown'; if (!trends[s]) trends[s] = {}; const subj = r.subject?.name || 'Unknown'; if (!trends[s][subj]) trends[s][subj] = []; trends[s][subj].push(r.score); });
    const trendData = Object.entries(trends).map(([session, subs]) => ({ session, subjects: Object.entries(subs).map(([name, scores]) => ({ subject: name, average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) })) }));
    res.json({ trends: trendData });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/students', async (req, res) => {
  try {
    await connectDB();
    const Student = await getModel('Student');
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { studentId: { $regex: search, $options: 'i' } }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [students, total] = await Promise.all([Student.find(filter).populate('class', 'name').populate('session', 'name').skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }), Student.countDocuments(filter)]);
    res.json({ students, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    await connectDB();
    const Student = await getModel('Student');
    const student = await Student.findById(req.params.id).populate('class', 'name').populate('session', 'name');
    if (!student) return res.status(404).json({ message: 'Not found' });
    res.json({ student });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.post('/api/students', async (req, res) => {
  try {
    await connectDB();
    const Student = await getModel('Student');
    const student = await Student.create(req.body);
    const p = await student.populate(['class', 'session']);
    res.status(201).json({ student: p });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    await connectDB();
    const Student = await getModel('Student');
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(['class', 'session']);
    if (!student) return res.status(404).json({ message: 'Not found' });
    res.json({ student });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await connectDB();
    const Student = await getModel('Student');
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/subjects', async (req, res) => {
  try {
    await connectDB();
    const Subject = await getModel('Subject');
    const subjects = await Subject.find({ isActive: true }).sort({ name: 1 });
    res.json({ subjects });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/classes', async (req, res) => {
  try {
    await connectDB();
    const Class = await getModel('Class');
    const classes = await Class.find({ isActive: true }).sort({ name: 1 });
    res.json({ classes });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/sessions', async (req, res) => {
  try {
    await connectDB();
    const Session = await getModel('Session');
    const sessions = await Session.find().sort({ startYear: -1 });
    res.json({ sessions });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/results', async (req, res) => {
  try {
    await connectDB();
    const Result = await getModel('Result');
    const { student, subject, term, session } = req.query;
    const filter = {};
    if (student) filter.student = student; if (subject) filter.subject = subject; if (term) filter.term = term; if (session) filter.session = session;
    const results = await Result.find(filter).populate('student', 'name studentId').populate('subject', 'name code').populate('session', 'name').sort({ createdAt: -1 });
    res.json({ results });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.post('/api/results', async (req, res) => {
  try {
    await connectDB();
    const Result = await getModel('Result');
    const { student, subject, score, term, session } = req.body;
    const existing = await Result.findOne({ student, subject, term, session });
    if (existing) { existing.score = score; await existing.save(); const p = await existing.populate(['student', 'subject', 'session']); return res.json({ result: p, message: 'Updated' }); }
    const result = await Result.create({ student, subject, score, term, session });
    const p = await result.populate(['student', 'subject', 'session']);
    res.status(201).json({ result: p });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.delete('/api/results/:id', async (req, res) => {
  try {
    await connectDB();
    const Result = await getModel('Result');
    await Result.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/reports/student/:studentId', async (req, res) => {
  try {
    await connectDB();
    const [Student, Result] = await Promise.all([getModel('Student'), getModel('Result')]);
    const { term, session } = req.query;
    const filter = { student: req.params.studentId }; if (term) filter.term = term; if (session) filter.session = session;
    const student = await Student.findById(req.params.studentId).populate('class', 'name').populate('session', 'name');
    if (!student) return res.status(404).json({ message: 'Not found' });
    const results = await Result.find(filter).populate('subject', 'name').sort({ term: 1 });
    const byTerm = {};
    results.forEach(r => { if (!byTerm[r.term]) byTerm[r.term] = []; byTerm[r.term].push({ subject: r.subject?.name, score: r.score, grade: r.grade }); });
    const report = Object.entries(byTerm).map(([term, subjects]) => { const scores = subjects.map(s => s.score); return { term, subjects, average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) }; });
    res.json({ student, report });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/reports/class/:classId', async (req, res) => {
  try {
    await connectDB();
    const [Student, Result] = await Promise.all([getModel('Student'), getModel('Result')]);
    const students = await Student.find({ class: req.params.classId, isActive: true }).lean();
    const ids = students.map(s => s._id);
    const results = await Result.find({ student: { $in: ids } }).populate('student', 'name studentId').populate('subject', 'name').lean();
    const map = {};
    results.forEach(r => { const sid = r.student?._id?.toString(); if (!map[sid]) map[sid] = { name: r.student?.name, studentId: r.student?.studentId, subjects: [] }; map[sid].subjects.push({ subject: r.subject?.name, score: r.score }); });
    const classReport = Object.entries(map).map(([id, d]) => { const scores = d.subjects.map(s => s.score); return { studentId: id, name: d.name, subjects: d.subjects, average: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0 }; });
    res.json({ students: classReport });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/notifications', async (req, res) => {
  try {
    await connectDB();
    const Notification = await getModel('Notification');
    const notifications = await Notification.find().populate('relatedStudent', 'name studentId').sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ isRead: false });
    res.json({ notifications, unreadCount });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await connectDB();
    const Notification = await getModel('Notification');
    const n = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json({ notification: n });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    await connectDB();
    const Notification = await getModel('Notification');
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'All read' });
  } catch (e) { res.status(500).json({ message: 'Error', error: e.message }); }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'School Dashboard API is running' }));
app.get('/api/debug', (req, res) => res.json({ uri: MONGODB_URI.replace(/Alexzzy_.*@/, '***@'), host: MONGODB_URI.split('@')[1] || 'none' }));
app.get('/api', (req, res) => res.json({ status: 'ok', message: 'School Dashboard API' }));

export default app;
