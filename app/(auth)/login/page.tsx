'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { Globe, Lock, User, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#1d1d1d] flex items-center justify-center p-4">
      {/* Background Decorative Glowing Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00DFAB]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#00b88d]/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-[400px] z-10">
        {/* Logo area */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#00DFAB] to-[#00b88d] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_8px_30px_rgba(0,223,171,0.3)] border border-[#00DFAB]/20 text-[#1d1d1d] font-black text-2xl">
            W.
          </div>
          <h1 className="text-white font-extrabold text-2xl tracking-tight">Websouls cPanel</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">Control panel for hosting accounts</p>
        </div>

        {/* Frosted Glass Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 block">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full bg-slate-950/50 border border-slate-800/80 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#00DFAB] focus:bg-slate-950/80 focus:ring-4 focus:ring-[#00DFAB]/10 transition-all"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  className="w-full bg-slate-950/50 border border-slate-800/80 text-white placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#00DFAB] focus:bg-slate-950/80 focus:ring-4 focus:ring-[#00DFAB]/10 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-[#00DFAB] to-[#00b88d] hover:from-[#00c698] hover:to-[#009470] text-[#1d1d1d] font-extrabold py-3 px-4 rounded-xl text-sm border-0 shadow-lg shadow-[#00DFAB]/20 hover:shadow-[#00DFAB]/35 transition-all duration-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#1d1d1d]/30 border-t-[#1d1d1d] rounded-full animate-spin" />
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>

        <div className="flex justify-center items-center gap-2 mt-8 text-slate-600 text-xs font-semibold">
          <Terminal size={12} />
          <span>websouls. Engine v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
