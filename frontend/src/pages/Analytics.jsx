import { useState, useEffect } from 'react';
import { analyticsAPI, subjectAPI, classAPI, sessionAPI } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [subjectComparison, setSubjectComparison] = useState([]);
  const [genderAnalysis, setGenderAnalysis] = useState([]);
  const [trends, setTrends] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [subjRes, sessRes] = await Promise.all([subjectAPI.getAll(), sessionAPI.getAll()]);
        setSubjects(subjRes.data.subjects || []);
        setSessions(sessRes.data.sessions || []);
        const current = sessRes.data.sessions?.find((s) => s.isCurrent);
        setSelectedSession(current?._id || '');
      } catch {}
    };
    init();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const params = selectedSession ? { session: selectedSession } : {};
        const [compRes, genderRes, trendRes] = await Promise.all([
          analyticsAPI.getSubjectComparison(params),
          analyticsAPI.getGenderAnalysis(params),
          analyticsAPI.getTrends(params),
        ]);
        setSubjectComparison(compRes.data.comparison || []);
        setGenderAnalysis(genderRes.data.analysis || []);
        setTrends(trendRes.data.trends || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedSession]);

  if (loading) return <LoadingSpinner fullScreen />;

  const trendData = trends.map((t) => ({
    session: t.session,
    ...t.subjects.reduce((acc, s) => ({ ...acc, [s.subject]: parseFloat(s.average) }), {}),
  }));

  const trendSubjects = trends[0]?.subjects?.map((s) => s.subject) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visualize and analyze academic performance</p>
        </div>
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="select w-48"
        >
          <option value="">All Sessions</option>
          {sessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Subject Comparison</h3>
          {subjectComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={subjectComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis type="category" dataKey="subject" width={90} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="average" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Average" />
                <Bar dataKey="passRate" fill="#22c55e" radius={[0, 4, 4, 0]} name="Pass Rate" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No data available</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Gender Performance Analysis</h3>
          {genderAnalysis.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={genderAnalysis}
                  cx="50%" cy="50%" outerRadius={100}
                  dataKey="average"
                  label={({ gender, average }) => `${gender}: ${average}%`}
                >
                  {genderAnalysis.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No data available</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Academic Trends</h3>
          {trendData.length > 0 && trendSubjects.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="session" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                {trendSubjects.map((subject, i) => (
                  <Area key={subject} type="monotone" dataKey={subject} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.1} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No trend data available</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Performance Distribution</h3>
          {subjectComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={subjectComparison}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={100}
                  dataKey="average"
                  label={({ subject, average }) => `${subject}: ${average}%`}
                >
                  {subjectComparison.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
