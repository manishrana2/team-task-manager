'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI, projectAPI, taskAPI, commentAPI } from '@/lib/api';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const PRIORITY_CLASS = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' };

// Inline comment thread for a single task
function TaskComments({ task, currentUser }) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    try {
      const res = await commentAPI.getComments(task.id);
      setComments(res.comments);
    } catch {
      // silently fail — comments are optional
    }
  };

  const handleOpen = () => {
    if (!open) loadComments();
    setOpen(!open);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await commentAPI.addComment(task.id, body.trim());
      setBody('');
      loadComments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentAPI.deleteComment(task.id, commentId);
      loadComments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #edf1f7', paddingTop: 10 }}>
      <button
        onClick={handleOpen}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 800,
          color: '#667085',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>💬</span>
        {open ? 'Hide comments' : `Comments${comments.length ? ` (${comments.length})` : ''}`}
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {comments.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>No comments yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comments.map((c) => (
                <li
                  key={c.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #edf1f7',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#344054' }}>{c.user_name}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{timeAgo(c.created_at)}</span>
                    </div>
                    {(currentUser?.id === c.user_id || currentUser?.role === 'Admin') && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 11,
                          color: '#c03221',
                          fontWeight: 700,
                          padding: 0,
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p style={{ marginTop: 6, fontSize: 13, color: '#475467', lineHeight: 1.5 }}>{c.body}</p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="input-field"
              placeholder="Write a comment…"
              style={{ flex: 1, minHeight: 36, fontSize: 13 }}
            />
            <button type="submit" className="btn-primary" style={{ minHeight: 36, padding: '0 14px', fontSize: 13 }} disabled={sending || !body.trim()}>
              {sending ? '…' : 'Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.projectId;
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    let parsedUser = null;
    if (userData) {
      try { parsedUser = JSON.parse(userData); } catch { localStorage.removeItem('user'); }
    }
    setUser(parsedUser);
    fetchProjectData(parsedUser);
  }, [projectId]);

  const fetchProjectData = async (currentUser = user) => {
    try {
      const [projectResponse, membersResponse, tasksResponse] = await Promise.all([
        projectAPI.getProjectById(projectId),
        projectAPI.getProjectMembers(projectId),
        taskAPI.getAllTasks({ projectId }),
      ]);

      setProject(projectResponse.project);
      setMembers(membersResponse.members);
      setTasks(tasksResponse.tasks);

      if (currentUser?.role === 'Admin') {
        const usersResponse = await authAPI.getUsers();
        setUsers(usersResponse.users.filter((item) => item.role === 'Member'));
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      await projectAPI.addProjectMember(projectId, selectedUserId);
      setSelectedUserId('');
      toast.success('Member added');
      fetchProjectData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this project?`)) return;
    try {
      await projectAPI.removeProjectMember(projectId, memberId);
      toast.success('Member removed');
      fetchProjectData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const availableUsers = users.filter(
    (item) => !members.some((member) => member.id === item.id)
  );

  // progress stats for this project
  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container-custom page-shell">
        <Link href="/projects" className="font-bold text-blue-700 hover:underline text-sm">
          ← Back to projects
        </Link>

        {loading ? (
          <div className="card mt-6 text-center">Loading project...</div>
        ) : project ? (
          <>
            <div className="page-header mt-6">
              <div>
                <p className="eyebrow">Project workspace</p>
                <h1 className="page-title">{project.name}</h1>
                <p className="page-subtitle">Created by {project.creator_name}</p>
              </div>

              {/* progress pill */}
              {tasks.length > 0 && (
                <div className="stat-card min-w-40 text-right">
                  <div
                    className="stat-value"
                    style={{ color: progress === 100 ? '#087443' : '#155eef' }}
                  >
                    {progress}%
                  </div>
                  <div className="stat-label">{doneCount}/{tasks.length} done</div>
                  <div
                    style={{
                      marginTop: 10,
                      height: 6,
                      borderRadius: 999,
                      background: '#edf1f7',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 999,
                        width: `${progress}%`,
                        background: progress === 100 ? '#087443' : '#155eef',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── Members panel ───────────────── */}
              <div className="card lg:col-span-1">
                <h2 className="text-xl font-black mb-4">Team members</h2>

                {user?.role === 'Admin' && (
                  <form onSubmit={handleAddMember} className="mb-6 space-y-3">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select member to add</option>
                      {availableUsers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn-primary w-full" disabled={!selectedUserId}>
                      Add to project
                    </button>
                  </form>
                )}

                <div className="space-y-3">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid #edf1f7',
                          borderRadius: 8,
                          padding: '10px 14px',
                        }}
                      >
                        <div>
                          <p className="font-black text-sm">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                        {user?.role === 'Admin' && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            className="btn-danger text-sm"
                            style={{ minHeight: 30, padding: '4px 10px', fontSize: 12 }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No members added yet.</p>
                  )}
                </div>
              </div>

              {/* ── Tasks panel ─────────────────── */}
              <div className="card lg:col-span-2">
                <div className="toolbar mb-4">
                  <div>
                    <h2 className="text-xl font-black">Tasks</h2>
                    <p className="text-sm text-slate-500 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''} in this project</p>
                  </div>
                  <Link href={`/tasks`} className="btn-secondary text-sm">
                    Manage tasks →
                  </Link>
                </div>

                <div className="space-y-3">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          border: '1px solid #dce3ee',
                          borderRadius: 8,
                          padding: '14px 16px',
                          background: '#fff',
                        }}
                      >
                        <div className="flex justify-between gap-3">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 className="font-black text-slate-900 truncate">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                            <span className={`${task.status === 'Done' ? 'badge-done' : task.status === 'In Progress' ? 'badge-in-progress' : 'badge-todo'}`}>
                              {task.status}
                            </span>
                            <span className={PRIORITY_CLASS[task.priority || 'Medium']}>
                              {task.priority || 'Medium'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-slate-500">
                          {task.assigned_to_name ? `Assigned to ${task.assigned_to_name}` : 'Unassigned'}
                          {task.due_date && (
                            <span> · Due {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>

                        {/* ── Comments ── */}
                        <TaskComments task={task} currentUser={user} />
                      </div>
                    ))
                  ) : (
                    <div className="card-subtle text-center text-slate-500 text-sm">
                      No tasks yet. Create tasks from the Tasks page and assign them to this project.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card mt-6">Project not found.</div>
        )}
      </main>
    </ProtectedRoute>
  );
}
