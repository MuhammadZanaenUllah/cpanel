'use client';
import Header from '@/components/layout/Header';
import { Shield, Lock } from 'lucide-react';

export default function SecurityPage() {
  return (
    <>
      <Header title="Security" subtitle="Account security settings" />
      <main className="p-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3"><Shield size={16} className="text-[#4669fa]" /><span className="font-semibold text-slate-700 text-sm">Password Protection</span></div>
            <p className="text-sm text-slate-500">Protect directories with a password via .htpasswd.</p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-400">Coming soon</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3"><Lock size={16} className="text-[#4669fa]" /><span className="font-semibold text-slate-700 text-sm">IP Blocking</span></div>
            <p className="text-sm text-slate-500">Block specific IP addresses from accessing your site.</p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-400">Coming soon</div>
          </div>
        </div>
      </main>
    </>
  );
}
