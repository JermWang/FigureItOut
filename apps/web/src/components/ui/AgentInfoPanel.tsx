'use client';

import { useWorldStore } from '@/store/world-store';
import { X, Bot, Zap, MapPin, Hammer, Clock } from 'lucide-react';

export default function AgentInfoPanel() {
  const selectedAgent = useWorldStore((s) => s.selectedAgent);
  const setSelectedAgent = useWorldStore((s) => s.setSelectedAgent);
  const activityFeed = useWorldStore((s) => s.activityFeed);

  if (!selectedAgent) return null;

  const agentActivity = activityFeed
    .filter((a) => a.actorName === selectedAgent.name && a.actorType === 'agent')
    .slice(0, 8);

  const actionCount = activityFeed.filter(
    (a) => a.actorName === selectedAgent.name
  ).length;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
      <div className="rounded-2xl bg-white/[0.05] backdrop-blur-2xl shadow-[0_16px_64px_rgba(0,0,0,0.6)] overflow-hidden animate-in glow-border">
        <div className="rainbow-bar" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-fio-accent/15 border border-fio-accent/20 flex items-center justify-center animate-float">
                <Bot className="w-5 h-5 text-fio-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{selectedAgent.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] text-fio-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-fio-accent dot-breathe" />
                  doing its thing
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/[0.08] transition-colors text-fio-muted/50 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Fun stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <Zap className="w-4 h-4 text-fio-cyan mx-auto mb-0.5" />
              <div className="text-xs font-bold text-fio-cyan font-mono">{actionCount}</div>
              <div className="text-[8px] text-fio-muted/50 uppercase">moves</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <MapPin className="w-4 h-4 text-fio-pink mx-auto mb-0.5" />
              <div className="text-[10px] font-bold text-fio-pink font-mono">
                {selectedAgent.position
                  ? `${Math.round(selectedAgent.position.x)},${Math.round(selectedAgent.position.z)}`
                  : '???'
                }
              </div>
              <div className="text-[8px] text-fio-muted/50 uppercase">at</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <Hammer className="w-4 h-4 text-fio-lime mx-auto mb-0.5" />
              <div className="text-xs font-bold text-fio-lime">builder</div>
              <div className="text-[8px] text-fio-muted/50 uppercase">role</div>
            </div>
          </div>

          {/* Recent moves */}
          <div className="text-[10px] uppercase tracking-widest text-fio-muted/40 mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> recent moves</div>
          {agentActivity.length === 0 ? (
            <p className="text-[11px] text-fio-muted/30 italic text-center py-1">chilling... no moves yet</p>
          ) : (
            <div className="space-y-0.5 max-h-20 overflow-y-auto">
              {agentActivity.map((item) => (
                <div key={item.id} className="text-[10px] text-fio-muted/60 flex items-center gap-1.5 py-0.5">
                  <span className="text-[8px]">→</span>
                  <span className="truncate">{item.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
