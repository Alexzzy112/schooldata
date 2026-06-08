import { useState, useEffect } from 'react';
import { analyticsAPI, sessionAPI } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { HiOutlineStar, HiOutlineTrendingUp } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Ranking() {
  const [loading, setLoading] = useState(true);
  const [topStudents, setTopStudents] = useState([]);
  const [topClasses, setTopClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');

  useEffect(() => {
    sessionAPI.getAll().then((res) => {
      setSessions(res.data.sessions || []);
      const current = res.data.sessions?.find((s) => s.isCurrent);
      setSelectedSession(current?._id || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.getRanking({ session: selectedSession || undefined, limit: 10 });
        setTopStudents(res.data.topStudents || []);
        setTopClasses(res.data.topClasses || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [selectedSession]);

  if (loading) return <LoadingSpinner fullScreen />;

  const chartData = topStudents.slice(0, 10).map((s) => ({ name: s.name?.split(' ').slice(0, 2).join(' ') || '—', average: s.average?.toFixed(1) || 0 }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Ranking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Top performers and class rankings</p>
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
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineStar className="text-2xl text-yellow-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Top 10 Students</h3>
          </div>
          {topStudents.length > 0 ? (
            <div className="space-y-2">
              {topStudents.map((s, i) => (
                <div
                  key={s._id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    i === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                    i < 3 ? 'bg-gray-50 dark:bg-gray-900' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-500' : 'bg-primary-500/60'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.studentId} • {s.subjectCount} subjects</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary-600">{s.average?.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">Total: {s.total}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No ranking data available</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Students Chart</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="average" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <rect key={i} fill={i === 0 ? '#f59e0b' : i < 3 ? '#6366f1' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No chart data available</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineTrendingUp className="text-2xl text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Top Classes by Average Performance</h3>
        </div>
        {topClasses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topClasses.map((c, i) => (
              <div key={c._id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-primary-600">#{i + 1}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{c._id}</p>
                <p className="text-xs text-gray-500">Average: {c.average?.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No class rankings available</p>
        )}
      </div>
    </div>
  );
}
