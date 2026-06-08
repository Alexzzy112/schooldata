import express from 'express';
import { protect } from '../middleware/auth.js';
import Result from '../models/Result.js';
import Student from '../models/Student.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', async (req, res) => {
  try {
    const [totalStudents, totalResults, studentData, resultData] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Result.countDocuments(),
      Student.find({ isActive: true }).populate('class', 'name').lean(),
      Result.find().populate('student', 'name class').populate('subject', 'name').lean(),
    ]);

    const totalClasses = [...new Set(studentData.map((s) => s.class?.name).filter(Boolean))].length;

    const subjects = [...new Set(resultData.map((r) => r.subject?.name).filter(Boolean))];
    const totalSubjects = subjects.length;

    const scores = resultData.map((r) => r.score);
    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;

    const passed = scores.filter((s) => s >= 40).length;
    const failed = scores.filter((s) => s < 40).length;
    const passRate = scores.length ? ((passed / scores.length) * 100).toFixed(1) : 0;
    const failRate = scores.length ? ((failed / scores.length) * 100).toFixed(1) : 0;

    const classScores = {};
    resultData.forEach((r) => {
      const className = r.student?.class?.name;
      if (className) {
        if (!classScores[className]) classScores[className] = [];
        classScores[className].push(r.score);
      }
    });

    let topClass = '';
    let topClassAvg = 0;
    Object.entries(classScores).forEach(([name, scs]) => {
      const avg = scs.reduce((a, b) => a + b, 0) / scs.length;
      if (avg > topClassAvg) {
        topClassAvg = avg;
        topClass = name;
      }
    });

    const studentAverages = {};
    resultData.forEach((r) => {
      const sid = r.student?._id?.toString();
      const sname = r.student?.name;
      if (sid) {
        if (!studentAverages[sid]) studentAverages[sid] = { name: sname, scores: [] };
        studentAverages[sid].scores.push(r.score);
      }
    });

    let bestStudent = '';
    let bestAvg = 0;
    Object.entries(studentAverages).forEach(([id, data]) => {
      const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestStudent = data.name;
      }
    });

    res.json({
      totalStudents,
      totalClasses,
      totalSubjects,
      avgScore: parseFloat(avgScore),
      passRate: parseFloat(passRate),
      failRate: parseFloat(failRate),
      topClass,
      bestStudent,
      totalResults: totalResults,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/student-performance', async (req, res) => {
  try {
    const { studentId, session } = req.query;
    const filter = {};
    if (studentId) filter.student = studentId;
    if (session) filter.session = session;

    const results = await Result.find(filter)
      .populate('subject', 'name')
      .populate('student', 'name studentId')
      .sort({ term: 1 });

    const bySubject = {};
    results.forEach((r) => {
      const subj = r.subject?.name || 'Unknown';
      if (!bySubject[subj]) bySubject[subj] = [];
      bySubject[subj].push({ term: r.term, score: r.score });
    });

    res.json({ results, bySubject });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/class-performance', async (req, res) => {
  try {
    const { classId, session } = req.query;
    const filter = {};
    if (session) filter.session = session;

    const results = await Result.find(filter)
      .populate({ path: 'student', match: classId ? { class: classId } : {}, select: 'name class' })
      .populate('subject', 'name')
      .lean();

    const filtered = results.filter((r) => r.student);
    const classData = {};
    filtered.forEach((r) => {
      const subj = r.subject?.name || 'Unknown';
      if (!classData[subj]) classData[subj] = [];
      classData[subj].push(r.score);
    });

    const performance = Object.entries(classData).map(([subject, scores]) => ({
      subject,
      average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      count: scores.length,
    }));

    res.json({ performance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/subject-comparison', async (req, res) => {
  try {
    const { session } = req.query;
    const filter = {};
    if (session) filter.session = session;

    const results = await Result.find(filter).populate('subject', 'name').lean();
    const subjectScores = {};

    results.forEach((r) => {
      const name = r.subject?.name || 'Unknown';
      if (!subjectScores[name]) subjectScores[name] = [];
      subjectScores[name].push(r.score);
    });

    const comparison = Object.entries(subjectScores).map(([subject, scores]) => ({
      subject,
      average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      passRate: ((scores.filter((s) => s >= 40).length / scores.length) * 100).toFixed(1),
    }));

    res.json({ comparison });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/gender-analysis', async (req, res) => {
  try {
    const { session } = req.query;
    const filter = {};
    if (session) filter.session = session;

    const results = await Result.find(filter)
      .populate({ path: 'student', select: 'name gender' })
      .lean();

    const genderData = { Male: [], Female: [] };
    results.forEach((r) => {
      if (r.student && genderData[r.student.gender]) {
        genderData[r.student.gender].push(r.score);
      }
    });

    const analysis = Object.entries(genderData).map(([gender, scores]) => ({
      gender,
      average: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
      count: scores.length,
      passRate: scores.length ? ((scores.filter((s) => s >= 40).length / scores.length) * 100).toFixed(1) : 0,
    }));

    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const results = await Result.find()
      .populate('session', 'name startYear')
      .populate('subject', 'name')
      .lean();

    const trends = {};
    results.forEach((r) => {
      const sessionName = r.session?.name || 'Unknown';
      const subjectName = r.subject?.name || 'Unknown';
      if (!trends[sessionName]) trends[sessionName] = {};
      if (!trends[sessionName][subjectName]) trends[sessionName][subjectName] = [];
      trends[sessionName][subjectName].push(r.score);
    });

    const trendData = Object.entries(trends).map(([session, subjects]) => {
      const subjectAvgs = Object.entries(subjects).map(([name, scores]) => ({
        subject: name,
        average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      }));
      return { session, subjects: subjectAvgs };
    });

    res.json({ trends: trendData });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/ranking', async (req, res) => {
  try {
    const { session, limit = 10 } = req.query;
    const filter = {};
    if (session) filter.session = session;

    const results = await Result.find(filter).populate('student', 'name studentId class').lean();

    const studentScores = {};
    results.forEach((r) => {
      const sid = r.student?._id?.toString();
      if (sid) {
        if (!studentScores[sid]) {
          studentScores[sid] = { name: r.student.name, studentId: r.student.studentId, scores: [], subjects: new Set() };
        }
        studentScores[sid].scores.push(r.score);
        studentScores[sid].subjects.add(r.subject?.toString());
      }
    });

    const rankings = Object.entries(studentScores)
      .map(([id, data]) => ({
        _id: id,
        name: data.name,
        studentId: data.studentId,
        average: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        total: data.scores.reduce((a, b) => a + b, 0),
        subjectCount: data.subjects.size,
      }))
      .sort((a, b) => b.average - a.average);

    const topStudents = rankings.slice(0, parseInt(limit));

    const classRankings = {};
    results.forEach((r) => {
      const cid = r.student?.class?.toString();
      if (cid) {
        if (!classRankings[cid]) classRankings[cid] = { className: cid, scores: [] };
        classRankings[cid].scores.push(r.score);
      }
    });

    const topClasses = Object.entries(classRankings)
      .map(([id, data]) => ({
        _id: id,
        average: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 10);

    res.json({ topStudents, topClasses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
