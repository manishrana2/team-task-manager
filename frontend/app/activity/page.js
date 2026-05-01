'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { activityAPI } from '@/lib/api';

const ACTION_DOT = {
  create: 'activity-dot-create',
  update: 'activity-dot-update',
  delete: 'activity-dot-delete',
};

const ACTION_LABEL = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try { setCurrentUser(JSON.parse(userData)); } catch { localStorage.removeItem('user'); }
    }
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await activityAPI.getLogs(100);
      setLogs(response.logs);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser && currentUser.role !== 'Admin') {
    return (
      <ProtectedRoute>
        <Navbar />
        <main className="container-custom page-shell">
          <div className="card text-center">
            <h1 className="text-2xl font-black">Access restricted</h1>
            <p className="mt-2 text-slate-600">Only admins can view the activity log.</p>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container-custom page-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Audit</p>
            <h1 className="page-title">Activity log</h1>
            <p className="page-subtitle">
              Every action taken by your team — who did what and when.
            </p>
          </div>
          <button onClick={fetchLogs} className="btn-secondary">
            Refresh
          </button>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center text-slate-500">Loading activity...</div>
          ) : logs.length > 0 ? (
            <ul className="activity-timeline">
              {logs.map((log) => (
                <li key={log.id} className="activity-item">
                  <div className={`activity-dot ${ACTION_DOT[log.action] || 'activity-dot'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800">
                      {log.user_name || 'Unknown'}{' '}
                      <span className="font-normal text-slate-500">
                        {ACTION_LABEL[log.action] || log.action} {log.entity_type}
                      </span>
                    </p>
                    {log.detail && (
                      <p className="text-sm text-slate-600 mt-0.5">{log.detail}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400 font-bold">
                    {timeAgo(log.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-center">No activity recorded yet.</p>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
