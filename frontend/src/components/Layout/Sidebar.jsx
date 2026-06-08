import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineStar,
  HiOutlineBell,
  HiOutlineShieldCheck,
  HiOutlineClipboardList,
} from 'react-icons/hi';

const teacherLinks = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
  { to: '/students', icon: HiOutlineUserGroup, label: 'Students' },
  { to: '/academic-records', icon: HiOutlineClipboardList, label: 'Academic Records' },
  { to: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
  { to: '/reports', icon: HiOutlineDocumentText, label: 'Reports' },
  { to: '/ranking', icon: HiOutlineStar, label: 'Ranking' },
  { to: '/notifications', icon: HiOutlineBell, label: 'Notifications' },
];

const adminLinks = [
  ...teacherLinks,
  { to: '/admin/users', icon: HiOutlineShieldCheck, label: 'Admin Panel' },
];

const viewerLinks = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
  { to: '/students', icon: HiOutlineUserGroup, label: 'Students' },
  { to: '/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
  { to: '/reports', icon: HiOutlineDocumentText, label: 'Reports' },
  { to: '/ranking', icon: HiOutlineStar, label: 'Ranking' },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const role = user?.role || 'teacher';
  const links = role === 'admin' ? adminLinks : role === 'viewer' ? viewerLinks : teacherLinks;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <HiOutlineAcademicCap className="text-white text-xl" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">SchoolDash</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
          </div>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-73px)]">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
              }
            >
              <link.icon className="text-xl" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
