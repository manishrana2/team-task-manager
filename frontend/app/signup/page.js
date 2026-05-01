'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Public signup has been disabled.
// All user accounts are created by Admins from the Users page.
export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return null;
}
