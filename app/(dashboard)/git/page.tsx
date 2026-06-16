'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { GitBranch, Plus, Trash2, Play, Copy, CheckCheck } from 'lucide-react';

interface Repo { id: string; repo_path: string; branch: string; provider: string; webhook_secret: string; last_deployed_at: string; last_deploy_status: string; }

export default function GitPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ repoPath: 'sites/myapp', branch: 'main', provider: 'github', deployScript: 'npm install && npm run build' });

  const load = () => api.get('/cpanel/git/repos').then((r) => setRepos(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post('/cpanel/git/repos', form);
      toast.success('Repository created'); setShowAdd(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const deploy = async (id: string) => {
    setDeploying(id);
    try {
      await api.post(`/cpanel/git/${id}/deploy`);
      toast.success('Deploy triggered'); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeploying(null); }
  };

  const deleteRepo = async (id: string) => {
    if (!confirm('Delete this repository?')) return;
    try { await api.delete(`/cpanel/git/repos/${id}`); toast.success('Repository removed'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  const copyWebhook = (repo: Repo) => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://65.21.125.14:2083';
    const url = `${base}/cpanel/git/${repo.id}/webhook`;
    navigator.clipboard.writeText(url);
    setCopied(repo.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <Header title="Git Deploy" subtitle="Auto-deploy on push with GitHub, GitLab or Bitbucket webhooks" />
      <main className="p-6 flex-1">
        <div className="card">
          <div className="p-4 border-b border-slate-100 section-header">
            <div className="font-semibold text-slate-700 text-sm">{repos.length} repositor{repos.length !== 1 ? 'ies' : 'y'}</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add Repository</button>
          </div>
          {loading ? <div className="flex justify-center py-12"><div className="spinner" /></div>
            : repos.length === 0 ? <EmptyState icon={<GitBranch size={32} />} title="No repositories" description="Connect a Git repo to enable auto-deploy on push" action={<button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add Repository</button>} />
            : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Repository Path</th><th>Branch</th><th>Provider</th><th>Last Deploy</th><th>Actions</th></tr></thead>
                  <tbody>
                    {repos.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="flex items-center gap-2"><GitBranch size={13} className="text-slate-400" /><span className="font-mono text-sm text-slate-700">{r.repo_path}</span></div>
                        </td>
                        <td><span className="badge badge-info text-[11px]">{r.branch}</span></td>
                        <td><span className="capitalize text-sm text-slate-500">{r.provider}</span></td>
                        <td>
                          {r.last_deployed_at
                            ? <div><span className={`badge ${r.last_deploy_status === 'success' ? 'badge-success' : 'badge-danger'}`}>{r.last_deploy_status}</span><div className="text-[11px] text-slate-400">{new Date(r.last_deployed_at).toLocaleString()}</div></div>
                            : <span className="text-slate-400 text-xs">Never</span>}
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            <button className="btn btn-sm btn-secondary" onClick={() => copyWebhook(r)} title="Copy webhook URL">
                              {copied === r.id ? <CheckCheck size={12} className="text-green-500" /> : <Copy size={12} />} Webhook
                            </button>
                            <button className="btn btn-icon btn-success" onClick={() => deploy(r.id)} disabled={deploying === r.id} title="Deploy now">
                              {deploying === r.id ? <span className="spinner w-3 h-3 border border-green-400" /> : <Play size={12} />}
                            </button>
                            <button className="btn btn-icon btn-danger" onClick={() => deleteRepo(r.id)}><Trash2 size={13} /></button>
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

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Git Repository"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? <span className="spinner border-white/30 border-t-white" /> : 'Add Repository'}</button></>}>
        <div className="space-y-4">
          <div className="form-row">
            <div className="form-group"><label>Repository Path</label><input className="input font-mono text-sm" placeholder="sites/myapp" value={form.repoPath} onChange={(e) => setForm({ ...form, repoPath: e.target.value })} /></div>
            <div className="form-group"><label>Branch</label><input className="input" placeholder="main" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></div>
          </div>
          <div className="form-group"><label>Provider</label>
            <select className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
              <option value="github">GitHub</option>
              <option value="gitlab">GitLab</option>
              <option value="bitbucket">Bitbucket</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group"><label>Deploy Script (runs after git pull)</label>
            <textarea className="input font-mono text-sm" rows={3} placeholder="npm install && npm run build" value={form.deployScript} onChange={(e) => setForm({ ...form, deployScript: e.target.value })} />
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-600">
            After adding, copy the webhook URL and add it to your GitHub/GitLab/Bitbucket repository settings. Set content type to <code>application/json</code>.
          </div>
        </div>
      </Modal>
    </>
  );
}
