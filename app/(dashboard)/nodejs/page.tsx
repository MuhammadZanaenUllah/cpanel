'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Cpu, Plus, Trash2, RotateCcw, Play } from 'lucide-react';

interface NVMInfo { nvmInstalled: boolean; installedVersions: string[]; activeVersion: string | null; }
interface PM2Process { name: string; pid: number; pm_id: number; status: string; cpu: number; memory: number; restarts: number; }

export default function NodeJSPage() {
  const [info, setInfo] = useState<NVMInfo | null>(null);
  const [processes, setProcesses] = useState<PM2Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [installVersion, setInstallVersion] = useState('');
  const [installing, setInstalling] = useState(false);
  const [showStartApp, setShowStartApp] = useState(false);
  const [appForm, setAppForm] = useState({ name: '', script: 'dist/index.js', cwd: 'sites/myapp', env_port: '3000' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    await Promise.all([
      api.get('/cpanel/nodejs/info').then((r) => setInfo(r.data.data)).catch(() => {}),
      api.get('/cpanel/nodejs/processes').then((r) => setProcesses(r.data.data || [])).catch(() => {}),
    ]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const installNode = async () => {
    if (!installVersion) return;
    setInstalling(true);
    try {
      await api.post('/cpanel/nodejs/install', { version: installVersion });
      toast.success(`Node.js ${installVersion} installed`); setInstallVersion(''); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setInstalling(false); }
  };

  const setActive = async (version: string) => {
    try {
      await api.patch('/cpanel/nodejs/active', { version });
      toast.success(`Node.js ${version} set as active`); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const startApp = async () => {
    setSaving(true);
    try {
      await api.post('/cpanel/nodejs/processes', { name: appForm.name, script: appForm.script, cwd: appForm.cwd, env: { PORT: appForm.env_port } });
      toast.success(`PM2 app "${appForm.name}" started`); setShowStartApp(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const restartApp = async (name: string) => {
    try { await api.post(`/cpanel/nodejs/processes/${name}/restart`); toast.success('Restarted'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  const deleteApp = async (name: string) => {
    if (!confirm(`Stop and delete PM2 app "${name}"?`)) return;
    try { await api.delete(`/cpanel/nodejs/processes/${name}`); toast.success('App removed'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <Header title="Node.js Manager" subtitle="Manage Node.js versions and PM2 applications" />
      <main className="p-6 flex-1 space-y-4">
        {/* NVM Info */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4"><Cpu size={16} className="text-[#4669fa]" /><span className="font-semibold text-slate-700 text-sm">Node.js Versions (NVM)</span></div>
          {loading ? <div className="spinner" />
            : !info?.nvmInstalled ? (
              <div>
                <p className="text-sm text-slate-500 mb-3">NVM not installed. Install a Node.js version to set it up automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mb-3">
                  {info.installedVersions.map((v) => (
                    <div key={v} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${v === info.activeVersion ? 'border-[#4669fa] bg-blue-50 text-[#4669fa]' : 'border-slate-200 text-slate-600'}`}>
                      <span className="font-mono">{v}</span>
                      {v === info.activeVersion ? <span className="badge badge-info text-[10px]">active</span>
                        : <button className="text-[11px] text-[#4669fa] hover:underline" onClick={() => setActive(v)}>Set Active</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          <div className="flex gap-2 mt-3">
            <input className="input flex-1 max-w-xs" placeholder="v20.11.0" value={installVersion} onChange={(e) => setInstallVersion(e.target.value)} />
            <button className="btn btn-primary" onClick={installNode} disabled={installing || !installVersion}>
              {installing ? <span className="spinner border-white/30 border-t-white" /> : 'Install Version'}
            </button>
          </div>
        </div>

        {/* PM2 Processes */}
        <div className="card">
          <div className="p-4 border-b border-slate-100 section-header">
            <div className="font-semibold text-slate-700 text-sm">{processes.length} PM2 app{processes.length !== 1 ? 's' : ''}</div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={load}><RotateCcw size={13} /></button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowStartApp(true)}><Plus size={13} /> Start App</button>
            </div>
          </div>
          {processes.length === 0 ? (
            <div className="empty-state"><Cpu size={32} className="mx-auto text-slate-300 mb-2" /><p className="text-sm text-slate-400">No PM2 apps running</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>App Name</th><th>PID</th><th>Status</th><th>CPU</th><th>Memory</th><th>Restarts</th><th>Actions</th></tr></thead>
                <tbody>
                  {processes.map((p) => (
                    <tr key={p.pm_id}>
                      <td><span className="font-medium text-slate-700">{p.name}</span></td>
                      <td><span className="text-xs font-mono text-slate-400">{p.pid || '—'}</span></td>
                      <td><span className={`badge ${p.status === 'online' ? 'badge-success' : p.status === 'stopped' ? 'badge-gray' : 'badge-danger'}`}>{p.status}</span></td>
                      <td><span className="text-xs text-slate-500">{p.cpu?.toFixed(1)}%</span></td>
                      <td><span className="text-xs text-slate-500">{p.memory ? `${(p.memory / 1024 / 1024).toFixed(0)} MB` : '—'}</span></td>
                      <td><span className="text-xs text-slate-500">{p.restarts}</span></td>
                      <td><div className="flex gap-1.5">
                        <button className="btn btn-icon btn-success" onClick={() => restartApp(p.name)} title="Restart"><RotateCcw size={13} /></button>
                        <button className="btn btn-icon btn-danger" onClick={() => deleteApp(p.name)}><Trash2 size={13} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Modal open={showStartApp} onClose={() => setShowStartApp(false)} title="Start PM2 App"
        footer={<><button className="btn btn-secondary" onClick={() => setShowStartApp(false)}>Cancel</button><button className="btn btn-primary" onClick={startApp} disabled={saving}>{saving ? <span className="spinner border-white/30 border-t-white" /> : <><Play size={13} /> Start App</>}</button></>}>
        <div className="space-y-4">
          <div className="form-row">
            <div className="form-group"><label>App Name</label><input className="input" placeholder="my-api" value={appForm.name} onChange={(e) => setAppForm({ ...appForm, name: e.target.value })} /></div>
            <div className="form-group"><label>Port</label><input className="input" placeholder="3000" value={appForm.env_port} onChange={(e) => setAppForm({ ...appForm, env_port: e.target.value })} /></div>
          </div>
          <div className="form-group"><label>Working Directory</label><input className="input font-mono text-sm" placeholder="sites/myapp" value={appForm.cwd} onChange={(e) => setAppForm({ ...appForm, cwd: e.target.value })} /></div>
          <div className="form-group"><label>Entry Script</label><input className="input font-mono text-sm" placeholder="dist/index.js" value={appForm.script} onChange={(e) => setAppForm({ ...appForm, script: e.target.value })} /></div>
        </div>
      </Modal>
    </>
  );
}
