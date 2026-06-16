'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import EmptyState from '@/components/ui/EmptyState';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import React from 'react';
import { HardDrive, Download, RotateCcw, Trash2, Plus, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';

interface Backup { id: string; name: string; type: string; status: string; size_bytes: number; completed_at: string; created_at: string; }

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'badge-success', failed: 'badge-danger', running: 'badge-warning', pending: 'badge-gray',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle size={13} className="text-green-500" />,
  failed: <XCircle size={13} className="text-red-500" />,
  running: <Loader size={13} className="text-amber-500 animate-spin" />,
  pending: <Clock size={13} className="text-slate-400" />,
};

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState('full');

  const load = () => api.get('/cpanel/backups').then((r) => setBackups(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      const res = await api.post('/cpanel/backups/create', { type });
      toast.success(`Backup started — Job ID: ${res.data.data.jobId}`);
      setTimeout(load, 2000);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCreating(false); }
  };

  const downloadBackup = (id: string, name: string) => {
    const token = localStorage.getItem('cpanel_token');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://65.21.125.14:2083';
    window.open(`${baseUrl}/cpanel/backups/${id}/download?token=${token}`, '_blank');
  };

  const deleteBackup = async (id: string) => {
    if (!confirm('Delete this backup?')) return;
    try { await api.delete(`/cpanel/backups/${id}`); toast.success('Backup deleted'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <Header title="Backups" subtitle="Create, manage and restore your account backups" />
      <main className="p-6 flex-1 space-y-4">
        {/* Create backup card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Plus size={16} className="text-[#4669fa]" />
            <span className="font-semibold text-slate-700 text-sm">Create New Backup</span>
          </div>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="mb-1 block">Backup Type</label>
              <select className="input w-auto" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="full">Full (files + databases + email)</option>
                <option value="homedir">Home Directory only</option>
                <option value="databases">Databases only</option>
                <option value="email">Email only</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={createBackup} disabled={creating}>
              {creating ? <span className="spinner border-white/30 border-t-white" /> : <><HardDrive size={14} /> Create Backup</>}
            </button>
          </div>
        </div>

        {/* Backups list */}
        <div className="card">
          <div className="p-4 border-b border-slate-100 section-header">
            <div className="font-semibold text-slate-700 text-sm">{backups.length} backup{backups.length !== 1 ? 's' : ''}</div>
            <button className="btn btn-secondary btn-sm" onClick={load}><RotateCcw size={13} /> Refresh</button>
          </div>
          {loading ? <div className="flex justify-center py-12"><div className="spinner" /></div>
            : backups.length === 0 ? <EmptyState icon={<HardDrive size={32} />} title="No backups yet" description="Create your first backup using the form above" />
            : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {backups.map((b) => (
                      <tr key={b.id}>
                        <td><span className="text-xs font-mono text-slate-600 truncate-cell">{b.name}</span></td>
                        <td><span className="badge badge-gray capitalize">{b.type}</span></td>
                        <td><span className="text-xs text-slate-500">{b.size_bytes ? formatSize(b.size_bytes) : '—'}</span></td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {STATUS_ICON[b.status] || <Clock size={13} />}
                            <span className={`badge ${STATUS_BADGE[b.status] || 'badge-gray'}`}>{b.status}</span>
                          </div>
                        </td>
                        <td><span className="text-xs text-slate-400">{new Date(b.created_at).toLocaleString()}</span></td>
                        <td>
                          <div className="flex gap-1.5">
                            {b.status === 'completed' && (
                              <button className="btn btn-sm btn-secondary" onClick={() => downloadBackup(b.id, b.name)}><Download size={12} /> Download</button>
                            )}
                            <button className="btn btn-icon btn-danger" onClick={() => deleteBackup(b.id)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </main>
    </>
  );
}
