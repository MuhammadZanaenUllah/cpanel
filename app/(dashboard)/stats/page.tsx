'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { BarChart2, TrendingUp, HardDrive, Wifi } from 'lucide-react';

interface BandwidthRow { year_month: string; bytes_http: number; bytes_ftp: number; bytes_mail: number; }

function fmtBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [bandwidth, setBandwidth] = useState<BandwidthRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/cpanel/stats').then((r) => setStats(r.data.data)).catch(() => {}),
      api.get('/cpanel/stats/bandwidth').then((r) => setBandwidth(r.data.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <><Header title="Statistics" /><main className="p-6 flex-1 flex items-center justify-center"><div className="spinner w-8 h-8" /></main></>;

  return (
    <>
      <Header title="Statistics & Logs" subtitle="Account resource usage and bandwidth reports" />
      <main className="p-6 flex-1 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats && [
            { label: 'Disk Used', value: `${stats.diskUsedMb || 0} / ${stats.diskLimitMb} MB`, icon: <HardDrive size={18} className="text-blue-500" />, bg: 'bg-blue-50' },
            { label: 'Bandwidth', value: `${stats.bandwidthUsedMb || 0} / ${stats.bandwidthLimitMb} MB`, icon: <Wifi size={18} className="text-green-500" />, bg: 'bg-green-50' },
            { label: 'Email Accounts', value: `${stats.emailAccounts} / ${stats.emailLimit}`, icon: <BarChart2 size={18} className="text-purple-500" />, bg: 'bg-purple-50' },
            { label: 'Databases', value: `${stats.databases} / ${stats.databaseLimit}`, icon: <TrendingUp size={18} className="text-orange-500" />, bg: 'bg-orange-50' },
          ].map((s, i) => (
            <div key={i} className="stat-card flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>{s.icon}</div>
              <div><div className="text-base font-bold text-slate-800">{String(s.value)}</div><div className="text-xs text-slate-400">{s.label}</div></div>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4"><BarChart2 size={16} className="text-[#4669fa]" /><span className="font-semibold text-slate-700 text-sm">Bandwidth History</span></div>
          {bandwidth.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No bandwidth data available yet</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Month</th><th>HTTP</th><th>FTP</th><th>Mail</th><th>Total</th></tr></thead>
                <tbody>
                  {bandwidth.map((r) => {
                    const total = (r.bytes_http || 0) + (r.bytes_ftp || 0) + (r.bytes_mail || 0);
                    return (
                      <tr key={r.year_month}>
                        <td><span className="font-medium text-slate-700">{r.year_month}</span></td>
                        <td><span className="text-sm text-slate-500">{fmtBytes(r.bytes_http || 0)}</span></td>
                        <td><span className="text-sm text-slate-500">{fmtBytes(r.bytes_ftp || 0)}</span></td>
                        <td><span className="text-sm text-slate-500">{fmtBytes(r.bytes_mail || 0)}</span></td>
                        <td><span className="text-sm font-semibold text-slate-700">{fmtBytes(total)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
