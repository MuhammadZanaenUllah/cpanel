'use client';
import { Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Props { title: string; subtitle?: string; }

export default function Header({ title, subtitle }: Props) {
  const { user } = useAuth();
  return (
    <header className="h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-8 sticky top-0 z-20">
      <div>
        <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-xs font-medium mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2.5 rounded-xl border border-slate-200/60 bg-white/80 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer">
          <HelpCircle size={17} />
        </button>
        <button className="p-2.5 rounded-xl border border-slate-200/60 bg-white/80 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all relative cursor-pointer">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center text-blue-600 text-sm font-extrabold ml-1 shadow-sm">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
