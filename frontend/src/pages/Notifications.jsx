import { useState, useEffect } from 'react';
import { notificationAPI } from '../lib/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { HiOutlineBell, HiOutlineCheck, HiOutlineExclamation, HiOutlineInformationCircle, HiOutlineRefresh } from 'react-icons/hi';
import { formatDate } from '../lib/utils';

const typeStyles = {
  warning: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  danger: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20',
  success: 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20',
  info: 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20',
};

const typeIcons = {
  warning: HiOutlineExclamation,
  danger: HiOutlineExclamation,
  success: HiOutlineCheck,
  info: HiOutlineInformationCircle,
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {}
  };

  const generateAlerts = async () => {
    try {
      const res = await notificationAPI.generateAlerts();
      toast.success(`Generated ${res.data.count} alerts`);
      fetchNotifications();
    } catch {
      toast.error('Failed to generate alerts');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unread > 0 ? `${unread} unread notifications` : 'No unread notifications'}
          </p>
        </div>
        <div className="flex gap-3">
          {user?.role === 'admin' && (
            <button onClick={generateAlerts} className="btn-secondary">
              <HiOutlineRefresh /> Generate Alerts
            </button>
          )}
          {unread > 0 && (
            <button onClick={handleMarkAllRead} className="btn-primary">
              <HiOutlineCheck /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="card text-center py-12">
            <HiOutlineBell className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = typeIcons[n.type] || HiOutlineInformationCircle;
            return (
              <div
                key={n._id}
                className={`${typeStyles[n.type] || typeStyles.info} rounded-xl p-4 ${
                  !n.isRead ? 'ring-1 ring-primary-500/30' : ''
                }`}
                onClick={() => handleMarkRead(n._id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    n.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    n.type === 'danger' ? 'bg-red-100 text-red-600' :
                    n.type === 'success' ? 'bg-green-100 text-green-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <Icon className="text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {n.title}
                      </h4>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{n.message}</p>
                    {n.relatedStudent && (
                      <p className="text-xs text-primary-600 mt-1">Student: {n.relatedStudent.name}</p>
                    )}
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 shrink-0" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
