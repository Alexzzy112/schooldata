import { useState, useEffect } from 'react';
import { sessionAPI } from '../../lib/api';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineCalendar, HiOutlineStar } from 'react-icons/hi';
import { formatDate } from '../../lib/utils';

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', startYear: '', endYear: '' });

  const fetch = async () => {
    try { const res = await sessionAPI.getAll(); setSessions(res.data.sessions || []); }
    catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sessionAPI.create({ ...form, startYear: parseInt(form.startYear), endYear: parseInt(form.endYear) });
      toast.success('Session created');
      setModalOpen(false); setForm({ name: '', startYear: '', endYear: '' }); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const setCurrent = async (id) => {
    try { await sessionAPI.setCurrent(id); toast.success('Session set as current'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try { await sessionAPI.delete(id); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage academic sessions</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary"><HiOutlinePlus /> Add Session</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.length === 0 ? (
          <div className="card col-span-full text-center py-8 text-gray-400">No sessions</div>
        ) : (
          sessions.map((s) => (
            <div key={s._id} className={`card relative ${s.isCurrent ? 'ring-2 ring-primary-500' : ''}`}>
              {s.isCurrent && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white">
                  <HiOutlineStar className="text-sm" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{s.name}</h3>
                  <p className="text-sm text-gray-500">{s.startYear} — {s.endYear}</p>
                  <p className="text-xs text-gray-400 mt-1">Created: {formatDate(s.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {!s.isCurrent && (
                  <button onClick={() => setCurrent(s._id)} className="btn btn-sm btn-primary">Set Current</button>
                )}
                <button onClick={() => handleDelete(s._id)} className="btn btn-sm btn-danger"><HiOutlineTrash /></button>
              </div>
            </div>
          ))
        )}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Session">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Session Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. 2024/2025" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Year</label>
              <input type="number" value={form.startYear} onChange={(e) => setForm({ ...form, startYear: e.target.value })} className="input" min="2000" max="2100" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Year</label>
              <input type="number" value={form.endYear} onChange={(e) => setForm({ ...form, endYear: e.target.value })} className="input" min="2000" max="2100" required />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
