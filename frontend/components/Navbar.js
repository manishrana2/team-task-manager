'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Projects', path: '/projects' },
    { name: 'Tasks', path: '/tasks' },
  ];

  if (user?.role === 'Admin') {
    navLinks.push({ name: 'Users', path: '/users' });
    navLinks.push({ name: 'Activity', path: '/activity' });
  }

  return (
    <nav className="topbar">
      <div className="container-custom topbar-inner">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/" className="flex items-center gap-3 font-black text-slate-950">
            <span className="brand-mark">TM</span>
            <span className="text-xl">Task Manage</span>
          </Link>
          <div className="flex flex-wrap items-center gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`nav-link ${pathname.startsWith(item.path) ? 'nav-link-active' : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="btn-ghost text-sm p-2 rounded-full"
            style={{ minHeight: 36, width: 36 }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {user && (
            <Link href="/profile" className="text-sm font-bold text-slate-700 hover:text-blue-600 px-3">
              {user.name}
            </Link>
          )}
          <button onClick={handleLogout} className="btn-secondary text-sm">
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
