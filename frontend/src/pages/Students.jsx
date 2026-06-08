import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI, classAPI, sessionAPI } from '../lib/api';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ studentId: '', name: '', gender: 'Male', age: '', class: '', session: '' });

  const fetchStudents = async () => {
    try {
      const res = await studentAPI.getAll({ search, page, limit: 15 });
      setStudents(res.data.students);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [classRes, sessionRes] = await Promise.all([classAPI.getAll(), sessionAPI.getAll()]);
        setClasses(classRes.data.classes || []);
        setSessions(sessionRes.data.sessions || []);
        const currentSession = sessionRes.data.sessions?.find((s) => s.isCurrent);
        if (currentSession) {
          setForm((f) => ({ ...f, session: currentSession._id }));
        }
      } catch {}
    };
    init();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    const currentSession = sessions.find((s) => s.isCurrent);
    setForm({ studentId: '', name: '', gender: 'Male', age: '', class: classes[0]?._id || '', session: currentSession?._id || '' });
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({
      studentId: student.studentId,
      name: student.name,
      gender: student.gender,
      age: student.age,
      class: student.class?._id || '',
      session: student.session?._id || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await studentAPI.update(editing._id, form);
        toast.success('Student updated');
      } else {
        await studentAPI.create(form);
        toast.success('Student added');
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentAPI.delete(id);
      toast.success('Student deleted');
      fetchStudents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage student records</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <HiOutlinePlus className="text-lg" /> Add Student
        </button>
      </div>

      <div className="card">
        <div className="relative mb-4">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or ID..."
            className="input pl-10"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Student ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Gender</th>
                <th className="table-header">Age</th>
                <th className="table-header">Class</th>
                <th className="table-header">Session</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm text-gray-400">No students found</td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="table-cell font-mono text-xs text-gray-600 dark:text-gray-400">{s.studentId}</td>
                    <td className="table-cell">
                      <Link to={`/students/${s._id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary-600">
                        {s.name}
                      </Link>
                    </td>
                    <td className="table-cell">{s.gender}</td>
                    <td className="table-cell">{s.age}</td>
                    <td className="table-cell">{s.class?.name || '—'}</td>
                    <td className="table-cell">{s.session?.name || '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="btn btn-sm btn-secondary">
                          <HiOutlinePencil />
                        </button>
                        <button onClick={() => handleDelete(s._id)} className="btn btn-sm btn-danger">
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-sm btn-secondary">Previous</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-sm btn-secondary">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID</label>
              <input type="text" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="select">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
              <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="input" min="1" max="100" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
              <select value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className="select" required>
                <option value="">Select Class</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department (optional)</label>
            <input type="text" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input" />
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
