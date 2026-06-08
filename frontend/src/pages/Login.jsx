import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { HiOutlineAcademicCap, HiOutlineSun, HiOutlineMoon, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

export default function Login() {
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <button onClick={toggle} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 z-10">
        {dark ? <HiOutlineSun className="text-xl text-yellow-400" /> : <HiOutlineMoon className="text-xl text-gray-600" />}
      </button>
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-900 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <HiOutlineAcademicCap className="text-5xl" />
          </div>
          <h1 className="text-4xl font-bold mb-4">School Data Dashboard</h1>
          <p className="text-lg text-primary-200 max-w-md">
            Comprehensive academic management system for tracking student performance, generating reports, and data-driven insights.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[
              { value: '10K+', label: 'Students' },
              { value: '500+', label: 'Classes' },
              { value: '98%', label: 'Uptime' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-primary-200">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HiOutlineAcademicCap className="text-3xl text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">School Data Dashboard</h1>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to your account to continue</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="admin@school.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
              </button>
            </form>
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Demo Credentials</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Admin: admin@school.com / admin123</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Teacher: teacher@school.com / teacher123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
