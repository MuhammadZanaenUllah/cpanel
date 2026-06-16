'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { Database, Plus, Trash2, UserPlus, Link2, ExternalLink } from 'lucide-react';

interface DB { id: string; db_name: string; display_name: string; }
interface DBUser { id: string; username: string; }
interface Assignment { id: string; db_name: string; db_user: string; privileges: string; }

export default function DatabasesPage() {
  const [dbs, setDbs] = useState<DB[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'databases'|'users'|'assignments'>('databases');
  const [showAddDb, setShowAddDb] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbForm, setDbForm] = useState({ name: '' });
  const [userForm, setUserForm] = useState({ username: '', password: '' });
  const [assignForm, setAssignForm] = useState({ database: '', username: '', privileges: 'ALL PRIVILEGES' });

  const load = async () => {
    await Promise.all([
      api.get('/cpanel/databases/mysql').then((r) => setDbs(r.data.data)).catch(() => {}),
      api.get('/cpanel/databases/mysql/users').then((r) => setUsers(r.data.data)).catch(() => {}),
      api.get('/cpanel/databases/mysql/assignments').then((r) => setAssignments(r.data.data)).catch(() => {}),
    ]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createDb = async () => {
    setSaving(true);
    try {
      const res = await api.post('/cpanel/databases/mysql', { name: dbForm.name });
      toast.success(`Database "${res.data.data.dbName}" created`);
      setShowAddDb(false); setDbForm({ name: '' }); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const createUser = async () => {
    setSaving(true);
    try {
      const res = await api.post('/cpanel/databases/mysql/users', userForm);
      toast.success(`User "${res.data.data.username}" created`);
      setShowAddUser(false); setUserForm({ username: '', password: '' }); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const assignUser = async () => {
    setSaving(true);
    try {
      await api.post('/cpanel/databases/mysql/assignments', assignForm);
      toast.success('User assigned to database'); setShowAssign(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const deleteDb = async (name: string) => {
    if (!confirm(`Delete database "${name}"? All data will be lost.`)) return;
    try { await api.delete(`/cpanel/databases/mysql/${name}`); toast.success('Database deleted'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  const deleteUser = async (username: string) => {
    if (!confirm(`Delete user "${username}"?`)) return;
    try { await api.delete(`/cpanel/databases/mysql/users/${username}`); toast.success('User deleted'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };

  const openPhpMyAdmin = async (dbName: string) => {
    try {
      const res = await api.get(`/cpanel/databases/mysql/${dbName}/phpmyadmin`);
      window.open(res.data.data.url, '_blank');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <>
      <Header title="MySQL Databases" subtitle="Manage databases, users and access privileges" />
      <main className="p-6 flex-1">
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 w-fit shadow-sm border border-slate-100">
          {(['databases','users','assignments'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-[#4669fa] text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'databases' && (
          <div className="card">
            <div className="p-4 border-b border-slate-100 section-header">
              <div className="font-semibold text-slate-700 text-sm">{dbs.length} database{dbs.length !== 1 ? 's' : ''}</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddDb(true)}><Plus size={13} /> New Database</button>
            </div>
            {loading ? <div className="flex justify-center py-12"><div className="spinner" /></div>
              : dbs.length === 0 ? <EmptyState icon={<Database size={32} />} title="No databases" action={<button className="btn btn-primary btn-sm" onClick={() => setShowAddDb(true)}><Plus size={13} /> New Database</button>} />
              : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Database Name</th><th>Actions</th></tr></thead>
                    <tbody>
                      {dbs.map((d) => (
                        <tr key={d.id}>
                          <td><div className="flex items-center gap-2"><Database size={13} className="text-purple-400" /><span className="font-medium font-mono text-slate-700">{d.db_name}</span></div></td>
                          <td><div className="flex gap-1.5">
                            <button className="btn btn-sm btn-secondary" onClick={() => openPhpMyAdmin(d.db_name)}><ExternalLink size={12} /> phpMyAdmin</button>
                            <button className="btn btn-icon btn-danger" onClick={() => deleteDb(d.db_name)}><Trash2 size={13} /></button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {tab === 'users' && (
          <div className="card">
            <div className="p-4 border-b border-slate-100 section-header">
              <div className="font-semibold text-slate-700 text-sm">{users.length} DB user{users.length !== 1 ? 's' : ''}</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(true)}><UserPlus size={13} /> New User</button>
            </div>
            {users.length === 0 ? <EmptyState icon={<UserPlus size={32} />} title="No database users" action={<button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(true)}><UserPlus size={13} /> New User</button>} />
              : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Username</th><th></th></tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td><span className="font-mono text-sm text-slate-700">{u.username}</span></td>
                          <td><button className="btn btn-icon btn-danger" onClick={() => deleteUser(u.username)}><Trash2 size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

        {tab === 'assignments' && (
          <div className="card">
            <div className="p-4 border-b border-slate-100 section-header">
              <div className="font-semibold text-slate-700 text-sm">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAssign(true)}><Link2 size={13} /> Assign User</button>
            </div>
            {assignments.length === 0 ? <EmptyState icon={<Link2 size={32} />} title="No assignments" description="Assign a user to a database to grant access" action={<button className="btn btn-primary btn-sm" onClick={() => setShowAssign(true)}><Link2 size={13} /> Assign User</button>} />
              : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Database</th><th>User</th><th>Privileges</th></tr></thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a.id}>
                          <td><span className="font-mono text-sm">{a.db_name}</span></td>
                          <td><span className="font-mono text-sm">{a.db_user}</span></td>
                          <td><span className="badge badge-info text-[11px]">{a.privileges}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}
      </main>

      <Modal open={showAddDb} onClose={() => setShowAddDb(false)} title="Create MySQL Database"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAddDb(false)}>Cancel</button><button className="btn btn-primary" onClick={createDb} disabled={saving}>{saving ? <span className="spinner border-white/30 border-t-white" /> : 'Create'}</button></>}>
        <div className="form-group">
          <label>Database Name</label>
          <p className="text-[11px] text-slate-400 mb-2">Your username will be prepended automatically (e.g. john_shop_db)</p>
          <input className="input" placeholder="shop_db" value={dbForm.name} onChange={(e) => setDbForm({ name: e.target.value })} />
        </div>
      </Modal>

      <Modal open={showAddUser} onClose={() => setShowAddUser(false)} title="Create Database User"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button><button className="btn btn-primary" onClick={createUser} disabled={saving}>{saving ? <span className="spinner border-white/30 border-t-white" /> : 'Create'}</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label>Username</label><input className="input" placeholder="shopuser" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} /></div>
          <div className="form-group"><label>Password</label><input type="password" className="input" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div>
        </div>
      </Modal>

      <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Assign User to Database"
        footer={<><button className="btn btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button><button className="btn btn-primary" onClick={assignUser} disabled={saving}>{saving ? <span className="spinner border-white/30 border-t-white" /> : 'Assign'}</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label>Database</label>
            <select className="input" value={assignForm.database} onChange={(e) => setAssignForm({ ...assignForm, database: e.target.value })}>
              <option value="">Select database...</option>
              {dbs.map((d) => <option key={d.id} value={d.db_name}>{d.db_name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>User</label>
            <select className="input" value={assignForm.username} onChange={(e) => setAssignForm({ ...assignForm, username: e.target.value })}>
              <option value="">Select user...</option>
              {users.map((u) => <option key={u.id} value={u.username}>{u.username}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Privileges</label>
            <select className="input" value={assignForm.privileges} onChange={(e) => setAssignForm({ ...assignForm, privileges: e.target.value })}>
              <option value="ALL PRIVILEGES">ALL PRIVILEGES</option>
              <option value="SELECT">SELECT only</option>
              <option value="SELECT,INSERT,UPDATE,DELETE">SELECT, INSERT, UPDATE, DELETE</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
}
