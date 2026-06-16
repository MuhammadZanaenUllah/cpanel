'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Box, Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react';

interface AppDef { appType: string; name: string; latestVersion: string; description: string; }
interface Installation { id: string; app_type: string; domain: string; install_path: string; version: string; admin_email: string; status: string; installed_at: string; }

const APP_ICONS: Record<string, string> = {
  wordpress: '🔵', joomla: '🟠', drupal: '🟢', ghost: '⚫', laravel: '🔴', nextcloud: '🔷', magento: '🟤',
};

export default function AppsPage() {
  const [catalog, setCatalog] = useState<AppDef[]>([]);
  const [installed, setInstalled] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstall, setShowInstall] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppDef | null>(null);
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState<{ domain: string }[]>([]);
  const [form, setForm] = useState({ domain: '', installPath: '/', adminUser: 'admin', adminEmail: '', adminPassword: '', dbName: '', siteTitle: '' });

  const load = async () => {
    await Promise.all([
      api.get('/cpanel/apps/catalog').then((r) => setCatalog(r.data.data)).catch(() => {}),
      api.get('/cpanel/apps/installed').then((r) => setInstalled(r.data.data)).catch(() => {}),
      api.get('/cpanel/domains').then((r) => setDomains(r.data.data)).catch(() => {}),
    ]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openInstall = (app: AppDef) => { setSelectedApp(app); setShowInstall(true); };

  const handleInstall = async () => {
    if (!selectedApp) return;
    setSaving(true);
    try {
      const res = await api.post('/cpanel/apps/install', { appType: selectedApp.appType, ...form, dbName: form.dbName || `${selectedApp.appType.slice(0,5)}_${Date.now().toString().slice(-5)}` });
      toast.success(`${selectedApp.name} installation started — Job: ${res.data.data.jobId}`);
      setShowInstall(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const deleteInstall = async (id: string, appType: string) => {
    if (!confirm(`Delete this ${appType} installation? This will also remove its database.`)) return;
    try { await api.delete(`/cpanel/apps/installed/${id}`); toast.success('Installation removed'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  const updateInstall = async (id: string) => {
    try {
      const res = await api.post(`/cpanel/apps/installed/${id}/update`);
      toast.success(`Update started — Job: ${res.data.data.jobId}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <Header title="Application Installer" subtitle="One-click install for WordPress, Joomla, Drupal and more" />
      <main className="p-6 flex-1 space-y-6">
        {/* Catalog */}
        <div>
          <h2 className="font-semibold text-slate-700 text-sm mb-3">Available Applications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {loading ? Array(8).fill(0).map((_, i) => <div key={i} className="card p-4 h-24 animate-pulse bg-slate-100" />) : catalog.map((app) => (
              <button key={app.appType} onClick={() => openInstall(app)}
                className="card p-4 text-left hover:shadow-md hover:border-[#4669fa]/30 transition-all group border border-transparent">
                <div className="text-2xl mb-1.5">{APP_ICONS[app.appType] || '📦'}</div>
                <div className="font-semibold text-slate-700 text-sm group-hover:text-[#4669fa]">{app.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">v{app.latestVersion}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">{app.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Installed */}
        <div className="card">
          <div className="p-4 border-b border-slate-100 section-header">
            <div className="font-semibold text-slate-700 text-sm">{installed.length} installed app{installed.length !== 1 ? 's' : ''}</div>
          </div>
          {installed.length === 0 ? <div className="empty-state"><Box size={32} className="mx-auto text-slate-300 mb-2" /><p className="text-sm text-slate-400">No apps installed yet</p></div>
            : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>App</th><th>Domain / Path</th><th>Version</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {installed.map((inst) => (
                      <tr key={inst.id}>
                        <td><div className="flex items-center gap-2"><span className="text-lg">{APP_ICONS[inst.app_type] || '📦'}</span><span className="font-medium text-slate-700 capitalize">{inst.app_type}</span></div></td>
                        <td><div><span className="text-sm text-slate-600">{inst.domain}</span><span className="text-slate-400 text-xs ml-1">{inst.install_path}</span></div></td>
                        <td><span className="text-xs font-mono text-slate-500">{inst.version || '—'}</span></td>
                        <td><span className={`badge ${inst.status === 'active' ? 'badge-success' : inst.status === 'installing' ? 'badge-warning' : inst.status === 'failed' ? 'badge-danger' : 'badge-gray'}`}>{inst.status}</span></td>
                        <td><div className="flex gap-1.5">
                          <a href={`https://${inst.domain}${inst.install_path}`} target="_blank" rel="noopener noreferrer" className="btn btn-icon btn-secondary text-slate-400"><ExternalLink size={13} /></a>
                          {inst.status === 'active' && <button className="btn btn-icon btn-secondary text-slate-400" onClick={() => updateInstall(inst.id)} title="Update"><RefreshCw size={13} /></button>}
                          <button className="btn btn-icon btn-danger" onClick={() => deleteInstall(inst.id, inst.app_type)}><Trash2 size={13} /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </main>

      <Modal open={showInstall} onClose={() => setShowInstall(false)} title={`Install ${selectedApp?.name}`} size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setShowInstall(false)}>Cancel</button><button className="btn btn-primary" onClick={handleInstall} disabled={saving}>{saving ? <span className="spinner border-white/30 border-t-white" /> : <><Plus size={13} /> Install</>}</button></>}>
        <div className="space-y-4">
          <div className="form-row">
            <div className="form-group"><label>Domain</label>
              <select className="input" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
                <option value="">Select domain...</option>
                {domains.map((d) => <option key={d.domain} value={d.domain}>{d.domain}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Install Path</label><input className="input font-mono" placeholder="/" value={form.installPath} onChange={(e) => setForm({ ...form, installPath: e.target.value })} /></div>
          </div>
          <div className="form-group"><label>Site Title</label><input className="input" placeholder="My Website" value={form.siteTitle} onChange={(e) => setForm({ ...form, siteTitle: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label>Admin Username</label><input className="input" placeholder="admin" value={form.adminUser} onChange={(e) => setForm({ ...form, adminUser: e.target.value })} /></div>
            <div className="form-group"><label>Admin Email</label><input className="input" placeholder="admin@example.com" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Admin Password</label><input type="password" className="input" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} /></div>
            <div className="form-group"><label>Database Name</label><input className="input font-mono text-sm" placeholder="wp_main (auto if empty)" value={form.dbName} onChange={(e) => setForm({ ...form, dbName: e.target.value })} /></div>
          </div>
        </div>
      </Modal>
    </>
  );
}
