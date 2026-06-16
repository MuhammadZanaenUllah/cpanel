'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { Wifi, WifiOff, Loader, Lock } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

type Status = 'connecting' | 'connected' | 'disconnected' | 'error';

export default function TerminalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import('@xterm/xterm').Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if terminal feature is not enabled
  useEffect(() => {
    if (user && user.features?.terminal === false) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user?.features?.terminal) return;

    let term: import('@xterm/xterm').Terminal;
    let ws: WebSocket;
    let fitAddon: import('@xterm/addon-fit').FitAddon;

    async function init() {
      if (!containerRef.current) return;

      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');

      term = new Terminal({
        cursorBlink: true,
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize: 14,
        lineHeight: 1.4,
        theme: {
          background: '#0a0f1a',
          foreground: '#e2e8f0',
          cursor: '#00DFAB',
          cursorAccent: '#0a0f1a',
          selectionBackground: 'rgba(0,223,171,0.2)',
          black: '#1e293b', brightBlack: '#334155',
          red: '#f87171', brightRed: '#fca5a5',
          green: '#4ade80', brightGreen: '#86efac',
          yellow: '#fbbf24', brightYellow: '#fde68a',
          blue: '#60a5fa', brightBlue: '#93c5fd',
          magenta: '#c084fc', brightMagenta: '#d8b4fe',
          cyan: '#22d3ee', brightCyan: '#67e8f9',
          white: '#e2e8f0', brightWhite: '#f8fafc',
        },
        scrollback: 5000,
        allowTransparency: false,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();
      termRef.current = term;

      const ro = new ResizeObserver(() => { try { fitAddon.fit(); } catch {} });
      ro.observe(containerRef.current);

      const token = localStorage.getItem('cpanel_token') || '';
      const wsUrl = `ws://65.21.125.14:8080/ws/cpanel-terminal?token=${token}`;

      term.writeln(`\x1b[2m\x1b[36mConnecting to ${user?.username ?? 'user'}@server...\x1b[0m\r\n`);

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        const dims = fitAddon.proposeDimensions();
        if (dims) ws.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; data?: string; message?: string; exitCode?: number };
          if (msg.type === 'output' && msg.data) term.write(msg.data);
          else if (msg.type === 'ready') setStatus('connected');
          else if (msg.type === 'error') {
            setStatus('error');
            setErrorMsg(msg.message ?? 'Connection error');
            term.writeln(`\r\n\x1b[31m${msg.message}\x1b[0m`);
          } else if (msg.type === 'exit') {
            setStatus('disconnected');
            term.writeln(`\r\n\x1b[33mSession ended (exit ${msg.exitCode ?? 0})\x1b[0m`);
          }
        } catch {}
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorMsg('WebSocket connection failed');
        term.writeln('\r\n\x1b[31mConnection failed. Try refreshing.\x1b[0m');
      };

      ws.onclose = (e) => {
        setStatus((prev) => prev === 'error' ? 'error' : 'disconnected');
        if (e.code !== 1000) term.writeln(`\r\n\x1b[33mDisconnected (code ${e.code})\x1b[0m`);
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data }));
      });

      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      });

      return () => { ro.disconnect(); ws.close(); term.dispose(); };
    }

    const cleanup = init();
    return () => { cleanup.then((fn) => fn?.()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.features?.terminal]);

  const reconnect = () => {
    setStatus('connecting');
    setErrorMsg('');
    if (wsRef.current) wsRef.current.close();
    if (termRef.current) termRef.current.clear();
    window.location.reload();
  };

  // Feature not enabled state
  if (user && !user.features?.terminal) {
    return (
      <>
        <Header title="Terminal" subtitle="Command-line access to your account" />
        <main className="p-6 flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-slate-400" />
            </div>
            <h3 className="text-slate-700 font-semibold text-lg mb-2">Terminal Access Not Enabled</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Terminal access has not been enabled for your account. Please contact your hosting provider or system administrator to enable this feature.
            </p>
          </div>
        </main>
      </>
    );
  }

  const statusBadge = {
    connecting:   <span className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold"><Loader size={12} className="animate-spin" /> Connecting</span>,
    connected:    <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold"><Wifi size={12} /> Connected</span>,
    disconnected: <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold"><WifiOff size={12} /> Disconnected</span>,
    error:        <span className="flex items-center gap-1.5 text-xs text-red-400 font-semibold"><WifiOff size={12} /> Error</span>,
  }[status];

  return (
    <>
      <Header
        title="Terminal"
        subtitle={`Shell access for ${user?.username ?? ''} — commands run as your account user`}
      />
      <main className="p-6 flex-1 flex flex-col gap-4 h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden">

        {/* Terminal card */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl" style={{ minHeight: 0 }}>
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0a0f1a] border-b border-slate-800/60 shrink-0">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="flex-1 text-center text-slate-500 text-xs font-mono">
              {user?.username ?? 'user'}@server — cPanel Terminal
            </span>
            <div className="flex items-center gap-3">
              {statusBadge}
              {(status === 'disconnected' || status === 'error') && (
                <button onClick={reconnect} className="text-xs text-[#00DFAB] hover:text-[#00DFAB]/80 font-semibold transition-colors">
                  Reconnect
                </button>
              )}
            </div>
          </div>

          {/* Error banner */}
          {status === 'error' && errorMsg && (
            <div className="bg-red-950/50 border-b border-red-900/50 px-4 py-2 text-xs text-red-300 font-medium shrink-0">
              {errorMsg}
            </div>
          )}

          {/* xterm.js mount point */}
          <div ref={containerRef} className="flex-1 bg-[#0a0f1a]" style={{ padding: '8px 4px' }} />
        </div>
      </main>
    </>
  );
}
