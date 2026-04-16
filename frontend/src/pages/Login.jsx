import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  console.log(
            'Admin — admin@hmis.com / Admin@1234',
            'Doctor — doctor@hmis.com / Doctor@1234',
            'Patient — patient@hmis.com / Patient@1234'
        )
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/dashboard' : '/appointments');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white text-2xl font-bold shadow-lg">
            H
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">HMIS Portal</h1>
          <p className="mt-1 text-sm text-gray-500">Hospital Management Information System</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-6 text-lg font-medium text-gray-700">Sign in to your account</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="you@hospital.com"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600">Password</label>
              <input
                type="password" required
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full rounded-lg mt-4 bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}