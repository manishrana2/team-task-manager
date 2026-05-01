'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI, taskAPI, projectAPI } from '@/lib/api';

const PRIORITY_CLASS = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' };

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    due_date: '',
    status: 'Todo',
    priority: 'Medium',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch { localStorage.removeItem('user'); }
    }
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchTasks = async (statusOverride = filter, priorityOverride = priorityFilter) => {
    try {
      const filters = {};
      if (statusOverride) filters.status = statusOverride;
      if (priorityOverride) filters.priority = priorityOverride;
      const response = await taskAPI.getAllTasks(filters);
      setTasks(response.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAllProjects();
      setProjects(response.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      setUsers(response.users.filter((item) => item.role === 'Member'));
    } catch (error) {
      if (error.response?.status !== 403) {
        console.error('Error fetching users:', error);
      }
    }
  };

  const fetchProjectMembers = async (projectId) => {
    if (!projectId) { setProjectMembers([]); return; }
    try {
      const response = await projectAPI.getProjectMembers(projectId);
      setProjectMembers(response.members);
    } catch {
      setProjectMembers([]);
    }
  };

  const handleFilterChange = (status) => {
    setFilter(status);
    fetchTasks(status, priorityFilter);
  };

  const handlePriorityFilter = (priority) => {
    setPriorityFilter(priority);
    fetchTasks(filter, priority);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.project_id) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await taskAPI.createTask(formData);
      setFormData({ title: '', description: '', project_id: '', assigned_to: '', due_date: '', status: 'Todo', priority: 'Medium' });
      setShowForm(false);
      toast.success('Task created');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleEditTask = async (task) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      status: task.status,
      priority: task.priority || 'Medium',
      project_id: task.project_id,
      project_name: task.project_name,
    });
    fetchProjectMembers(task.project_id);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await taskAPI.updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        assigned_to: editingTask.assigned_to,
        due_date: editingTask.due_date,
        status: editingTask.status,
        priority: editingTask.priority,
      });
      setEditingTask(null);
      setProjectMembers([]);
      toast.success('Task updated');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateTask(taskId, { status: newStatus });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Delete "${taskTitle}"?`)) return;

    try {
      await taskAPI.deleteTask(taskId);
      toast.success('Task deleted');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const getStatusBadge = (status) => {
    const badges = { 'Todo': 'badge-todo', 'In Progress': 'badge-in-progress', 'Done': 'badge-done' };
    return badges[status] || 'badge-todo';
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'Done' || !dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const columns = [
    { status: 'Todo', title: 'Todo' },
    { status: 'In Progress', title: 'In progress' },
    { status: 'Done', title: 'Done' },
  ];

  const columnTasks = (status) => tasks.filter((task) => task.status === status);

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container-custom page-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Execution</p>
            <h1 className="page-title">Tasks</h1>
            <p className="page-subtitle">
              Assign owners, update progress, and catch overdue work before it slips.
            </p>
          </div>
          {user?.role === 'Admin' && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              + New Task
            </button>
          )}
        </div>

        {showForm && user?.role === 'Admin' && (
          <div className="card mb-8">
            <h2 className="text-lg font-black mb-4">New task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    placeholder="Task title"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Project</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => {
                      setFormData({ ...formData, project_id: e.target.value, assigned_to: '' });
                      fetchProjectMembers(e.target.value);
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  placeholder="Task description"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Assign to</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Unassigned</option>
                    {(projectMembers.length > 0 ? projectMembers : users).map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Due date</label>
                  <input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary">Create Task</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['', 'Todo', 'In Progress', 'Done'].map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={filter === s ? 'btn-primary' : 'btn-secondary'}
            >
              {s || 'All Tasks'}
            </button>
          ))}
          <span className="mx-2 self-center text-slate-300">|</span>
          {['', 'High', 'Medium', 'Low'].map((p) => (
            <button
              key={p}
              onClick={() => handlePriorityFilter(p)}
              className={priorityFilter === p ? 'btn-primary' : 'btn-secondary'}
            >
              {p ? `${p === 'High' ? '🔴' : p === 'Medium' ? '🟡' : '🟢'} ${p}` : 'All Priority'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card text-center">Loading tasks...</div>
        ) : tasks.length > 0 ? (
          <div className="kanban-grid">
            {columns.map((column) => (
              <section key={column.status} className="kanban-column">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-black">{column.title}</h2>
                  <span className={getStatusBadge(column.status)}>
                    {columnTasks(column.status).length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnTasks(column.status).map((task) => (
                    <article
                      key={task.id}
                      className={`task-card ${isOverdue(task.due_date, task.status) ? 'task-card-overdue' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-950 truncate">{task.title}</h3>
                          <p className="mt-0.5 text-sm font-bold text-slate-500">{task.project_name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isOverdue(task.due_date, task.status) && (
                            <span className="badge-overdue">Overdue</span>
                          )}
                          <span className={PRIORITY_CLASS[task.priority || 'Medium']}>
                            {task.priority || 'Medium'}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{task.description}</p>

                      <div className="mt-4 space-y-1 text-sm text-slate-500">
                        <p>Owner: {task.assigned_to_name || 'Unassigned'}</p>
                        {task.due_date && (
                          <p>Due: {new Date(task.due_date).toLocaleDateString()}</p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="input-field text-sm"
                        >
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                        {user?.role === 'Admin' && (
                          <>
                            <button onClick={() => handleEditTask(task)} className="btn-secondary text-sm">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteTask(task.id, task.title)} className="btn-danger text-sm">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))}

                  {columnTasks(column.status).length === 0 && (
                    <div className="card-subtle text-center text-sm text-slate-500">No tasks here.</div>
                  )}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-slate-600">No tasks match this view.</p>
          </div>
        )}

        {editingTask && (
          <section className="card mt-6">
            <div className="toolbar mb-5">
              <div>
                <h2 className="text-xl font-black">Edit task</h2>
                <p className="mt-1 text-sm text-slate-500">{editingTask.project_name}</p>
              </div>
              <button
                className="btn-ghost"
                onClick={() => { setEditingTask(null); setProjectMembers([]); }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Title</label>
                  <input
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Assign to</label>
                  <select
                    value={editingTask.assigned_to}
                    onChange={(e) => setEditingTask({ ...editingTask, assigned_to: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Due date</label>
                  <input
                    type="datetime-local"
                    value={editingTask.due_date}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary">Save task</button>
            </form>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
