'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Globe, Mail, FolderOpen, Database, Server,
  Shield, FileCode, Clock, HardDrive, GitBranch, Box, BarChart2,
  ChevronRight, LogOut, User, Cpu, Lock
} from 'lucide-react';

const nav = [
  {
    section: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Hosting',
    items: [
      { href: '/domains', label: 'Domains', icon: Globe },
      { href: '/ssl', label: 'SSL / TLS', icon: Lock },
      { href: '/email', label: 'Email', icon: Mail },
      { href: '/files', label: 'File Manager', icon: FolderOpen },
      { href: '/ftp', label: 'FTP Accounts', icon: Server },
    ],
  },
  {
    section: 'Databases',
    items: [
      { href: '/databases', label: 'MySQL Databases', icon: Database },
    ],
  },
  {
    section: 'Advanced',
    items: [
      { href: '/php', label: 'PHP Config', icon: FileCode },
      { href: '/nodejs', label: 'Node.js Manager', icon: Cpu },
      { href: '/cron', label: 'Cron Jobs', icon: Clock },
      { href: '/git', label: 'Git Deploy', icon: GitBranch },
      { href: '/apps', label: 'App Installer', icon: Box },
    ],
  },
  {
    section: 'Tools',
    items: [
      { href: '/backups', label: 'Backups', icon: HardDrive },
      { href: '/security', label: 'Security Panel', icon: Shield },
      { href: '/stats', label: 'Usage Stats', icon: BarChart2 },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 min-h-screen bg-[#0f172a] border-r border-slate-900/80 flex flex-col shrink-0 fixed left-0 top-0 bottom-0 z-30 overflow-y-auto shadow-2xl">
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-slate-900/60 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-[#00DFAB] to-[#00b88d] rounded-xl flex items-center justify-center text-[#1d1d1d] font-black text-base shadow-md shadow-[#00DFAB]/10 border border-[#00DFAB]/20">
          W.
        </div>
        <div>
          <div className="text-white font-extrabold text-sm leading-tight tracking-tight">Websouls</div>
          <div className="text-[#00DFAB] text-[10px] font-bold uppercase tracking-wider">cPanel Home</div>
        </div>
      </div>

      {/* User Information */}
      <div className="px-6 py-4 border-b border-slate-900/40 bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00DFAB]/10 flex items-center justify-center border border-[#00DFAB]/20">
            <User size={15} className="text-[#00DFAB]" />
          </div>
          <div className="overflow-hidden">
            <div className="text-slate-200 text-xs font-bold truncate">{user?.username}</div>
            <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.section} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${active
                        ? 'bg-[#00DFAB]/10 text-[#00DFAB] border border-[#00DFAB]/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-950/40 border border-transparent hover:translate-x-1'
                      }`}
                  >
                    <Icon size={16} className={active ? 'text-[#00DFAB]' : 'text-slate-400 group-hover:text-slate-200 transition-colors'} />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight size={14} className="text-[#00DFAB]/80" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-900/60 bg-slate-950/20">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent transition-all duration-200 cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
