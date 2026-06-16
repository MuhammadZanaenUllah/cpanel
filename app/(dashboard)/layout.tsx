'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setRedirecting(true);
      router.replace('/login');
    }
  }, [user, loading]); // intentionally omit router — it's stable

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div style={{ width: 24, height: 24, border: '2.5px solid #e2e8f0', borderTopColor: '#4669fa', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen bg-[#f4f7fb]">
        {children}
      </div>
    </div>
  );
}
