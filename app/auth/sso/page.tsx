'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SsoPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token     = params.get('token');
    const accountId = params.get('accountId');
    const username  = params.get('username');
    const role      = params.get('role') || 'user';

    if (!token || !accountId || !username) {
      router.replace('/login');
      return;
    }

    localStorage.setItem('cpanel_token', token);
    localStorage.setItem('cpanel_user', JSON.stringify({ accountId, username, role, token }));
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div style={{ width: 24, height: 24, border: '2.5px solid #e2e8f0', borderTopColor: '#4669fa', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  );
}
