'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Globe, Mail, Database, FolderOpen, HardDrive,
  Clock, Server, BarChart2, ArrowUpRight, Activity
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  diskLimitMb: number; bandwidthLimitMb: number;
  emailAccounts: number; emailLimit: number;
  databases: number; databaseLimit: number;
  ftpAccounts: number; ftpLimit: number;
  domains: number; lastLoginAt: string; lastLoginIp: string;
}

interface StatCardProps {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; href: string;
}

function StatCard({ label, value, sub, icon, color, href }: StatCardProps) {
  return (
    <Link href={href} className="stat-card flex items-start justify-between group">
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
          {sub && <div className="text-slate-400 text-[11px] font-medium mt-1">{sub}</div>}
        </div>
      </div>
      <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-[#00DFAB]/10 flex items-center justify-center border border-slate-100 group-hover:border-[#00DFAB]/20 transition-all">
        <ArrowUpRight size={14} className="text-slate-400 group-hover:text-[#00b88d] transition-colors" />
      </div>
    </Link>
  );
}

function ProgressBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct > 90 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : pct > 70 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-[#00DFAB] shadow-[0_0_8px_rgba(0,223,171,0.4)]';
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
        <span>{label}</span>
        <span className="text-slate-500">{used.toLocaleString()} / {limit.toLocaleString()} MB</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
        <span>{pct.toFixed(1)}% Used</span>
        <span>{(100 - pct).toFixed(1)}% Free</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cpanel/stats').then((r) => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Email Quota', value: `${stats.emailAccounts} / ${stats.emailLimit}`, icon: <Mail size={20} className="text-blue-600" />, color: 'bg-blue-50 border border-blue-100/50', href: '/email' },
    { label: 'MySQL Databases', value: `${stats.databases} / ${stats.databaseLimit}`, icon: <Database size={20} className="text-indigo-600" />, color: 'bg-indigo-50 border border-indigo-100/50', href: '/databases' },
    { label: 'FTP Accounts', value: `${stats.ftpAccounts} / ${stats.ftpLimit}`, icon: <Server size={20} className="text-emerald-600" />, color: 'bg-emerald-50 border border-emerald-100/50', href: '/ftp' },
    { label: 'Hosted Domains', value: stats.domains, icon: <Globe size={20} className="text-amber-600" />, color: 'bg-amber-50 border border-amber-100/50', href: '/domains' },
  ] : [];

  return (
    <>
      <Header title="Hosting Dashboard" subtitle={`Welcome back, ${user?.username}`} />
      <main className="p-8 flex-1 space-y-8 max-w-7xl w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="spinner w-8 h-8" />
              <span className="text-slate-400 text-xs font-semibold">Loading stats...</span>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-8 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {cards.map((c) => <StatCard key={c.label} {...c} />)}
            </div>

            {/* Resource and Activity Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Resource usage card */}
              <div className="card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100/50">
                      <HardDrive size={16} />
                    </div>
                    <span className="font-extrabold text-slate-800 text-sm tracking-tight">Resource Quotas</span>
                  </div>
                  <div className="space-y-6">
                    <ProgressBar label="SSD Disk Storage Space" used={0} limit={stats.diskLimitMb} />
                    <ProgressBar label="Allocated Bandwidth Volume" used={0} limit={stats.bandwidthLimitMb} />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100/80 text-[11px] text-slate-400 font-medium">
                  Resource quotas reset on the first of every month.
                </div>
              </div>

              {/* Account activity card */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
                    <Activity size={16} />
                  </div>
                  <span className="font-extrabold text-slate-800 text-sm tracking-tight">Access Log & Profile</span>
                </div>
                <div className="space-y-2.5">
                  <Row label="Recent Login Session" value={stats.lastLoginAt ? new Date(stats.lastLoginAt).toLocaleString() : 'First session'} />
                  <Row label="Authorized Client IP" value={stats.lastLoginIp || '127.0.0.1'} />
                  <Row label="Account Owner Username" value={user?.username || ''} />
                  <Row label="System Membership Level" value={user?.role?.toUpperCase() || ''} />
                </div>
              </div>
            </div>

            {/* Quick action grid */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/50">
                  <BarChart2 size={16} />
                </div>
                <span className="font-extrabold text-slate-800 text-sm tracking-tight">Quick Actions & Managers</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { href: '/domains', label: 'Domain Manager', icon: <Globe size={20} className="text-amber-600" /> },
                  { href: '/email', label: 'Email Accounts', icon: <Mail size={20} className="text-blue-600" /> },
                  { href: '/files', label: 'File Browser', icon: <FolderOpen size={20} className="text-purple-600" /> },
                  { href: '/databases', label: 'Database Admin', icon: <Database size={20} className="text-indigo-600" /> },
                  { href: '/backups', label: 'Backup System', icon: <HardDrive size={20} className="text-emerald-600" /> },
                  { href: '/cron', label: 'Cron Scheduler', icon: <Clock size={20} className="text-rose-600" /> },
                ].map((a) => (
                  <Link key={a.href} href={a.href}
                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-slate-200/50 hover:border-[#00DFAB]/20 hover:bg-[#00DFAB]/10 transition-all duration-200 text-slate-500 hover:text-[#00b88d] cursor-pointer shadow-sm group">
                    <div className="transform group-hover:scale-110 transition-transform duration-200">
                      {a.icon}
                    </div>
                    <span className="text-xs font-semibold text-center text-slate-700 group-hover:text-[#00b88d] transition-colors">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-12 text-center text-slate-400 mt-20">
            Failed to connect to backend server. Verify your API is running.
          </div>
        )}
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-xs font-bold text-slate-800 max-w-[60%] text-right truncate bg-slate-50 border border-slate-100/50 px-2.5 py-1 rounded-lg">{value}</span>
    </div>
  );
}
