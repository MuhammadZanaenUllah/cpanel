'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Globe, Plus, Trash2, ExternalLink, Lock, ToggleRight } from 'lucide-react';

interface Domain {
  id: string; domain: string; type: string;
  php_version: string; ssl_enabled: boolean;
  force_https: boolean; status: string;
  document_root: string;
}

const TYPE_COLORS: Record<string, string> = {
  primary: 'badge-info', addon: 'badge-success',
  subdomain: 'badge-warning', parked: 'badge-gray', redirect: 'badge-gray',
};

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<Domain | null>(null);
  const [form, setForm] = useState({ domain: '', type: 'addon', phpVersion: '8.2' });
  const [saving, setSaving] = useState(false);
  const [delLoad, setDelLoad] = useState(false);

  const load = () => api.get('/cpanel/domains').then((r) => setDomains(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post('/cpanel/domains', { domain: form.domain, type: form.type, phpVersion: form.phpVersion });
      toast.success('Domain added successfully');
      setShowAdd(false);
      setForm({ domain: '', type: 'addon', phpVersion: '8.2' });
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDelLoad(true);
    try {
      await api.delete(`/cpanel/domains/${deleting.domain}`);
      toast.success('Domain removed');
      setDeleting(null);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDelLoad(false); }
  };

  const toggleHttps = async (d: Domain) => {
    try {
      await api.patch(`/cpanel/domains/${d.domain}`, { forceHttps: !d.force_https });
      toast.success(`Force HTTPS ${!d.force_https ? 'enabled' : 'disabled'}`);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <Header title="Domains" subtitle="Manage your addon, subdomain and parked domains" />
      <main className="p-6 flex-1">
        <div className="card">
          <div className="p-4 border-b border-slate-100 section-header">
            <div>
              <div className="font-semibold text-slate-700 text-sm">All Domains</div>
              <div className="text-xs text-slate-400 mt-0.5">{domains.length} domain{domains.length !== 1 ? 's' : ''}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Domain
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : domains.length === 0 ? (
            <EmptyState icon={<Globe size={36} />} title="No domains yet" description="Add an addon domain, subdomain or parked domain" action={<button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Domain</button>} />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Domain</th><th>Type</th><th>PHP</th><th>SSL</th><th>HTTPS</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {domains.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{d.domain}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 ml-5">{d.document_root}</div>
                      </td>
                      <td><span className={`badge ${TYPE_COLORS[d.type] || 'badge-gray'}`}>{d.type}</span></td>
                      <td><span className="text-xs text-slate-500 font-mono">PHP {d.php_version}</span></td>
                      <td>
                        {d.ssl_enabled
                          ? <span className="badge badge-success">Active</span>
                          : <span className="badge badge-gray">None</span>}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleHttps(d)}
                          className={`btn btn-sm ${d.force_https ? 'btn-success' : 'btn-secondary'}`}
                          disabled={d.type === 'primary'}
                        >
                          <ToggleRight size={12} /> {d.force_https ? 'On' : 'Off'}
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer" className="btn btn-icon btn-secondary text-slate-400" title="Open">
                            <ExternalLink size={13} />
                          </a>
                          {d.type !== 'primary' && (
                            <button className="btn btn-icon btn-danger" onClick={() => setDeleting(d)} title="Delete">
                              <Trash2 size={13} />
                            </button>
                          )}
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

      {/* Add Domain Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Domain"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !form.domain}>
              {saving ? <span className="spinner border-white/30 border-t-white" /> : 'Add Domain'}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div className="form-group">
            <label>Domain Name</label>
            <input className="input" placeholder="shop.example.com" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="addon">Addon Domain</option>
                <option value="subdomain">Subdomain</option>
                <option value="parked">Parked</option>
                <option value="redirect">Redirect</option>
              </select>
            </div>
            <div className="form-group">
              <label>PHP Version</label>
              <select className="input" value={form.phpVersion} onChange={(e) => setForm({ ...form, phpVersion: e.target.value })}>
                {['8.1','8.2','8.3','8.4'].map((v) => <option key={v} value={v}>PHP {v}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={delLoad}
        title="Remove Domain"
        message={`Remove "${deleting?.domain}"? This will also delete the Apache vhost and DNS record.`}
      />
    </>
  );
}
