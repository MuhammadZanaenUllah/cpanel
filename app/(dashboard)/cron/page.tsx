'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface CronJob { id: string; minute: string; hour: string; day: string; month: string; weekday: string; command: string; enabled: boolean; expression: string; description: string; nextRunAt: string; }

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every day at 3 AM', value: '0 3 * * *' },
  { label: 'Every Sunday at midnight', value: '0 0 * * 0' },
  { label: 'Every month on 1st', value: '0 0 1 * *' },
];

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<CronJob | null>(null);
  const [saving, setSaving] = useState(false);
  const [delLoad, setDelLoad] = useState(false);
  const [form, setForm] = useState({ minute: '0', hour: '0', day: '*', month: '*', weekday: '*', command: '' });

  const applyPreset = (expr: string) => {
    const [m, h, d, mo, w] = expr.split(' ');
    setForm({ ...form, minute: m, hour: h, day: d, month: mo, weekday: w });
  };

  const load = () => api.get('/cpanel/cron').then((r) => setJobs(r.data.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post('/cpanel/cron', form);
      toast.success('Cron job created'); setShowAdd(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDelLoad(true);
    try {
      await api.delete(`/cpanel/cron/${deleting.id}`);
      toast.success('Cron job deleted'); setDeleting(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDelLoad(false); }
  };

  const toggleEnabled = async (job: CronJob) => {
    try {
      await api.patch(`/cpanel/cron/${job.id}`, { enabled: !job.enabled });
      toast.success(`Cron job ${!job.enabled ? 'enabled' : 'disabled'}`); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <Header title="Cron Jobs" subtitle="Schedule recurring tasks for your account" />
      <main className="p-6 flex-1">
        <div className="card">
          <div className="p-4 border-b border-slate-100 section-header">
            <div className="font-semibold text-slate-700 text-sm">{jobs.length} cron job{jobs.length !== 1 ? 's' : ''}</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New Cron Job</button>
          </div>
          {loading ? <div className="flex justify-center py-12"><div className="spinner" /></div>
            : jobs.length === 0 ? <EmptyState icon={<Clock size={32} />} title="No cron jobs" description="Schedule PHP scripts, shell commands or any executable" action={<button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New Cron Job</button>} />
            : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Schedule</th><th>Command</th><th>Next Run</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {jobs.map((j) => (
                      <tr key={j.id}>
                        <td>
                          <div className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded inline-block">{j.expression}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{j.description}</div>
                        </td>
                        <td><span className="text-xs text-slate-600 font-mono truncate-cell">{j.command}</span></td>
                        <td><span className="text-xs text-slate-400">{j.nextRunAt ? new Date(j.nextRunAt).toLocaleString() : '—'}</span></td>
                        <td>
                          <button onClick={() => toggleEnabled(j)} className={`flex items-center gap-1 badge cursor-pointer ${j.enabled ? 'badge-success' : 'badge-gray'}`}>
                            {j.enabled ? <ToggleRight size={12} /> : <ToggleLeft size={12} />} {j.enabled ? 'Active' : 'Disabled'}
                          </button>
                        </td>
                        <td><button className="btn btn-icon btn-danger" onClick={() => setDeleting(j)}><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Cron Job" size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd} disabled={saving || !form.command}>{saving ? <span className="spinner border-white/30 border-t-white" /> : 'Create'}</button></>}>
        <div className="space-y-4">
          {/* Presets */}
          <div className="form-group">
            <label>Preset Schedules</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.value} className="btn btn-secondary btn-sm text-xs" onClick={() => applyPreset(p.value)}>{p.label}</button>
              ))}
            </div>
          </div>
          {/* Custom */}
          <div>
            <label className="mb-2 block">Schedule (minute hour day month weekday)</label>
            <div className="grid grid-cols-5 gap-2">
              {['minute','hour','day','month','weekday'].map((f) => (
                <div key={f}>
                  <div className="text-[11px] text-slate-400 mb-1 capitalize">{f}</div>
                  <input className="input text-center font-mono" value={(form as Record<string, string>)[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-400 font-mono">Current: {form.minute} {form.hour} {form.day} {form.month} {form.weekday}</div>
          </div>
          <div className="form-group">
            <label>Command</label>
            <input className="input font-mono text-sm" placeholder="/usr/bin/php /home/user/cron.php" value={form.command} onChange={(e) => setForm({ ...form, command: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={delLoad} title="Delete Cron Job" message={`Delete this cron job?\n\n${deleting?.expression} — ${deleting?.command}`} />
    </>
  );
}
