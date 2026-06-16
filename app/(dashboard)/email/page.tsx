'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, Plus, Trash2, Key, Forward, Repeat2, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface EmailAccount { id: string; local_part: string; domain: string; quota_mb: number; status: string; }
interface Forwarder { id: string; source: string; destination: string; type: string; }

export default function EmailPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [forwarders, setForwarders] = useState<Forwarder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'accounts'|'forwarders'|'auth'>('accounts');
  const [showAdd, setShowAdd] = useState(false);
  const [showFwd, setShowFwd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [delLoad, setDelLoad] = useState(false);
  const [form, setForm] = useState({ localPart: '', domain: '', password: '', quotaMb: 1024 });
  const [fwdForm, setFwdForm] = useState({ source: '', destination: '', type: 'local' });
  const [dkimDomain, setDkimDomain] = useState('');
  const [spfForm, setSpfForm] = useState({ domain: '', mechanisms: 'mx a ~all' });

  const loadAll = async () => {
    await Promise.all([
      api.get('/cpanel/email/accounts').then((r) => setAccounts(r.data.data)).catch(() => {}),
      api.get('/cpanel/email/forwarders').then((r) => setForwarders(r.data.data)).catch(() => {}),
    ]);
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const openWebmail = async (email: string) => {
    try {
      const res = await api.get('/cpanel/email/webmail', { params: { email } });
      window.open(res.data.data.url, '_blank');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post('/cpanel/email/accounts', form);
      toast.success(`${form.localPart}@${form.domain} created`);
      setShowAdd(false); setForm({ localPart: '', domain: '', password: '', quotaMb: 1024 }); loadAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDelLoad(true);
    try {
      await api.delete(`/cpanel/email/accounts/${deleting}`);
      toast.success('Email account deleted'); setDeleting(null); loadAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDelLoad(false); }
  };

  const handleAddFwd = async () => {
    setSaving(true);
    try {
      await api.post('/cpanel/email/forwarders', fwdForm);
      toast.success('Forwarder created'); setShowFwd(false); loadAll();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const deleteFwd = async (id: string) => {
    if (!confirm('Delete this forwarder?')) return;
    try { await api.delete(`/cpanel/email/forwarders/${id}`); toast.success('Forwarder removed'); loadAll(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  const generateDkim = async () => {
    if (!dkimDomain) return;
    try {
      const res = await api.post('/cpanel/email/auth/dkim', { domain: dkimDomain });
      toast.success(`DKIM setup queued — Job ${res.data.data.jobId}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const setSPF = async () => {
    if (!spfForm.domain) return;
    try {
      await api.post('/cpanel/email/auth/spf', { domain: spfForm.domain, mechanisms: spfForm.mechanisms.split(' ') });
      toast.success('SPF record set');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <Header title="Email Management" subtitle="Accounts, forwarders and authentication" />
      <main className="p-6 flex-1">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 w-fit shadow-sm border border-slate-100">
          {(['accounts','forwarders','auth'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-[#4669fa] text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {t === 'accounts' ? '📧 Accounts' : t === 'forwarders' ? '↗ Forwarders' : '🔒 DKIM / SPF'}
            </button>
          ))}
        </div>

        {/* Accounts tab */}
        {tab === 'accounts' && (
          <div className="card">
            <div className="p-4 border-b border-slate-100 section-header">
              <div className="font-semibold text-slate-700 text-sm">{accounts.length} email account{accounts.length !== 1 ? 's' : ''}</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New Account</button>
            </div>
            {loading ? <div className="flex justify-center py-12"><div className="spinner" /></div>
              : accounts.length === 0 ? <EmptyState icon={<Mail size={32} />} title="No email accounts" action={<button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New Account</button>} />
              : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Email Address</th><th>Quota</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {accounts.map((a) => (
                        <tr key={a.id}>
                          <td><div className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /><span className="font-medium text-slate-700">{a.local_part}@{a.domain}</span></div></td>
                          <td><span className="text-xs text-slate-500">{a.quota_mb >= 1024 ? `${(a.quota_mb/1024).toFixed(0)} GB` : `${a.quota_mb} MB`}</span></td>
                          <td><span className={`badge ${a.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span></td>
                          <td>
                            <div className="flex gap-1.5">
                              <button className="btn btn-icon btn-secondary text-slate-400" title="Access Webmail" onClick={() => openWebmail(`${a.local_part}@${a.domain}`)}><ExternalLink size={13} /></button>
                              <button className="btn btn-icon btn-secondary text-slate-400" title="Change Password" onClick={() => toast('Password change — coming soon')}><Key size={13} /></button>
                              <button className="btn btn-icon btn-danger" onClick={() => setDeleting(a.id)}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* Forwarders tab */}
        {tab === 'forwarders' && (
          <div className="card">
            <div className="p-4 border-b border-slate-100 section-header">
              <div className="font-semibold text-slate-700 text-sm">{forwarders.length} forwarder{forwarders.length !== 1 ? 's' : ''}</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowFwd(true)}><Plus size={13} /> Add Forwarder</button>
            </div>
            {forwarders.length === 0 ? <EmptyState icon={<Forward size={32} />} title="No forwarders" action={<button className="btn btn-primary btn-sm" onClick={() => setShowFwd(true)}><Plus size={13} /> Add Forwarder</button>} />
              : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Source</th><th>Destination</th><th>Type</th><th></th></tr></thead>
                    <tbody>
                      {forwarders.map((f) => (
                        <tr key={f.id}>
                          <td><span className="font-medium text-slate-700">{f.source}</span></td>
                          <td><span className="text-sm text-slate-500">{f.destination}</span></td>
                          <td><span className="badge badge-gray capitalize">{f.type}</span></td>
                          <td><button className="btn btn-icon btn-danger" onClick={() => deleteFwd(f.id)}><Trash2 size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {/* Auth tab */}
        {tab === 'auth' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4"><Shield size={16} className="text-[#4669fa]" /><span className="font-semibold text-slate-700 text-sm">DKIM Keys</span></div>
              <p className="text-xs text-slate-500 mb-3">Generate and publish DKIM keypair for a domain to authenticate outbound email.</p>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="example.com" value={dkimDomain} onChange={(e) => setDkimDomain(e.target.value)} />
                <button className="btn btn-primary" onClick={generateDkim}>Generate</button>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4"><Shield size={16} className="text-[#4669fa]" /><span className="font-semibold text-slate-700 text-sm">SPF Record</span></div>
              <p className="text-xs text-slate-500 mb-3">Set an SPF record to specify which servers are allowed to send email for your domain.</p>
              <div className="form-group"><label>Domain</label><input className="input" placeholder="example.com" value={spfForm.domain} onChange={(e) => setSpfForm({ ...spfForm, domain: e.target.value })} /></div>
              <div className="form-group"><label>Mechanisms (space-separated)</label><input className="input font-mono text-xs" placeholder="mx a ~all" value={spfForm.mechanisms} onChange={(e) => setSpfForm({ ...spfForm, mechanisms: e.target.value })} /></div>
              <button className="btn btn-primary" onClick={setSPF}>Set SPF</button>
            </div>
          </div>
        )}
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Email Account"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? <span className="spinner border-white/30 border-t-white" /> : 'Create'}</button></>}>
        <div className="space-y-4">
          <div className="form-row">
            <div className="form-group"><label>Local Part</label><input className="input" placeholder="info" value={form.localPart} onChange={(e) => setForm({ ...form, localPart: e.target.value })} /></div>
            <div className="form-group"><label>Domain</label><input className="input" placeholder="example.com" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Password</label><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="form-group"><label>Quota (MB)</label><input type="number" className="input" value={form.quotaMb} onChange={(e) => setForm({ ...form, quotaMb: +e.target.value })} /></div>
          </div>
        </div>
      </Modal>

      <Modal open={showFwd} onClose={() => setShowFwd(false)} title="Add Email Forwarder"
        footer={<><button className="btn btn-secondary" onClick={() => setShowFwd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddFwd} disabled={saving}>{saving ? <span className="spinner border-white/30 border-t-white" /> : 'Add Forwarder'}</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label>Source Address</label><input className="input" placeholder="sales@example.com" value={fwdForm.source} onChange={(e) => setFwdForm({ ...fwdForm, source: e.target.value })} /></div>
          <div className="form-group"><label>Destination</label><input className="input" placeholder="john@gmail.com or |/path/script.sh" value={fwdForm.destination} onChange={(e) => setFwdForm({ ...fwdForm, destination: e.target.value })} /></div>
          <div className="form-group"><label>Type</label>
            <select className="input" value={fwdForm.type} onChange={(e) => setFwdForm({ ...fwdForm, type: e.target.value })}>
              <option value="local">Forward to email</option>
              <option value="pipe">Pipe to script</option>
              <option value="discard">Discard (blackhole)</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={delLoad} title="Delete Email Account" message="This will permanently delete the email account and all its messages." />
    </>
  );
}
