'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI } from '@/lib/api';

const emptyForm = { name: '', email: '', password: '', role: 'Member' };

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #155eef, #6366f1)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: 14,
        flexShrink: 0,
        letterSpacing: 0.5,
      }}
    >
      {initials}
    </div>
  );
}

// Slide-in panel that appears from the right for edit / password actions
function SidePanel({ title, subtitle, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(17,24,39,0.35)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          boxShadow: '-16px 0 56px rgba(17,24,39,0.14)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* header */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid #dce3ee',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#155eef', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Administration
            </p>
            <h2 style={{ marginTop: 4, fontSize: 22, fontWeight: 900, color: '#101828' }}>{title}</h2>
            {subtitle && (
              <p style={{ marginTop: 4, fontSize: 14, color: '#667085' }}>{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              minWidth: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid #dce3ee',
              background: '#fff',
              color: '#667085',
              fontWeight: 800,
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '28px' }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: 'block',
          marginBottom: 6,
          fontSize: 13,
          fontWeight: 800,
          color: '#344054',
        }}
      >
        {label}
      </label>
      {hint && (
        <p style={{ marginBottom: 8, fontSize: 12, color: '#667085' }}>{hint}</p>
      )}
      {children}
    </div>
  );
}

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    try {
      const parsedUser = userData ? JSON.parse(userData) : null;
      setCurrentUser(parsedUser);
    } catch {
      localStorage.removeItem('user');
    }
    fetchUsers();
  }, []);

  const roleCounts = useMemo(() => ({
    admins: users.filter((u) => u.role === 'Admin').length,
    members: users.filter((u) => u.role === 'Member').length,
  }), [users]);

  const filteredUsers = useMemo(() =>
    users.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setUsers(response.users);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await authAPI.createUser(form);
      setForm(emptyForm);
      toast.success(`${form.name} added to the workspace`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Unable to add user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await authAPI.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      });
      setEditingUser(null);
      toast.success('User updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Unable to update user');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (!passwordTarget) return;

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await authAPI.changeUserPassword(passwordTarget.id, newPassword);
      setPasswordTarget(null);
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password updated');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Unable to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Remove ${user.name} from the workspace? This cannot be undone.`)) return;
    try {
      await authAPI.deleteUser(user.id);
      toast.success(`${user.name} removed`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to delete user');
    }
  };

  if (currentUser && currentUser.role !== 'Admin') {
    return (
      <ProtectedRoute>
        <Navbar />
        <main className="container-custom page-shell">
          <div className="card text-center">
            <h1 className="text-2xl font-black">Access restricted</h1>
            <p className="mt-2 text-slate-600">Only admins can manage team accounts.</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container-custom page-shell">

        {/* Page header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1 className="page-title">Users</h1>
            <p className="page-subtitle">
              Manage team accounts, assign roles, and reset credentials.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card min-w-28">
              <div className="stat-value text-blue-700">{roleCounts.admins}</div>
              <div className="stat-label">Admins</div>
            </div>
            <div className="stat-card min-w-28">
              <div className="stat-value text-slate-700">{roleCounts.members}</div>
              <div className="stat-label">Members</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">

          {/* ── Add user form ─────────────────────────────── */}
          <section className="card">
            <h2 className="text-xl font-black">Add user</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a new workspace account with a temporary password.
            </p>

            <form onSubmit={handleCreateUser} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Full name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="Priya Sharma"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Email address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="priya@company.com"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Temporary password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  placeholder="Min. 6 characters"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-field"
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
                <p className="mt-1.5 text-xs text-slate-400">
                  Members can only update their assigned tasks. Admins have full access.
                </p>
              </div>

              <button type="submit" className="btn-primary w-full" disabled={saving}>
                {saving ? 'Creating...' : 'Create account'}
              </button>
            </form>
          </section>

          {/* ── Team accounts table ────────────────────────── */}
          <section className="card overflow-hidden">
            <div className="toolbar mb-4">
              <div>
                <h2 className="text-xl font-black">Team accounts</h2>
                <p className="mt-1 text-sm text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} in workspace</p>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ maxWidth: 220 }}
                placeholder="Search by name or email…"
              />
            </div>

            {loading ? (
              <div className="card-subtle text-center text-slate-500">Loading users…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="card-subtle text-center text-slate-500">
                {search ? 'No users match your search.' : 'No users yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar name={user.name} />
                            <div>
                              <div className="font-black text-slate-900">
                                {user.name}
                                {currentUser?.id === user.id && (
                                  <span
                                    style={{
                                      marginLeft: 8,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: '#155eef',
                                      background: '#eaf1ff',
                                      borderRadius: 999,
                                      padding: '2px 7px',
                                    }}
                                  >
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-pill ${user.role === 'Admin' ? 'role-admin' : 'role-member'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              className="btn-secondary text-sm"
                              onClick={() => setEditingUser({ ...user })}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-secondary text-sm"
                              onClick={() => {
                                setPasswordTarget(user);
                                setNewPassword('');
                                setConfirmNewPassword('');
                              }}
                            >
                              Reset password
                            </button>
                            <button
                              className="btn-danger text-sm"
                              onClick={() => handleDeleteUser(user)}
                              disabled={currentUser?.id === user.id}
                              title={currentUser?.id === user.id ? 'Cannot delete your own account' : ''}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* ── Edit user — slide-in panel ─────────────────── */}
        {editingUser && (
          <SidePanel
            title="Edit account"
            subtitle={`Editing — ${editingUser.email}`}
            onClose={() => setEditingUser(null)}
          >
            <form onSubmit={handleUpdateUser}>
              <FormField label="Full name">
                <input
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="input-field"
                  required
                />
              </FormField>

              <FormField label="Email address">
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="input-field"
                  required
                />
              </FormField>

              <FormField
                label="Role"
                hint="Admins have full access. Members can only update their assigned tasks."
              >
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="input-field"
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </FormField>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </SidePanel>
        )}

        {/* ── Change password — slide-in panel ──────────── */}
        {passwordTarget && (
          <SidePanel
            title="Reset password"
            subtitle={`Changing password for ${passwordTarget.name}`}
            onClose={() => {
              setPasswordTarget(null);
              setNewPassword('');
              setConfirmNewPassword('');
            }}
          >
            <div
              style={{
                marginBottom: 24,
                padding: '14px 16px',
                background: '#fff7df',
                border: '1px solid #fde68a',
                borderRadius: 8,
                fontSize: 13,
                color: '#92400e',
                fontWeight: 700,
              }}
            >
              The user will need to use this new password on their next login. Share it with them securely.
            </div>

            <form onSubmit={handlePasswordChange}>
              <FormField label="New password" hint="Must be at least 6 characters.">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </FormField>

              <FormField label="Confirm new password">
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="Repeat the password"
                  required
                />
                {confirmNewPassword && newPassword !== confirmNewPassword && (
                  <p style={{ marginTop: 6, fontSize: 12, color: '#c03221', fontWeight: 700 }}>
                    Passwords do not match
                  </p>
                )}
                {confirmNewPassword && newPassword === confirmNewPassword && (
                  <p style={{ marginTop: 6, fontSize: 12, color: '#087443', fontWeight: 700 }}>
                    ✓ Passwords match
                  </p>
                )}
              </FormField>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={saving || newPassword !== confirmNewPassword}
                >
                  {saving ? 'Updating…' : 'Update password'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setPasswordTarget(null);
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </SidePanel>
        )}

      </main>
    </ProtectedRoute>
  );
}
