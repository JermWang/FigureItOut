'use client';

import { useWorldStore } from '@/store/world-store';
import { ChevronLeft, ChevronRight, Globe, Blocks, Sparkles, Radio, Eye, Bot } from 'lucide-react';
import clsx from 'clsx';

export default function LeftPanel() {
  const onlineUsers = useWorldStore((s) => s.onlineUsers);
  const chunks = useWorldStore((s) => s.chunks);
  const entities = useWorldStore((s) => s.entities);
  const leftPanelOpen = useWorldStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useWorldStore((s) => s.setLeftPanelOpen);
  const setSelectedAgent = useWorldStore((s) => s.setSelectedAgent);

  const users = onlineUsers.filter((u) => u.type === 'user');
  const agents = onlineUsers.filter((u) => u.type === 'agent');

  return (
    <div
      className={clsx(
        'absolute left-0 top-0 h-full z-20 transition-all duration-300 flex',
        leftPanelOpen ? 'w-60' : 'w-8'
      )}
    >
      {leftPanelOpen && (
        <div className="glass w-full h-full overflow-y-auto p-4 flex flex-col gap-5">
          {/* World stats */}
          <section>
            <div className="text-[10px] uppercase tracking-widest text-fio-muted/60 mb-2.5 flex items-center gap-1.5"><Globe className="w-3 h-3" /> world</div>
            <div className="space-y-1.5 text-xs">
              <StatRow icon={<Blocks className="w-3 h-3" />} label="chunks" value={chunks.size.toString()} />
              <StatRow icon={<Sparkles className="w-3 h-3" />} label="entities" value={entities.size.toString()} />
              <StatRow icon={<Radio className="w-3 h-3" />} label="status" value="vibin" valueColor="text-fio-success" />
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-fio-border to-transparent" />

          {/* Spectators */}
          <section>
            <div className="text-[10px] uppercase tracking-widest text-fio-muted/60 mb-2.5 flex items-center gap-1.5"><Eye className="w-3 h-3" /> spectators ({users.length})</div>
            {users.length === 0 ? (
              <p className="text-xs text-fio-muted/50 italic">nobody here yet... be the first!</p>
            ) : (
              <div className="space-y-1">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded-lg bg-white/[0.02]">
                    <span className="w-2 h-2 rounded-full bg-fio-success dot-breathe" />
                    <span className="text-fio-text">{u.name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-fio-border to-transparent" />

          {/* Agents — the stars */}
          <section>
            <div className="text-[10px] uppercase tracking-widest text-fio-muted/60 mb-2.5 flex items-center gap-1.5"><Bot className="w-3 h-3" /> bots ({agents.length})</div>
            {agents.length === 0 ? (
              <p className="text-xs text-fio-muted/50 italic">no bots yet... connect one!</p>
            ) : (
              <div className="space-y-1.5">
                {agents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAgent(a)}
                    className="w-full flex items-center gap-2 text-xs px-2.5 py-2 rounded-xl bg-fio-accent/5 border border-fio-accent/10 hover:bg-fio-accent/15 hover:border-fio-accent/25 transition-all text-left group"
                  >
                    <Bot className="w-4 h-4 text-fio-accent shrink-0 group-hover:animate-wiggle" />
                    <div className="flex-1 min-w-0">
                      <span className="text-fio-text font-medium block truncate">{a.name}</span>
                      <span className="text-[9px] text-fio-accent/60">tap to peek</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-fio-accent dot-breathe" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
        className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-fio-surface border border-fio-border flex items-center justify-center hover:bg-fio-accent/20 hover:border-fio-accent/30 transition-all z-30"
      >
        {leftPanelOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </div>
  );
}

function StatRow({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-fio-muted">
        <span className="text-fio-accent">{icon}</span> {label}
      </span>
      <span className={clsx('font-mono text-[11px]', valueColor || 'text-fio-text')}>{value}</span>
    </div>
  );
}
