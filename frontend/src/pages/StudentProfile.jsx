import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentAPI, resultAPI, reportAPI } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getScoreColor, getGradeColor } from '../lib/utils';
import { HiOutlineArrowLeft, HiOutlineUser, HiOutlineAcademicCap, HiOutlineCalendar, HiOutlineBookOpen } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [studentRes, reportRes] = await Promise.all([
          studentAPI.getById(id),
          reportAPI.getStudentReport(id),
        ]);
        setStudent(studentRes.data.student);
        setReport(reportRes.data.report || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!student) return <div className="text-center py-12 text-gray-500">Student not found</div>;

  const chartData = report.flatMap((term) =>
    term.subjects.map((s) => ({ term: term.term, subject: s.subject, score: s.score }))
  );

  return (
    <div className="space-y-6">
      <Link to="/students" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600">
        <HiOutlineArrowLeft /> Back to Students
      </Link>

      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {student.name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}</h1>
            <p className="text-sm text-gray-500">{student.studentId}</p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-3">
            <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
              <p className="text-xs text-gray-500">Class</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.class?.name || '—'}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
              <p className="text-xs text-gray-500">Session</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.session?.name || '—'}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
              <p className="text-xs text-gray-500">Gender</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.gender}</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
              <p className="text-xs text-gray-500">Age</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.age}</p>
            </div>
          </div>
        </div>
      </div>

      {report.length > 0 && (
        <>
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Performance Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="subject" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {report.map((term) => (
            <div key={term.term} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{term.term} Term</h3>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-500">Avg: <strong className="text-gray-900 dark:text-white">{term.average}%</strong></span>
                  <span className="text-gray-500">GPA: <strong className="text-gray-900 dark:text-white">{term.gpa}</strong></span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="table-header">Subject</th>
                      <th className="table-header">Score</th>
                      <th className="table-header">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {term.subjects.map((s, i) => (
                      <tr key={i}>
                        <td className="table-cell font-medium">{s.subject}</td>
                        <td className={`table-cell font-bold ${getScoreColor(s.score)}`}>{s.score}</td>
                        <td className="table-cell">
                          <span className={getGradeColor(s.grade)}>{s.grade}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}

      {report.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-400">No academic records available for this student.</p>
          <Link to="/academic-records" className="btn-primary mt-4 inline-flex">Enter Scores</Link>
        </div>
      )}
    </div>
  );
}
