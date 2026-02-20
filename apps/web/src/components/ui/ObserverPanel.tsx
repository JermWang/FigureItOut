'use client';

import { useState, useRef, useEffect } from 'react';
import { useWorldStore } from '@/store/world-store';
import { ChevronLeft, ChevronRight, Eye, Camera, StickyNote, Crosshair, Bot, Clock, Download } from 'lucide-react';
import clsx from 'clsx';
import { BLOCK_COLORS, BLOCK_MATERIALS } from '@fio/shared';

const MATERIAL_NAMES: Record<number, string> = {
  [BLOCK_MATERIALS.AIR]:      'air',
  [BLOCK_MATERIALS.STONE]:    'stone',
  [BLOCK_MATERIALS.DIRT]:     'dirt',
  [BLOCK_MATERIALS.GRASS]:    'grass',
  [BLOCK_MATERIALS.SAND]:     'sand',
  [BLOCK_MATERIALS.WATER]:    'water',
  [BLOCK_MATERIALS.WOOD]:     'wood',
  [BLOCK_MATERIALS.LEAVES]:   'leaves',
  [BLOCK_MATERIALS.GLASS]:    'glass',
  [BLOCK_MATERIALS.BRICK]:    'brick',
  [BLOCK_MATERIALS.METAL]:    'metal',
  [BLOCK_MATERIALS.CONCRETE]: 'concrete',
  [BLOCK_MATERIALS.GLOW]:     'glow',
};

export default function ObserverPanel() {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<'inspect' | 'notes'>('inspect');
  const [notes, setNotes] = useState('');
  const [snapCount, setSnapCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  const hoveredBlock  = useWorldStore((s) => s.hoveredBlock);
  const getBlockAt    = useWorldStore((s) => s.getBlockAt);
  const onlineUsers   = useWorldStore((s) => s.onlineUsers);
  const activityFeed  = useWorldStore((s) => s.activityFeed);
  const chunks        = useWorldStore((s) => s.chunks);

  const agents = onlineUsers.filter((u) => u.type === 'agent');

  // Session timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const hoveredMaterial = hoveredBlock ? getBlockAt(hoveredBlock) : null;
  const materialName = hoveredMaterial != null ? (MATERIAL_NAMES[hoveredMaterial] ?? `block #${hoveredMaterial}`) : null;
  const materialColor = hoveredMaterial != null ? (BLOCK_COLORS[hoveredMaterial] ?? '#888') : null;

  const handleScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `fio-observation-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    a.click();
    setSnapCount((n) => n + 1);
  };

  const handleExportNotes = () => {
    const blob = new Blob([notes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fio-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}h ${m}m ${sec}s`
      : m > 0
      ? `${m}m ${sec}s`
      : `${sec}s`;
  };

  return (
    <div
      className={clsx(
        'absolute right-0 top-0 h-full z-20 transition-all duration-300 flex flex-row-reverse',
        open ? 'w-64' : 'w-8'
      )}
    >
      {open && (
        <div className="glass w-full h-full overflow-y-auto flex flex-col">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center gap-2 shrink-0">
            <Eye className="w-3.5 h-3.5 text-fio-cyan" />
            <span className="text-[10px] uppercase tracking-widest text-fio-cyan font-semibold">observer</span>
            <span className="ml-auto text-[9px] text-fio-muted/50 font-mono">{fmtTime(elapsed)}</span>
          </div>

          {/* Session stats strip */}
          <div className="mx-3 mb-3 rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2 grid grid-cols-3 gap-1 text-center shrink-0">
            <div>
              <div className="text-[11px] font-bold text-fio-accent">{agents.length}</div>
              <div className="text-[9px] text-fio-muted/60">bots</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-fio-pink">{activityFeed.length}</div>
              <div className="text-[9px] text-fio-muted/60">events</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-fio-lime">{chunks.size}</div>
              <div className="text-[9px] text-fio-muted/60">chunks</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mx-3 mb-3 flex rounded-xl bg-white/[0.03] border border-white/[0.05] p-0.5 shrink-0">
            <button
              onClick={() => setTab('inspect')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                tab === 'inspect' ? 'bg-fio-cyan/20 text-fio-cyan' : 'text-fio-muted/60 hover:text-fio-muted'
              )}
            >
              <Crosshair className="w-3 h-3" /> inspect
            </button>
            <button
              onClick={() => setTab('notes')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all',
                tab === 'notes' ? 'bg-fio-pink/20 text-fio-pink' : 'text-fio-muted/60 hover:text-fio-muted'
              )}
            >
              <StickyNote className="w-3 h-3" /> notes
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
            {tab === 'inspect' ? (
              <>
                {/* Block inspector */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-fio-muted/50 flex items-center gap-1.5">
                    <Crosshair className="w-3 h-3" /> hovered block
                  </div>
                  {hoveredBlock && materialName ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-md border border-white/10 shrink-0"
                          style={{ background: materialColor ?? '#888' }}
                        />
                        <span className="text-sm font-semibold text-white capitalize">{materialName}</span>
                      </div>
                      <div className="font-mono text-[10px] text-fio-muted/60 space-y-0.5">
                        <div>x <span className="text-fio-cyan">{hoveredBlock.x}</span></div>
                        <div>y <span className="text-fio-cyan">{hoveredBlock.y}</span></div>
                        <div>z <span className="text-fio-cyan">{hoveredBlock.z}</span></div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-fio-muted/40 italic">hover over any block to inspect it</p>
                  )}
                </div>

                {/* Active agents */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-fio-muted/50 flex items-center gap-1.5">
                    <Bot className="w-3 h-3" /> active bots
                  </div>
                  {agents.length === 0 ? (
                    <p className="text-[11px] text-fio-muted/40 italic">no bots connected</p>
                  ) : (
                    <div className="space-y-1.5">
                      {agents.map((a) => (
                        <div key={a.id} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-fio-accent dot-breathe shrink-0" />
                          <span className="text-[11px] text-fio-text truncate">{a.name}</span>
                          {a.position && (
                            <span className="ml-auto text-[9px] font-mono text-fio-muted/40 shrink-0">
                              {Math.round(a.position.x)},{Math.round(a.position.z)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent agent events */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-fio-muted/50 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> recent events
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {activityFeed.filter((e) => e.actorType === 'agent').slice(0, 10).length === 0 ? (
                      <p className="text-[11px] text-fio-muted/40 italic">no agent activity yet</p>
                    ) : (
                      activityFeed.filter((e) => e.actorType === 'agent').slice(0, 10).map((e) => (
                        <div key={e.id} className="text-[10px] text-fio-muted/70 leading-relaxed">
                          <span className="text-fio-accent font-medium">{e.actorName}</span> {e.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Notes scratchpad */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-fio-muted/50 flex items-center gap-1.5">
                    <StickyNote className="w-3 h-3" /> field notes
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="document what you observe... agent behaviors, patterns, interesting builds..."
                    className="w-full h-52 bg-transparent text-[11px] text-fio-text placeholder:text-fio-muted/30 outline-none resize-none leading-relaxed"
                  />
                  {notes.length > 0 && (
                    <button
                      onClick={handleExportNotes}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-fio-pink/20 bg-fio-pink/5 hover:bg-fio-pink/10 text-[10px] text-fio-pink transition-all"
                    >
                      <Download className="w-3 h-3" /> export notes
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Screenshot button — always visible at bottom */}
          <div className="px-3 pb-4 shrink-0">
            <button
              onClick={handleScreenshot}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-fio-cyan/10 border border-fio-cyan/20 hover:bg-fio-cyan/20 hover:border-fio-cyan/40 text-[11px] text-fio-cyan font-medium transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              screenshot
              {snapCount > 0 && (
                <span className="ml-auto text-[9px] text-fio-cyan/50">{snapCount} taken</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute top-4 -left-3 w-6 h-6 rounded-full bg-fio-surface border border-fio-border flex items-center justify-center hover:bg-fio-cyan/20 hover:border-fio-cyan/30 transition-all z-30"
      >
        {open ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
}
