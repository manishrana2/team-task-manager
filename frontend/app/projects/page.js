'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { projectAPI } from '@/lib/api';
import Link from 'next/link';

function ProgressBar({ progress, taskCount }) {
  const color =
    progress === 100 ? '#087443' : progress >= 50 ? '#155eef' : '#946200';

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#667085' }}>
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>
          {progress}% done
        </span>
      </div>
      <div
        style={{
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
            background: color,
            width: `${progress}%`,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch { localStorage.removeItem('user'); }
    }
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAllProjects();
      setProjects(response.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setFormLoading(true);
    try {
      await projectAPI.createProject(newProjectName);
      setNewProjectName('');
      setShowForm(false);
      toast.success('Project created');
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Delete "${projectName}" and all its tasks? This cannot be undone.`)) return;

    try {
      await projectAPI.deleteProject(projectId);
      toast.success('Project deleted');
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container-custom page-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Planning</p>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">
              Create project spaces, add members, and track completion across your team.
            </p>
          </div>
          {user?.role === 'Admin' && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              + New Project
            </button>
          )}
        </div>

        {showForm && user?.role === 'Admin' && (
          <div className="card mb-8">
            <h2 className="text-lg font-black mb-4">New project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Project name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input-field"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={formLoading} className="btn-primary">
                  {formLoading ? 'Creating...' : 'Create Project'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="card text-center">Loading projects...</div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 160ms ease, box-shadow 160ms ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 20px 48px rgba(21,31,51,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <h3 className="text-xl font-black" style={{ lineHeight: 1.2 }}>{project.name}</h3>
                    {project.progress === 100 && (
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: 11,
                          fontWeight: 800,
                          background: '#e9f8f0',
                          color: '#087443',
                          border: '1px solid #a6f4c5',
                          borderRadius: 999,
                          padding: '3px 8px',
                        }}
                      >
                        Complete
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm mt-1">by {project.creator_name}</p>

                  <ProgressBar
                    progress={project.progress ?? 0}
                    taskCount={project.task_count ?? 0}
                  />
                </div>

                <div className="flex gap-2 mt-5">
                  <Link href={`/projects/${project.id}`} className="btn-primary text-sm" style={{ flex: 1, justifyContent: 'center' }}>
                    Open
                  </Link>
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="btn-danger text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center">
            <p className="text-slate-600">No projects yet. Create the first project to get started.</p>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
