'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Lock, Plus, RefreshCw, Trash2, Upload, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface Cert { id: string; domain: string; issuer: string; expires_at: string; auto_renew: boolean; wildcard: boolean; }

function daysUntil(date: string) { return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000); }

export default function SSLPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssue, setShowIssue] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [issueForm, setIssueForm] = useState({ domain: '', wildcard: false });
  const [uploadForm, setUploadForm] = useState({ domain: '', cert: '', key: '', chain: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/cpanel/ssl').then((r) => setCerts(r.data.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleIssue = async () => {
    setSaving(true);
    try {
      const res = await api.post('/cpanel/ssl/issue', { domain: issueForm.domain, wildcard: issueForm.wildcard });
      toast.success(`SSL issuance queued — Job ID: ${res.data.data.jobId}`);
      setShowIssue(false);
      setTimeout(load, 3000);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleUpload = async () => {
    setSaving(true);
    try {
      await api.post('/cpanel/ssl/upload', uploadForm);
      toast.success('Certificate installed successfully');
      setShowUpload(false);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (domain: string) => {
    if (!confirm(`Remove SSL certificate for ${domain}?`)) return;
    try {
      await api.delete(`/cpanel/ssl/${domain}`);
      toast.success('Certificate removed');
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const toggleAutoRenew = async (cert: Cert) => {
    try {
      await api.patch(`/cpanel/ssl/${cert.domain}`, { autoRenew: !cert.auto_renew });
      toast.success(`Auto-renew ${!cert.auto_renew ? 'enabled' : 'disabled'}`);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <Header title="SSL / TLS" subtitle="Manage SSL certificates for your domains" />
      <main className="p-6 flex-1">
        <div className="card">
          <div className="p-4 border-b border-slate-100 section-header">
            <div>
              <div className="font-semibold text-slate-700 text-sm">SSL Certificates</div>
              <div className="text-xs text-slate-400 mt-0.5">{certs.length} certificate{certs.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowUpload(true)}><Upload size={13} /> Upload</button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowIssue(true)}><Plus size={13} /> Issue Free SSL</button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : certs.length === 0 ? (
            <EmptyState icon={<Lock size={36} />} title="No certificates yet" description="Issue a free Let's Encrypt SSL or upload a custom certificate"
              action={<button className="btn btn-primary btn-sm" onClick={() => setShowIssue(true)}><Plus size={13} /> Issue Free SSL</button>} />
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Domain</th><th>Issuer</th><th>Expires</th><th>Auto Renew</th><th>Actions</th></tr></thead>
                <tbody>
                  {certs.map((c) => {
                    const days = daysUntil(c.expires_at);
                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Lock size={13} className="text-green-500" />
                            <span className="font-medium text-slate-700">{c.domain}</span>
                            {c.wildcard && <span className="badge badge-info text-[10px]">wildcard</span>}
                          </div>
                        </td>
                        <td><span className="badge badge-gray capitalize">{c.issuer}</span></td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {days > 30 ? <CheckCircle size={13} className="text-green-500" />
                              : days > 0 ? <AlertTriangle size={13} className="text-amber-400" />
                              : <AlertTriangle size={13} className="text-red-500" />}
                            <span className={`text-xs font-medium ${days > 30 ? 'text-green-600' : days > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                              {days > 0 ? `${days} days` : 'Expired'}
                            </span>
                            <span className="text-slate-400 text-xs">({new Date(c.expires_at).toLocaleDateString()})</span>
                          </div>
                        </td>
                        <td>
                          <button onClick={() => toggleAutoRenew(c)} className={`btn btn-sm ${c.auto_renew ? 'btn-success' : 'btn-secondary'}`}>
                            <Clock size={12} /> {c.auto_renew ? 'On' : 'Off'}
                          </button>
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            {c.issuer === 'letsencrypt' && (
                              <button className="btn btn-icon btn-secondary text-slate-500" title="Renew" onClick={() => handleIssue()}>
                                <RefreshCw size={13} />
                              </button>
                            )}
                            <button className="btn btn-icon btn-danger" onClick={() => handleDelete(c.domain)} title="Remove">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Issue SSL Modal */}
      <Modal open={showIssue} onClose={() => setShowIssue(false)} title="Issue Let's Encrypt SSL"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowIssue(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleIssue} disabled={saving || !issueForm.domain}>
              {saving ? <span className="spinner border-white/30 border-t-white" /> : 'Issue Certificate'}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 leading-relaxed">
            Free SSL certificate from Let's Encrypt. Certificate will be issued and installed automatically (takes ~30s).
          </div>
          <div className="form-group">
            <label>Domain</label>
            <input className="input" placeholder="example.com" value={issueForm.domain} onChange={(e) => setIssueForm({ ...issueForm, domain: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={issueForm.wildcard} onChange={(e) => setIssueForm({ ...issueForm, wildcard: e.target.checked })} />
            <span className="text-sm text-slate-600">Wildcard certificate (*.example.com) — requires DNS-01</span>
          </label>
        </div>
      </Modal>

      {/* Upload SSL Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Custom Certificate" size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpload} disabled={saving}>
              {saving ? <span className="spinner border-white/30 border-t-white" /> : 'Install Certificate'}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div className="form-group">
            <label>Domain</label>
            <input className="input" placeholder="example.com" value={uploadForm.domain} onChange={(e) => setUploadForm({ ...uploadForm, domain: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Certificate (PEM)</label>
            <textarea className="input font-mono text-xs" rows={4} placeholder="-----BEGIN CERTIFICATE-----" value={uploadForm.cert} onChange={(e) => setUploadForm({ ...uploadForm, cert: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Private Key (PEM)</label>
            <textarea className="input font-mono text-xs" rows={4} placeholder="-----BEGIN PRIVATE KEY-----" value={uploadForm.key} onChange={(e) => setUploadForm({ ...uploadForm, key: e.target.value })} />
          </div>
          <div className="form-group">
            <label>CA Chain (optional)</label>
            <textarea className="input font-mono text-xs" rows={2} placeholder="Optional intermediate certificate" value={uploadForm.chain} onChange={(e) => setUploadForm({ ...uploadForm, chain: e.target.value })} />
          </div>
        </div>
      </Modal>
    </>
  );
}
