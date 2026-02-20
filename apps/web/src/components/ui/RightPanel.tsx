'use client';

import { useWorldStore } from '@/store/world-store';
import {
  BLOCK_MATERIALS, BLOCK_COLORS, BLOCK_NAMES, TOOLS,
  type Tool, type BlockMaterialId,
} from '@fio/shared';
import {
  ChevronLeft, ChevronRight, Wrench, Plus, Trash2, Paintbrush,
  MousePointer, Move, RotateCw, Palette, Search, MapPin, Hammer, Box, Eye, Bot,
} from 'lucide-react';
import clsx from 'clsx';

const TOOL_CONFIG: { id: Tool; label: string; icon: React.ReactNode }[] = [
  { id: TOOLS.PLACE, label: 'build', icon: <Plus className="w-4 h-4" /> },
  { id: TOOLS.REMOVE, label: 'break', icon: <Trash2 className="w-4 h-4" /> },
  { id: TOOLS.PAINT, label: 'paint', icon: <Paintbrush className="w-4 h-4" /> },
  { id: TOOLS.SELECT, label: 'poke', icon: <MousePointer className="w-4 h-4" /> },
  { id: TOOLS.MOVE, label: 'yeet', icon: <Move className="w-4 h-4" /> },
  { id: TOOLS.ROTATE, label: 'spin', icon: <RotateCw className="w-4 h-4" /> },
];

const PALETTE_ITEMS = Object.entries(BLOCK_MATERIALS)
  .filter(([key]) => key !== 'AIR')
  .map(([key, value]) => ({
    id: value as BlockMaterialId,
    name: BLOCK_NAMES[value] || key,
    color: BLOCK_COLORS[value] || '#ff00ff',
  }));

export default function RightPanel() {
  const activeTool = useWorldStore((s) => s.activeTool);
  const activeMaterial = useWorldStore((s) => s.activeMaterial);
  const setActiveTool = useWorldStore((s) => s.setActiveTool);
  const setActiveMaterial = useWorldStore((s) => s.setActiveMaterial);
  const rightPanelOpen = useWorldStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useWorldStore((s) => s.setRightPanelOpen);
  const setShowAgentModal = useWorldStore((s) => s.setShowAgentModal);
  const hoveredBlock = useWorldStore((s) => s.hoveredBlock);

  return (
    <div
      className={clsx(
        'absolute right-0 top-0 h-full z-20 transition-all duration-300 flex flex-row-reverse',
        rightPanelOpen ? 'w-60' : 'w-8'
      )}
    >
      {rightPanelOpen && (
        <div className="glass w-full h-full overflow-y-auto p-4 flex flex-col gap-5">
          {/* Tools */}
          <section>
            <div className="text-[10px] uppercase tracking-widest text-fio-muted/60 mb-2.5 flex items-center gap-1.5"><Wrench className="w-3 h-3" /> tools</div>
            <div className="grid grid-cols-3 gap-1.5">
              {TOOL_CONFIG.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={clsx(
                    'flex flex-col items-center gap-0.5 p-2 rounded-xl text-[10px] font-medium transition-all',
                    activeTool === tool.id
                      ? 'bg-fio-accent/15 text-fio-accent border border-fio-accent/30 shadow-[0_0_12px_rgba(167,139,250,0.15)]'
                      : 'hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]'
                  )}
                >
                  <span className={clsx('text-fio-accent', activeTool === tool.id && 'animate-pop-in')}>{tool.icon}</span>
                  {tool.label}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-fio-border to-transparent" />

          {/* Block Palette */}
          <section>
            <div className="text-[10px] uppercase tracking-widest text-fio-muted/60 mb-2.5 flex items-center gap-1.5"><Palette className="w-3 h-3" /> blocks</div>
            <div className="grid grid-cols-4 gap-1.5">
              {PALETTE_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveMaterial(item.id)}
                  className={clsx(
                    'flex flex-col items-center gap-1 p-1.5 rounded-xl text-[9px] transition-all',
                    activeMaterial === item.id
                      ? 'ring-2 ring-fio-pink ring-offset-1 ring-offset-fio-bg scale-105'
                      : 'hover:scale-105 hover:bg-white/[0.03]'
                  )}
                  title={item.name}
                >
                  <div
                    className="w-7 h-7 rounded-lg border border-white/10 shadow-inner"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-fio-muted truncate w-full text-center">{item.name}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-fio-border to-transparent" />

          {/* Inspector */}
          <section>
            <div className="text-[10px] uppercase tracking-widest text-fio-muted/60 mb-2.5 flex items-center gap-1.5"><Search className="w-3 h-3" /> looking at</div>
            {hoveredBlock ? (
              <div className="text-xs space-y-1.5 bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                <div className="flex justify-between">
                  <span className="text-fio-muted inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> pos</span>
                  <span className="font-mono text-fio-cyan text-[11px]">
                    {hoveredBlock.x}, {hoveredBlock.y}, {hoveredBlock.z}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fio-muted inline-flex items-center gap-1"><Hammer className="w-3 h-3" /> tool</span>
                  <span className="text-fio-accent">{activeTool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-fio-muted inline-flex items-center gap-1"><Box className="w-3 h-3" /> block</span>
                  <span className="text-fio-pink">{BLOCK_NAMES[activeMaterial]}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-fio-muted/40 italic text-center py-2 inline-flex items-center gap-1 w-full justify-center">hover a block to peek <Eye className="w-3 h-3" /></p>
            )}
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-fio-border to-transparent" />

          {/* Agent Connect */}
          <section>
            <button
              onClick={() => setShowAgentModal(true)}
              className="w-full btn-candy py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              plug in a bot
            </button>
          </section>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setRightPanelOpen(!rightPanelOpen)}
        className="absolute top-4 -left-3 w-6 h-6 rounded-full bg-fio-surface border border-fio-border flex items-center justify-center hover:bg-fio-accent/20 hover:border-fio-accent/30 transition-all z-30"
      >
        {rightPanelOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
}
