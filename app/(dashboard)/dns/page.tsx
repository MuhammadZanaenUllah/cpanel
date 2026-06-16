'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Globe, Plus, Trash2 } from 'lucide-react';

interface Domain { domain: string; type: string; }
interface DNSRecord { id: string; name: string; type: string; content: string; ttl: number; priority: number | null; }

const RECORD_TYPES = ['A','AAAA','CNAME','MX','TXT','SRV','CAA'];

export default function DNSPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<DNSRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [delLoad, setDelLoad] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'A', content: '', ttl: 3600, priority: '' });

  useEffect(() => {
    api.get('/cpanel/domains').then((r) => {
      setDomains(r.data.data);
      if (r.data.data.length > 0) { setSelectedDomain(r.data.data[0].domain); }
    }).catch((err) => toast.error('Failed to load domains: ' + getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!selectedDomain) return;
    setLoading(true);
    api.get(`/cpanel/dns/${selectedDomain}`).then((r) => setRecords(r.data.data as DNSRecord[])).catch((err) => toast.error('Failed to load DNS records: ' + getErrorMessage(err))).finally(() => setLoading(false));
  }, [selectedDomain]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post(`/cpanel/dns/${selectedDomain}`, { ...form, priority: form.priority ? Number(form.priority) : undefined });
      toast.success('DNS record added'); setShowAdd(false); setForm({ name: '', type: 'A', content: '', ttl: 3600, priority: '' });
      api.get(`/cpanel/dns/${selectedDomain}`).then((r) => setRecords(r.data.data as DNSRecord[]));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDelLoad(true);
    try {
      await api.delete(`/cpanel/dns/${selectedDomain}/${deleting.id}`);
      toast.success('Record deleted'); setDeleting(null);
      api.get(`/cpanel/dns/${selectedDomain}`).then((r) => setRecords(r.data.data as DNSRecord[]));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDelLoad(false); }
  };

  const TYPE_BADGE: Record<string, string> = { A: 'badge-success', AAAA: 'badge-success', MX: 'badge-warning', TXT: 'badge-info', CNAME: 'badge-gray', NS: 'badge-gray' };

  return (
    <>
      <Header title="DNS Zone Editor" subtitle="Manage DNS records for your domains" />
      <main className="p-6 flex-1">
        {/* Domain selector */}
        <div className="flex items-center gap-3 mb-4">
          <Globe size={16} className="text-slate-400 shrink-0" />
          <select className="input w-auto text-sm" value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} aria-label="Select active domain">
            {domains.map((d) => <option key={d.domain} value={d.domain}>{d.domain}</option>)}
          </select>
        </div>

        <div className="card">
          <div className="p-4 border-b border-slate-100 section-header">
            <div className="font-semibold text-slate-700 text-sm">{records.length} DNS records for {selectedDomain}</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add Record</button>
          </div>
          {loading ? <div className="flex justify-center py-12"><div className="spinner" /></div>
            : records.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">No DNS records found</div>
            : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Name</th><th>Type</th><th>Content</th><th>TTL</th><th>Priority</th><th></th></tr></thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td><span className="font-mono text-xs text-slate-700">{r.name}</span></td>
                        <td><span className={`badge ${TYPE_BADGE[r.type] || 'badge-gray'}`}>{r.type}</span></td>
                        <td><span className="text-xs text-slate-600 font-mono truncate-cell">{r.content}</span></td>
                        <td><span className="text-xs text-slate-400">{r.ttl}s</span></td>
                        <td><span className="text-xs text-slate-400">{r.priority ?? '—'}</span></td>
                        <td><button className="btn btn-icon btn-danger" onClick={() => setDeleting(r)} aria-label={`Delete DNS record ${r.name}`}><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`Add DNS Record — ${selectedDomain}`}
        footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd} disabled={saving || !form.content}>{saving ? <span className="spinner border-white/30 border-t-white" /> : 'Add Record'}</button></>}>
        <div className="space-y-4">
          <div className="form-row">
            <div className="form-group"><label>Name</label><input className="input font-mono text-sm" placeholder={`shop.${selectedDomain}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label>Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {RECORD_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label>Content / Value</label><input className="input font-mono text-sm" placeholder={form.type === 'A' ? '65.21.125.14' : form.type === 'MX' ? 'mail.example.com' : 'value'} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label>TTL (seconds)</label><input type="number" className="input" value={form.ttl} onChange={(e) => setForm({ ...form, ttl: +e.target.value })} /></div>
            {(form.type === 'MX' || form.type === 'SRV') && (
              <div className="form-group"><label>Priority</label><input type="number" className="input" placeholder="10" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={delLoad} title="Delete DNS Record" message={`Delete ${deleting?.type} record for "${deleting?.name}"?`} />
    </>
  );
}
