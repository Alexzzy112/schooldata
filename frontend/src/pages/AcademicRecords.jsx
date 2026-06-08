import { useState, useEffect } from 'react';
import { resultAPI, studentAPI, subjectAPI, classAPI, sessionAPI } from '../lib/api';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineFilter } from 'react-icons/hi';
import { getScoreColor, getGradeColor } from '../lib/utils';

export default function AcademicRecords() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ class: '', subject: '', term: '', session: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ student: '', subject: '', score: '', term: 'First', session: '' });

  const fetchResults = async () => {
    try {
      const params = {};
      if (filters.subject) params.subject = filters.subject;
      if (filters.term) params.term = filters.term;
      if (filters.session) params.session = filters.session;
      if (filters.class) params.class = filters.class;
      const res = await resultAPI.getAll(params);
      setResults(res.data.results || []);
    } catch {
      toast.error('Failed to load results');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [subjRes, classRes, sessionRes] = await Promise.all([
          subjectAPI.getAll(),
          classAPI.getAll(),
          sessionAPI.getAll(),
        ]);
        setSubjects(subjRes.data.subjects || []);
        setClasses(classRes.data.classes || []);
        setSessions(sessionRes.data.sessions || []);
        const current = sessionRes.data.sessions?.find((s) => s.isCurrent);
        setFilters((f) => ({ ...f, session: current?._id || '' }));
        setForm((f) => ({ ...f, session: current?._id || '' }));
      } catch {}
    };
    init();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [filters]);

  const loadStudents = async (classId) => {
    try {
      const res = await studentAPI.getAll({ class: classId, limit: 200 });
      setStudents(res.data.students || []);
    } catch {}
  };

  const openAdd = () => {
    setEditing(null);
    const currentSession = sessions.find((s) => s.isCurrent);
    setForm({ student: '', subject: '', score: '', term: 'First', session: currentSession?._id || '' });
    setModalOpen(true);
  };

  const openEdit = (result) => {
    setEditing(result);
    setForm({
      student: result.student?._id || '',
      subject: result.subject?._id || '',
      score: result.score,
      term: result.term,
      session: result.session?._id || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resultAPI.create(form);
      toast.success(editing ? 'Score updated' : 'Score added');
      setModalOpen(false);
      fetchResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;
    try {
      await resultAPI.delete(id);
      toast.success('Result deleted');
      fetchResults();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Records</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter and manage student scores</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <HiOutlinePlus /> Enter Score
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineFilter className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={filters.class}
            onChange={(e) => setFilters({ ...filters, class: e.target.value })}
            className="select text-sm"
          >
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            className="select text-sm"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select
            value={filters.term}
            onChange={(e) => setFilters({ ...filters, term: e.target.value })}
            className="select text-sm"
          >
            <option value="">All Terms</option>
            <option value="First">First</option>
            <option value="Second">Second</option>
            <option value="Third">Third</option>
          </select>
          <select
            value={filters.session}
            onChange={(e) => setFilters({ ...filters, session: e.target.value })}
            className="select text-sm"
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Student</th>
                <th className="table-header">Subject</th>
                <th className="table-header">Score</th>
                <th className="table-header">Grade</th>
                <th className="table-header">Term</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-sm text-gray-400">No records found</td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="table-cell font-medium">{r.student?.name || '—'}</td>
                    <td className="table-cell">{r.subject?.name || '—'}</td>
                    <td className={`table-cell font-bold ${getScoreColor(r.score)}`}>{r.score}</td>
                    <td className="table-cell"><span className={getGradeColor(r.grade)}>{r.grade}</span></td>
                    <td className="table-cell">{r.term}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="btn btn-sm btn-secondary"><HiOutlinePencil /></button>
                        <button onClick={() => handleDelete(r._id)} className="btn btn-sm btn-danger"><HiOutlineTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Score' : 'Enter Score'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class (to filter students)</label>
            <select
              onChange={(e) => { if (e.target.value) loadStudents(e.target.value); }}
              className="select"
            >
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
            <select value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} className="select" required>
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
              <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="select" required>
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Score</label>
              <input type="number" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} className="input" min="0" max="100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
              <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} className="select">
                <option value="First">First</option>
                <option value="Second">Second</option>
                <option value="Third">Third</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session</label>
              <select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} className="select" required>
                <option value="">Select Session</option>
                {sessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
