'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card text-center">
        <h1 className="text-3xl font-black mb-3">Task Manage</h1>
        <p className="text-slate-500">Preparing your workspace...</p>
      </div>
    </div>
  );
}
