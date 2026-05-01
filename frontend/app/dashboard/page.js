'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { taskAPI } from '@/lib/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const CHART_COLORS = {
  Todo: '#946200',
  'In Progress': '#155eef',
  Done: '#087443',
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch { localStorage.removeItem('user'); }
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await taskAPI.getDashboardStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats?.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const pieData = stats ? [
    { name: 'Todo', value: stats.todoTasks || 0 },
    { name: 'In Progress', value: stats.inProgressTasks || 0 },
    { name: 'Done', value: stats.completedTasks || 0 },
  ].filter(d => d.value > 0) : [];

  const barData = stats ? [
    { name: 'Total', value: stats.totalTasks || 0, fill: '#155eef' },
    { name: 'Done', value: stats.completedTasks || 0, fill: '#087443' },
    { name: 'In Progress', value: stats.inProgressTasks || 0, fill: '#155eef' },
    { name: 'Overdue', value: stats.overdueTasks || 0, fill: '#c03221' },
  ] : [];

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="container-custom page-shell">
        <div className="page-header">
          <div>
            <p className="eyebrow">Overview</p>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {user ? `Welcome back, ${user.name}.` : 'Track active work, overdue items, and team progress.'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="card text-center">Loading dashboard...</div>
        ) : stats ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Total', value: stats.totalTasks, color: 'text-slate-700' },
                { label: 'Completed', value: stats.completedTasks, color: 'text-emerald-700' },
                { label: 'In Progress', value: stats.inProgressTasks, color: 'text-blue-700' },
                { label: 'Todo', value: stats.todoTasks, color: 'text-amber-700' },
                { label: 'Overdue', value: stats.overdueTasks, color: 'text-red-700' },
                { label: '🔴 High Priority', value: stats.highPriorityPending || 0, color: 'text-red-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-card">
                  <div className={`stat-value ${color}`}>{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Charts + Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

              {/* Pie chart */}
              <div className="card">
                <h3 className="text-lg font-black mb-4">Task distribution</h3>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={CHART_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [value, name]}
                          contentStyle={{ borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <ul className="mt-2 space-y-1">
                      {pieData.map(d => (
                        <li key={d.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[d.name] }} />
                            {d.name}
                          </span>
                          <span className="font-black">{d.value}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">No tasks yet.</p>
                )}
              </div>

              {/* Bar chart */}
              <div className="card">
                <h3 className="text-lg font-black mb-4">Task overview</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#edf1f7" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Progress + Attention */}
              <div className="flex flex-col gap-4">
                <div className="card">
                  <h3 className="text-base font-black mb-3">Completion</h3>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-slate-600">Rate</span>
                    <span className="font-black">{completionRate}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-200">
                    <div
                      className="h-3 rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="card flex-1">
                  <h3 className="text-base font-black mb-3">Attention</h3>
                  <div className="space-y-2">
                    {stats.overdueTasks > 0 && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                        {stats.overdueTasks} overdue task{stats.overdueTasks !== 1 ? 's' : ''}
                      </div>
                    )}
                    {(stats.highPriorityPending || 0) > 0 && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                        {stats.highPriorityPending} high priority pending
                      </div>
                    )}
                    {stats.overdueTasks === 0 && (stats.highPriorityPending || 0) === 0 && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                        Everything looks good.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card text-center">Failed to load statistics.</div>
        )}
      </main>
    </ProtectedRoute>
  );
}
