'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Server, Plus, Trash2, Info } from 'lucide-react';

interface FTPAccount { id: string; username: string; homedir: string; quota_mb: number; ftps_only: boolean; status: string; }

export default function FTPPage() {
  const [accounts, setAccounts] = useState<FTPAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<FTPAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [delLoad, setDelLoad] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', homedir: 'public_html', quotaMb: 1024, ftpsOnly: false });
  const [connInfo, setConnInfo] = useState<{ hostname: string; ip: string; port: number } | null>(null);

  const load = () => api.get('/cpanel/ftp/accounts').then((r) => setAccounts(r.data.data)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => {
    load();
    api.get('/cpanel/ftp/accounts').then(() => {}).catch(() => {});
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post('/cpanel/ftp/accounts', form);
      toast.success(`FTP account "${form.username}" created`); setShowAdd(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDelLoad(true);
    try {
      await api.delete(`/cpanel/ftp/accounts/${deleting.id}`);
      toast.success('FTP account deleted'); setDeleting(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDelLoad(false); }
  };

  const showConnInfo = async (id: string) => {
    try {
      const res = await api.get(`/cpanel/ftp/accounts/${id}/connection-info`);
      setConnInfo(res.data.data);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <Header title="FTP Accounts" subtitle="Manage FTP users and their directory access" />
      <main className="p-6 flex-1">
        <div className="card">
          <div className="p-4 border-b border-slate-100 section-header">
            <div className="font-semibold text-slate-700 text-sm">{accounts.length} FTP account{accounts.length !== 1 ? 's' : ''}</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New FTP Account</button>
          </div>
          {loading ? <div className="flex justify-center py-12"><div className="spinner" /></div>
            : accounts.length === 0 ? <EmptyState icon={<Server size={32} />} title="No FTP accounts" action={<button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New FTP Account</button>} />
            : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Username</th><th>Home Directory</th><th>Quota</th><th>FTPS</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {accounts.map((a) => (
                      <tr key={a.id}>
                        <td><span className="font-medium font-mono text-slate-700">{a.username}</span></td>
                        <td><span className="text-xs text-slate-500">{a.homedir}</span></td>
                        <td><span className="text-xs text-slate-500">{a.quota_mb === 0 ? 'Unlimited' : `${a.quota_mb} MB`}</span></td>
                        <td><span className={`badge ${a.ftps_only ? 'badge-success' : 'badge-gray'}`}>{a.ftps_only ? 'Required' : 'Optional'}</span></td>
                        <td><span className={`badge ${a.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span></td>
                        <td>
                          <div className="flex gap-1.5">
                            <button className="btn btn-icon btn-secondary text-slate-400" onClick={() => showConnInfo(a.id)} title="Connection Info"><Info size={13} /></button>
                            <button className="btn btn-icon btn-danger" onClick={() => setDeleting(a)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {connInfo && (
          <div className="card p-5 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-700 text-sm">FTP Connection Details</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setConnInfo(null)}>Close</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[['Host', connInfo.hostname], ['IP', connInfo.ip], ['Port', String(connInfo.port)]].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">{k}</div>
                  <div className="text-sm font-mono text-slate-700 mt-1">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create FTP Account"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? <span className="spinner border-white/30 border-t-white" /> : 'Create'}</button></>}>
        <div className="space-y-4">
          <div className="form-row">
            <div className="form-group"><label>Username</label><input className="input" placeholder="ftpuser" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div className="form-group"><label>Password</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Home Directory</label><input className="input" placeholder="public_html" value={form.homedir} onChange={(e) => setForm({ ...form, homedir: e.target.value })} /></div>
            <div className="form-group"><label>Quota (MB, 0=unlimited)</label><input type="number" className="input" value={form.quotaMb} onChange={(e) => setForm({ ...form, quotaMb: +e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ftpsOnly} onChange={(e) => setForm({ ...form, ftpsOnly: e.target.checked })} />
            <span className="text-sm text-slate-600">Require FTPS (encrypted connections only)</span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={delLoad} title="Delete FTP Account" message={`Delete FTP account "${deleting?.username}"?`} />
    </>
  );
}
