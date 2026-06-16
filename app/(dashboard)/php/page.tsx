'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { FileCode, Save } from 'lucide-react';

interface DomainConfig { id: string; domain: string; type: string; php_version: string; }

const PHP_VERSIONS = ['8.1', '8.2', '8.3', '8.4'];

export default function PHPPage() {
  const [domains, setDomains] = useState<DomainConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    api.get('/cpanel/php/config').then((r) => {
      setDomains(r.data.data);
      const init: Record<string, string> = {};
      r.data.data.forEach((d: DomainConfig) => { init[d.domain] = d.php_version; });
      setVersions(init);
    }).finally(() => setLoading(false));
  }, []);

  const save = async (domain: string) => {
    setSaving(domain);
    try {
      await api.patch(`/cpanel/php/config/${domain}`, { phpVersion: versions[domain] });
      toast.success(`PHP ${versions[domain]} applied to ${domain}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(null); }
  };

  return (
    <>
      <Header title="PHP Configuration" subtitle="Set PHP version per domain" />
      <main className="p-6 flex-1">
        <div className="card">
          <div className="p-4 border-b border-slate-100">
            <div className="font-semibold text-slate-700 text-sm">Domain PHP Versions</div>
            <div className="text-xs text-slate-400 mt-0.5">Changes take effect immediately — Apache vhost is reloaded automatically</div>
          </div>
          {loading ? <div className="flex justify-center py-12"><div className="spinner" /></div>
            : domains.length === 0 ? <div className="empty-state"><FileCode size={32} className="mx-auto text-slate-300 mb-2" /><p className="text-sm text-slate-400">No domains configured</p></div>
            : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Domain</th><th>Type</th><th>PHP Version</th><th></th></tr></thead>
                  <tbody>
                    {domains.map((d) => (
                      <tr key={d.id}>
                        <td><span className="font-medium text-slate-700">{d.domain}</span></td>
                        <td><span className="badge badge-gray capitalize text-xs">{d.type}</span></td>
                        <td>
                          <select
                            className="input w-auto text-sm py-1.5"
                            value={versions[d.domain] || d.php_version}
                            onChange={(e) => setVersions({ ...versions, [d.domain]: e.target.value })}
                          >
                            {PHP_VERSIONS.map((v) => <option key={v} value={v}>PHP {v}</option>)}
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => save(d.domain)}
                            disabled={saving === d.domain || versions[d.domain] === d.php_version}
                          >
                            {saving === d.domain ? <span className="spinner border-white/30 border-t-white" /> : <><Save size={12} /> Apply</>}
                          </button>
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
