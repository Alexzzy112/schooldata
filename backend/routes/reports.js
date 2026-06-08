import express from 'express';
import { protect } from '../middleware/auth.js';
import Result from '../models/Result.js';
import Student from '../models/Student.js';

const router = express.Router();

router.use(protect);

function calculateGPA(scores) {
  if (!scores.length) return 0;
  const total = scores.reduce((a, b) => a + b, 0);
  const avg = total / scores.length;
  if (avg >= 70) return 4.0;
  if (avg >= 60) return 3.5;
  if (avg >= 50) return 3.0;
  if (avg >= 45) return 2.5;
  if (avg >= 40) return 2.0;
  return 0.0;
}

router.get('/student/:studentId', async (req, res) => {
  try {
    const { term, session } = req.query;
    const filter = { student: req.params.studentId };
    if (term) filter.term = term;
    if (session) filter.session = session;

    const student = await Student.findById(req.params.studentId).populate('class', 'name').populate('session', 'name');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const results = await Result.find(filter).populate('subject', 'name').sort({ term: 1 });

    const byTerm = {};
    results.forEach((r) => {
      if (!byTerm[r.term]) byTerm[r.term] = [];
      byTerm[r.term].push({ subject: r.subject?.name, score: r.score, grade: r.grade });
    });

    const report = Object.entries(byTerm).map(([term, subjects]) => {
      const scores = subjects.map((s) => s.score);
      return {
        term,
        subjects,
        total: scores.reduce((a, b) => a + b, 0),
        average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        gpa: calculateGPA(scores),
      };
    });

    res.json({ student, report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/class/:classId', async (req, res) => {
  try {
    const { term, session } = req.query;
    const filter = {};
    if (term) filter.term = term;
    if (session) filter.session = session;

    const students = await Student.find({ class: req.params.classId, isActive: true }).lean();
    const studentIds = students.map((s) => s._id);
    filter.student = { $in: studentIds };

    const results = await Result.find(filter).populate('student', 'name studentId').populate('subject', 'name').lean();

    const studentReports = {};
    results.forEach((r) => {
      const sid = r.student?._id?.toString();
      if (!studentReports[sid]) {
        studentReports[sid] = { name: r.student?.name, studentId: r.student?.studentId, subjects: [] };
      }
      studentReports[sid].subjects.push({ subject: r.subject?.name, score: r.score, grade: r.grade });
    });

    const classReport = Object.entries(studentReports).map(([id, data]) => {
      const scores = data.subjects.map((s) => s.score);
      return {
        studentId: id,
        name: data.name,
        studentIdNumber: data.studentId,
        subjects: data.subjects,
        average: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
        gpa: calculateGPA(scores),
      };
    });

    res.json({ className: req.params.classId, students: classReport });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/subject/:subjectId', async (req, res) => {
  try {
    const { term, session } = req.query;
    const filter = { subject: req.params.subjectId };
    if (term) filter.term = term;
    if (session) filter.session = session;

    const results = await Result.find(filter)
      .populate('student', 'name studentId class')
      .populate('subject', 'name')
      .sort({ score: -1 })
      .lean();

    const scores = results.map((r) => r.score);
    const passed = scores.filter((s) => s >= 40).length;
    const failed = scores.filter((s) => s < 40).length;

    res.json({
      subject: results[0]?.subject?.name || 'Unknown',
      totalStudents: results.length,
      average: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
      highest: scores.length ? Math.max(...scores) : 0,
      lowest: scores.length ? Math.min(...scores) : 0,
      passRate: scores.length ? ((passed / scores.length) * 100).toFixed(1) : 0,
      failRate: scores.length ? ((failed / scores.length) * 100).toFixed(1) : 0,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/annual', async (req, res) => {
  try {
    const { session } = req.query;
    const filter = {};
    if (session) filter.session = session;

    const results = await Result.find(filter)
      .populate('student', 'name studentId class')
      .populate('subject', 'name')
      .lean();

    const studentData = {};
    results.forEach((r) => {
      const sid = r.student?._id?.toString();
      if (!studentData[sid]) {
        studentData[sid] = { name: r.student?.name, studentId: r.student?.studentId, terms: {} };
      }
      if (!studentData[sid].terms[r.term]) studentData[sid].terms[r.term] = [];
      studentData[sid].terms[r.term].push(r.score);
    });

    const annualReport = Object.entries(studentData).map(([id, data]) => {
      const allScores = Object.values(data.terms).flat();
      const termAverages = Object.entries(data.terms).map(([term, scores]) => ({
        term,
        average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      }));
      return {
        studentId: id,
        name: data.name,
        studentIdNumber: data.studentId,
        termAverages,
        overallAverage: allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : 0,
        gpa: calculateGPA(allScores),
      };
    });

    res.json({ session: session || 'All', students: annualReport });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
