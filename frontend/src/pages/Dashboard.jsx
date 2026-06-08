import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../lib/api';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineBadgeCheck,
  HiOutlineStar,
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, trendRes, rankingRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getTrends(),
          analyticsAPI.getRanking({ limit: 5 }),
        ]);
        setData(dashRes.data);
        setTrends(trendRes.data.trends || []);
        if (rankingRes.data.topStudents) {
          setData((prev) => ({ ...prev, topStudents: rankingRes.data.topStudents.slice(0, 3) }));
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  const topStudents = data?.topStudents || [];
  const trendData = trends
    .map((t) => ({
      session: t.session,
      average: t.subjects?.length
        ? (t.subjects.reduce((sum, s) => sum + parseFloat(s.average), 0) / t.subjects.length).toFixed(1)
        : 0,
    }))
    .slice(-6);

  const passFailData = [
    { name: 'Pass', value: data?.passRate || 0 },
    { name: 'Fail', value: data?.failRate || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of school performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={data?.totalStudents} icon={HiOutlineUserGroup} color="primary" />
        <StatCard title="Total Classes" value={data?.totalClasses} icon={HiOutlineBookOpen} color="success" />
        <StatCard title="Total Subjects" value={data?.totalSubjects} icon={HiOutlineAcademicCap} color="purple" />
        <StatCard title="Average Performance" value={`${data?.avgScore ?? '—'}%`} icon={HiOutlineChartBar} color="info" subtitle={`${data?.passRate ?? 0}% pass rate`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pass Rate" value={`${data?.passRate ?? 0}%`} icon={HiOutlineTrendingUp} color="success" />
        <StatCard title="Fail Rate" value={`${data?.failRate ?? 0}%`} icon={HiOutlineTrendingDown} color="danger" />
        <StatCard title="Top Class" value={data?.topClass || '—'} icon={HiOutlineBadgeCheck} color="warning" />
        <StatCard title="Best Student" value={data?.bestStudent || '—'} icon={HiOutlineStar} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Academic Trends</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="session" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No trend data available</p>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pass / Fail Ratio</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={passFailData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                {passFailData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Performing Students</h3>
            <Link to="/ranking" className="text-xs text-primary-600 hover:underline">View All</Link>
          </div>
          {topStudents.length > 0 ? (
            <div className="space-y-3">
              {topStudents.map((s, i) => (
                <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-500' : 'bg-primary-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.studentId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary-600">{s.average?.toFixed(1) || '—'}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No data available</p>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add Student', to: '/students', desc: 'Register new student' },
              { label: 'Enter Scores', to: '/academic-records', desc: 'Record exam scores' },
              { label: 'View Reports', to: '/reports', desc: 'Generate reports' },
              { label: 'Analytics', to: '/analytics', desc: 'View performance charts' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{action.label}</p>
                <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
