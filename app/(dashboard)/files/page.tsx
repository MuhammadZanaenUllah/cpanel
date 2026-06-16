'use client';
import { useEffect, useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { FolderOpen, File, ChevronRight, Home, Trash2, Edit3, Upload, FolderPlus, ArrowLeft } from 'lucide-react';

interface FileEntry { name: string; type: 'file' | 'dir'; sizeBytes: number; permissions: string; modifiedAt: string; }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Strip leading slashes so paths work with path.resolve(homeDir, userPath)
// e.g. "/public_html" → "public_html", "/a/b/c" → "a/b/c", "" → ""
function cleanPath(p: string): string {
  return p.replace(/^\/+/, '');
}

export default function FilesPage() {
  // Use relative paths (no leading slash) to avoid path traversal errors in resolveSafe()
  // Start at '' (home dir). For real user accounts this would be ~/public_html by default.
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FileEntry | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [showNewDir, setShowNewDir] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = (p: string) => {
    const safe = cleanPath(p);
    setLoading(true);
    setSelected(null);
    api.get(`/cpanel/files/list?path=${encodeURIComponent(safe)}`)
      .then((r) => { setEntries(r.data.data || []); setCurrentPath(safe); })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(''); }, []);

  const navigate = (entry: FileEntry) => {
    if (entry.type === 'dir') {
      const next = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      load(next);
    } else {
      openEditor(entry);
    }
  };

  const goUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length === 0) return;
    load(parts.slice(0, -1).join('/'));
  };

  const goHome = () => load('');

  const openEditor = async (entry: FileEntry) => {
    setSelected(entry);
    const filePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    try {
      const res = await api.get(`/cpanel/files/read?path=${encodeURIComponent(filePath)}`);
      setEditContent(res.data.data.content);
      setShowEditor(true);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const saveFile = async () => {
    if (!selected) return;
    setSaving(true);
    const filePath = currentPath ? `${currentPath}/${selected.name}` : selected.name;
    try {
      await api.post('/cpanel/files/write', { path: filePath, content: editContent });
      toast.success('File saved');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const deleteEntry = async (entry: FileEntry) => {
    if (!confirm(`Delete "${entry.name}"?`)) return;
    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    try {
      await api.delete('/cpanel/files', { data: { paths: [entryPath] } });
      toast.success(`"${entry.name}" deleted`);
      load(currentPath);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const createDir = async () => {
    if (!newDirName) return;
    const dirPath = currentPath ? `${currentPath}/${newDirName}` : newDirName;
    try {
      await api.post('/cpanel/files/create-dir', { path: dirPath });
      toast.success('Directory created'); setShowNewDir(false); setNewDirName(''); load(currentPath);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  // Display path with ~ prefix for UI
  const displayPath = `~/${currentPath}`;
  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <>
      <Header title="File Manager" subtitle={`Current path: ${displayPath}`} />
      <main className="p-6 flex-1">
        {showEditor && selected ? (
          <div className="card flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowEditor(false)}><ArrowLeft size={13} /> Back</button>
                <span className="text-sm font-medium text-slate-700">{selected.name}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={saveFile} disabled={saving}>
                {saving ? <span className="spinner border-white/30 border-t-white" /> : 'Save'}
              </button>
            </div>
            <textarea
              className="flex-1 p-4 font-mono text-xs text-slate-700 resize-none outline-none border-0"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="card">
            {/* Toolbar */}
            <div className="p-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
              <button className="btn btn-secondary btn-sm" onClick={goHome}><Home size={13} /></button>
              <button className="btn btn-secondary btn-sm" onClick={goUp} disabled={!currentPath}><ArrowLeft size={13} /> Up</button>
              <div className="h-4 w-px bg-slate-200" />
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNewDir(!showNewDir)}><FolderPlus size={13} /> New Folder</button>
              <button className="btn btn-secondary btn-sm" onClick={() => fileInput.current?.click()}><Upload size={13} /> Upload</button>
              <input ref={fileInput} type="file" className="hidden" multiple onChange={() => toast('Upload — coming soon')} />

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1 ml-auto text-xs text-slate-500 overflow-hidden">
                <button className="hover:text-[#4669fa]" onClick={goHome}>~</button>
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <ChevronRight size={11} />
                    <button
                      className="hover:text-[#4669fa]"
                      onClick={() => load(breadcrumbs.slice(0, i + 1).join('/'))}
                    >
                      {b}
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* New dir inline */}
            {showNewDir && (
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex gap-2">
                <input
                  className="input input-sm flex-1 max-w-xs"
                  placeholder="New folder name"
                  value={newDirName}
                  onChange={(e) => setNewDirName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createDir()}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={createDir}>Create</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowNewDir(false)}>Cancel</button>
              </div>
            )}

            {/* File list */}
            {loading ? (
              <div className="flex justify-center py-16"><div className="spinner-dark" style={{ width: 24, height: 24, border: '2px solid #e2e8f0', borderTopColor: '#4669fa', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /></div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">Empty directory</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Name</th><th>Size</th><th>Permissions</th><th>Modified</th><th>Actions</th></tr></thead>
                  <tbody>
                    {[...entries]
                      .sort((a, b) => (a.type === 'dir' ? -1 : 1) - (b.type === 'dir' ? -1 : 1) || a.name.localeCompare(b.name))
                      .map((e) => (
                        <tr key={e.name}>
                          <td>
                            <button onClick={() => navigate(e)} className="flex items-center gap-2 text-left hover:text-[#4669fa] transition-colors">
                              {e.type === 'dir'
                                ? <FolderOpen size={14} className="text-amber-400 shrink-0" />
                                : <File size={14} className="text-slate-400 shrink-0" />}
                              <span className={`font-medium text-sm ${e.type === 'dir' ? 'text-slate-700' : 'text-slate-600'}`}>{e.name}</span>
                            </button>
                          </td>
                          <td><span className="text-xs text-slate-400">{e.type === 'dir' ? '—' : formatSize(e.sizeBytes)}</span></td>
                          <td><span className="text-xs font-mono text-slate-400">{e.permissions}</span></td>
                          <td><span className="text-xs text-slate-400">{e.modifiedAt ? new Date(e.modifiedAt).toLocaleDateString() : '—'}</span></td>
                          <td>
                            <div className="flex gap-1">
                              {e.type === 'file' && (
                                <button className="btn btn-icon btn-secondary text-slate-400" onClick={() => openEditor(e)} title="Edit"><Edit3 size={13} /></button>
                              )}
                              <button className="btn btn-icon btn-danger" onClick={() => deleteEntry(e)} title="Delete"><Trash2 size={13} /></button>
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
      </main>
    </>
  );
}
