'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      Cookies.set('token', response.token, { expires: 7 });
      localStorage.setItem('user', JSON.stringify(response.user));
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-grid">
      <section className="auth-hero">
        <div>
          <div className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
            Team delivery dashboard
          </div>
          <h1>Move projects from assigned to done.</h1>
          <p>
            Task Manage keeps projects, task owners, deadlines, and progress in one focused workspace.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="card w-full max-w-md">
          <div className="mb-8">
            <div className="brand-mark" style={{ width: 48, height: 48, fontSize: 24 }}>TM</div>
            <p className="eyebrow">Welcome back</p>
            <h1 className="page-title text-4xl">Sign in</h1>
            <p className="page-subtitle">Use your team account to open the dashboard.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Contact your admin to get workspace access.
            <br /><br />
            First time setting up?{' '}
            <a href="/signup" className="font-bold text-blue-600 hover:underline">
              Create Admin Account
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
