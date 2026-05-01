'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card text-center">
          <div className="text-lg font-bold">Opening workspace</div>
          <div className="mt-2 text-sm text-slate-500">Checking your session...</div>
        </div>
      </div>
    );
  }

  return children;
}
