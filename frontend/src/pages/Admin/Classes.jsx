import { useState, useEffect } from 'react';
import { classAPI } from '../../lib/api';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineBookOpen } from 'react-icons/hi';

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const fetchClasses = async () => {
    try {
      const res = await classAPI.getAll();
      setClasses(res.data.classes || []);
    } catch { toast.error('Failed to load classes'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchClasses(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', code: '', description: '' }); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, code: c.code || '', description: c.description || '' }); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await classAPI.update(editing._id, form); toast.success('Updated'); }
      else { await classAPI.create(form); toast.success('Created'); }
      setModalOpen(false); fetchClasses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class?')) return;
    try { await classAPI.delete(id); toast.success('Deleted'); fetchClasses(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Class Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage classes</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><HiOutlinePlus /> Add Class</button>
      </div>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="table-header">Name</th>
                <th className="table-header">Code</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {classes.length === 0 ? <tr><td colSpan={3} className="text-center py-8 text-gray-400">No classes</td></tr> : classes.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="table-cell font-medium">{c.name}</td>
                  <td className="table-cell text-gray-500">{c.code || '—'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="btn btn-sm btn-secondary"><HiOutlinePencil /></button>
                      <button onClick={() => handleDelete(c._id)} className="btn btn-sm btn-danger"><HiOutlineTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" />
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
