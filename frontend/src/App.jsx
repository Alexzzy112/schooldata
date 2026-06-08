import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/Layout/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';
import AcademicRecords from './pages/AcademicRecords';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Ranking from './pages/Ranking';
import Notifications from './pages/Notifications';
import AdminUsers from './pages/Admin/Users';
import AdminClasses from './pages/Admin/Classes';
import AdminSubjects from './pages/Admin/Subjects';
import AdminSessions from './pages/Admin/Sessions';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="academic-records" element={<AcademicRecords />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/classes" element={<ProtectedRoute roles={['admin']}><AdminClasses /></ProtectedRoute>} />
        <Route path="admin/subjects" element={<ProtectedRoute roles={['admin']}><AdminSubjects /></ProtectedRoute>} />
        <Route path="admin/sessions" element={<ProtectedRoute roles={['admin']}><AdminSessions /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
