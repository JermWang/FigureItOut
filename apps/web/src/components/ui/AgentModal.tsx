'use client';

import { useState } from 'react';
import { useWorldStore } from '@/store/world-store';
import { X, Copy, Check, Bot, Hammer, Eye, Shield, Key, PartyPopper, AlertTriangle } from 'lucide-react';
import { ROLES } from '@fio/shared';

export default function AgentModal() {
  const showAgentModal = useWorldStore((s) => s.showAgentModal);
  const setShowAgentModal = useWorldStore((s) => s.setShowAgentModal);
  const addActivity = useWorldStore((s) => s.addActivity);

  const [name, setName] = useState('');
  const [role, setRole] = useState<string>(ROLES.AGENT);
  const [proposalMode, setProposalMode] = useState(true);
  const [maxBlocksPerMin, setMaxBlocksPerMin] = useState(60);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!showAgentModal) return null;

  const handleCreate = async () => {
    const fakeKey = `fio_agent_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`;
    setGeneratedKey(fakeKey);
    addActivity({
      actorName: 'System',
      actorType: 'user',
      message: `new bot key for "${name || 'unnamed'}"`,

    });
  };

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShowAgentModal(false);
    setName('');
    setRole(ROLES.AGENT);
    setProposalMode(true);
    setMaxBlocksPerMin(60);
    setGeneratedKey(null);
    setCopied(false);
  };

  return (
    <div className="cmd-overlay flex items-center justify-center" onClick={handleClose}>
      <div
        className="glass rounded-2xl w-full max-w-md shadow-2xl glow-border overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rainbow-bar" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-fio-accent" />
            <h2 className="text-sm font-bold">plug in a bot</h2>
          </div>
          <button onClick={handleClose} className="text-fio-muted/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-fio-border to-transparent" />

        {/* Body */}
        <div className="p-5 space-y-4">
          {!generatedKey ? (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-fio-muted/60 mb-1.5">give it a name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. bob-the-builder"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-fio-text placeholder:text-fio-muted/30 outline-none focus:border-fio-accent/40 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-fio-muted/60 mb-1.5">what can it do?</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-fio-text outline-none focus:border-fio-accent/40 transition-colors"
                >
                  <option value={ROLES.AGENT}>agent — read + write</option>
                  <option value={ROLES.BUILDER}>builder — full access</option>
                  <option value={ROLES.VIEWER}>viewer — look don&apos;t touch</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-white/[0.02] rounded-xl px-3 py-2.5 border border-white/[0.04]">
                <div>
                  <label className="block text-xs text-fio-text font-medium flex items-center gap-1"><Shield className="w-3 h-3 text-fio-accent" /> approval mode</label>
                  <p className="text-[10px] text-fio-muted/50">you approve every move</p>
                </div>
                <button
                  onClick={() => setProposalMode(!proposalMode)}
                  className={`w-10 h-5 rounded-full transition-all relative ${proposalMode ? 'bg-fio-accent shadow-[0_0_8px_rgba(167,139,250,0.3)]' : 'bg-fio-border'}`}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: proposalMode ? '22px' : '2px' }}
                  />
                </button>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-fio-muted/60 mb-1.5">speed limit (blocks/min)</label>
                <input
                  type="number"
                  value={maxBlocksPerMin}
                  onChange={(e) => setMaxBlocksPerMin(Number(e.target.value))}
                  min={1}
                  max={1000}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-fio-text outline-none focus:border-fio-accent/40 transition-colors"
                />
              </div>

              <button
                onClick={handleCreate}
                className="w-full btn-candy py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" /> generate key
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <PartyPopper className="w-8 h-8 text-fio-accent mx-auto mb-2" />
                <p className="text-sm font-semibold text-white mb-1">bot key ready!</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[10px] font-mono text-fio-accent break-all">
                    {generatedKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-xl border border-white/[0.06] hover:bg-fio-accent/10 transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-fio-success" /> : <Copy className="w-4 h-4 text-fio-muted/50" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-fio-warning bg-fio-warning/10 rounded-xl p-3 text-center">
                <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" /> save this key! it won&apos;t show up again.</span>
              </p>
              <div className="text-xs text-fio-muted/50 space-y-1 text-center">
                <p>ws: <code className="text-fio-cyan">ws://localhost:8080</code></p>
                <p>api: <code className="text-fio-pink">/api/agent/*</code></p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl border border-white/[0.06] hover:bg-white/[0.04] text-sm font-medium transition-all text-fio-muted hover:text-white"
              >
                nice, done ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
