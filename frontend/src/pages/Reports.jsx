import { useState, useEffect } from 'react';
import { reportAPI, studentAPI, subjectAPI, classAPI, sessionAPI } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getScoreColor, getGradeColor } from '../lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineDocumentDownload, HiOutlineDocumentText, HiOutlineUser, HiOutlineBookOpen, HiOutlineCollection } from 'react-icons/hi';

const reportTypes = [
  { key: 'student', label: 'Student Report', icon: HiOutlineUser, desc: 'Individual student performance by term' },
  { key: 'class', label: 'Class Report', icon: HiOutlineCollection, desc: 'All students in a class' },
  { key: 'subject', label: 'Subject Report', icon: HiOutlineBookOpen, desc: 'Performance in a specific subject' },
  { key: 'annual', label: 'Annual Report', icon: HiOutlineDocumentText, desc: 'Full academic year summary' },
];

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('student');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [classRes, subjRes, sessRes] = await Promise.all([
          classAPI.getAll(), subjectAPI.getAll(), sessionAPI.getAll(),
        ]);
        setClasses(classRes.data.classes || []);
        setSubjects(subjRes.data.subjects || []);
        setSessions(sessRes.data.sessions || []);
      } catch {}
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      studentAPI.getAll({ class: selectedClass, limit: 500 }).then((res) => setStudents(res.data.students || [])).catch(() => {});
    }
  }, [selectedClass]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSession) params.session = selectedSession;
      if (selectedTerm) params.term = selectedTerm;

      let res;
      switch (type) {
        case 'student':
          if (!selectedStudent) { toast.error('Select a student'); setLoading(false); return; }
          res = await reportAPI.getStudentReport(selectedStudent, params);
          break;
        case 'class':
          if (!selectedClass) { toast.error('Select a class'); setLoading(false); return; }
          res = await reportAPI.getClassReport(selectedClass, params);
          break;
        case 'subject':
          if (!selectedSubject) { toast.error('Select a subject'); setLoading(false); return; }
          res = await reportAPI.getSubjectReport(selectedSubject, params);
          break;
        case 'annual':
          res = await reportAPI.getAnnualReport(params);
          break;
      }
      setReportData(res.data);
      toast.success('Report generated');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    let csv = '';
    if (type === 'student' && reportData.report) {
      csv = 'Term,Subject,Score,Grade\n';
      reportData.report.forEach((t) => t.subjects.forEach((s) => { csv += `${t.term},${s.subject},${s.score},${s.grade}\n`; }));
    } else if (type === 'class' && reportData.students) {
      csv = 'Name,Student ID,Average,GPA\n';
      reportData.students.forEach((s) => { csv += `${s.name},${s.studentIdNumber},${s.average},${s.gpa}\n`; });
    } else if (type === 'subject' && reportData.results) {
      csv = 'Student,Score,Grade\n';
      reportData.results.forEach((r) => { csv += `${r.student?.name},${r.score},${r.grade}\n`; });
    } else if (type === 'annual' && reportData.students) {
      csv = 'Name,Student ID,Overall Average,GPA\n';
      reportData.students.forEach((s) => { csv += `${s.name},${s.studentIdNumber},${s.overallAverage},${s.gpa}\n`; });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate academic reports</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {reportTypes.map((rt) => (
          <button
            key={rt.key}
            onClick={() => { setType(rt.key); setReportData(null); }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              type === rt.key
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <rt.icon className={`text-2xl mb-2 ${type === rt.key ? 'text-primary-600' : 'text-gray-400'}`} />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{rt.label}</p>
            <p className="text-xs text-gray-500 mt-1">{rt.desc}</p>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          {type === 'student' && (
            <>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="select">
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="select">
                <option value="">Select Student</option>
                {students.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </>
          )}
          {type === 'class' && (
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="select">
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          )}
          {type === 'subject' && (
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="select">
              <option value="">Select Subject</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          )}
          <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="select">
            <option value="">All Sessions</option>
            {sessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="select">
            <option value="">All Terms</option>
            <option value="First">First</option>
            <option value="Second">Second</option>
            <option value="Third">Third</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={generateReport} className="btn-primary" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && (
            <button onClick={exportCSV} className="btn-secondary">
              <HiOutlineDocumentDownload /> Export CSV
            </button>
          )}
        </div>
      </div>

      {reportData && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Report Results</h3>
          {type === 'student' && reportData.student && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Student: <strong>{reportData.student.name}</strong> ({reportData.student.studentId}) — {reportData.student.class?.name}
              </p>
              {reportData.report?.map((term) => (
                <div key={term.term} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{term.term} Term</h4>
                    <span className="text-sm">Avg: {term.average}% | GPA: {term.gpa}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 text-gray-500">Subject</th>
                        <th className="text-left py-2 text-gray-500">Score</th>
                        <th className="text-left py-2 text-gray-500">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {term.subjects.map((s, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2">{s.subject}</td>
                          <td className={`py-2 font-medium ${getScoreColor(s.score)}`}>{s.score}</td>
                          <td className="py-2"><span className={getGradeColor(s.grade)}>{s.grade}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
          {type === 'class' && reportData.students && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500">Name</th>
                    <th className="text-left py-2 text-gray-500">Student ID</th>
                    <th className="text-left py-2 text-gray-500">Average</th>
                    <th className="text-left py-2 text-gray-500">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.students.map((s) => (
                    <tr key={s.studentId} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2 text-gray-500">{s.studentIdNumber}</td>
                      <td className="py-2">{s.average}%</td>
                      <td className="py-2">{s.gpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {type === 'subject' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Average</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{reportData.average}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Highest</p>
                  <p className="text-lg font-bold text-green-600">{reportData.highest}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Pass Rate</p>
                  <p className="text-lg font-bold text-blue-600">{reportData.passRate}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl text-center">
                  <p className="text-xs text-gray-500">Students</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{reportData.totalStudents}</p>
                </div>
              </div>
              {reportData.results && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 text-gray-500">Student</th>
                        <th className="text-left py-2 text-gray-500">Score</th>
                        <th className="text-left py-2 text-gray-500">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.results.map((r) => (
                        <tr key={r._id} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2">{r.student?.name}</td>
                          <td className={`py-2 font-medium ${getScoreColor(r.score)}`}>{r.score}</td>
                          <td className="py-2"><span className={getGradeColor(r.grade)}>{r.grade}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {type === 'annual' && reportData.students && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500">Name</th>
                    <th className="text-left py-2 text-gray-500">Student ID</th>
                    <th className="text-left py-2 text-gray-500">Overall Average</th>
                    <th className="text-left py-2 text-gray-500">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.students.map((s) => (
                    <tr key={s.studentId} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="py-2 text-gray-500">{s.studentIdNumber}</td>
                      <td className="py-2 font-bold">{s.overallAverage}%</td>
                      <td className="py-2">{s.gpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
