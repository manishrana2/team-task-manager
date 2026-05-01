'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { profileAPI } from '@/lib/api';
import Cookies from 'js-cookie';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setName(parsed.name || '');
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      const payload = { name };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const response = await profileAPI.updateProfile(payload);

      // update local storage so navbar shows new name immediately
      const updatedUser = { ...user, name: response.user.name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container-custom page-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="page-title">Your profile</h1>
            <p className="page-subtitle">Update your display name or change your password.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-black mb-1">Account details</h2>
            <p className="text-sm text-slate-500 mb-6">Your role cannot be changed here — contact an admin.</p>

            {user && (
              <div className="mb-6 card-subtle">
                <p className="text-sm font-bold text-slate-500">Email</p>
                <p className="font-black mt-1">{user.email}</p>
                <p className="text-sm font-bold text-slate-500 mt-3">Role</p>
                <span className={`role-pill mt-1 ${user.role === 'Admin' ? 'role-admin' : 'role-member'}`}>
                  {user.role}
                </span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Display name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <hr className="border-slate-200" />

              <p className="text-sm font-bold text-slate-500">Change password (optional)</p>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="Repeat new password"
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-black mb-4">Account info</h2>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="text-2xl">🔐</span>
                <div>
                  <p className="font-black">Passwords are hashed</p>
                  <p className="text-slate-500 mt-0.5">Your password is stored securely using bcrypt — never in plain text.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-2xl">🪪</span>
                <div>
                  <p className="font-black">Sessions expire in 7 days</p>
                  <p className="text-slate-500 mt-0.5">You'll be logged out automatically after your session expires.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <p className="font-black">Role-based access</p>
                  <p className="text-slate-500 mt-0.5">Your role controls what you can see and do across the workspace.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
