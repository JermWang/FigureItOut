'use client';

import { usePlayerStore } from '@/store/player-store';
import { Footprints, Plane, Bot, User, Eye } from 'lucide-react';
import clsx from 'clsx';
import { playClick, playHover, playModeSwitch, playFlyStart, playAvatarSelect } from '@/lib/sounds';

const WALK_KEYS = [
  { key: 'WASD', desc: 'move' },
  { key: 'Mouse', desc: 'look' },
  { key: 'Space', desc: 'jump' },
  { key: 'Shift', desc: 'sprint' },
  { key: 'Click', desc: 'lock cursor' },
];

const FLY_KEYS = [
  { key: 'WASD', desc: 'fly' },
  { key: 'Mouse', desc: 'look' },
  { key: 'Space', desc: 'up' },
  { key: 'Shift', desc: 'down' },
  { key: 'Click', desc: 'lock cursor' },
];

export default function ModeSelector() {
  const active      = usePlayerStore(s => s.active);
  const mode        = usePlayerStore(s => s.mode);
  const avatarType  = usePlayerStore(s => s.avatarType);
  const setActive   = usePlayerStore(s => s.setActive);
  const setMode     = usePlayerStore(s => s.setMode);
  const setAvatarType = usePlayerStore(s => s.setAvatarType);

  const keys = mode === 'walk' ? WALK_KEYS : FLY_KEYS;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Controls hint — only when active */}
      {active && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {keys.map(k => (
            <span key={k.key} className="flex items-center gap-1 text-[10px] text-white/60">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[9px] font-mono text-white/80">{k.key}</kbd>
              <span>{k.desc}</span>
            </span>
          ))}
          <span className="text-[10px] text-white/40 ml-1">· press <kbd className="px-1 py-0.5 rounded bg-white/10 border border-white/20 text-[9px] font-mono">Esc</kbd> to free cursor</span>
        </div>
      )}

      {/* Main pill */}
      <div className="glass rounded-2xl px-3 py-2 flex items-center gap-2 glow-border">

        {/* Explore toggle */}
        <button
          onClick={() => { playClick(); setActive(!active); }}
          onMouseEnter={() => playHover()}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
            active
              ? 'bg-fio-accent text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
              : 'text-fio-muted hover:text-white hover:bg-white/10'
          )}
        >
          <Eye className="w-3.5 h-3.5" />
          {active ? 'exploring' : 'explore'}
        </button>

        <div className="w-px h-4 bg-fio-border" />

        {/* Walk / Fly toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { playModeSwitch(); setMode('walk'); }}
            onMouseEnter={() => playHover()}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition-all',
              mode === 'walk' && active
                ? 'bg-white/15 text-white'
                : 'text-fio-muted hover:text-white'
            )}
          >
            <Footprints className="w-3.5 h-3.5" />
            walk
          </button>
          <button
            onClick={() => { playFlyStart(); setMode('fly'); }}
            onMouseEnter={() => playHover()}
            className={clsx(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition-all',
              mode === 'fly' && active
                ? 'bg-white/15 text-white'
                : 'text-fio-muted hover:text-white'
            )}
          >
            <Plane className="w-3.5 h-3.5" />
            fly
          </button>
        </div>

        <div className="w-px h-4 bg-fio-border" />

        {/* Avatar type */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { playAvatarSelect(); setAvatarType('human'); }}
            onMouseEnter={() => playHover()}
            title="Human avatar"
            className={clsx(
              'p-1.5 rounded-lg transition-all',
              avatarType === 'human' ? 'bg-fio-pink/20 text-fio-pink' : 'text-fio-muted hover:text-white'
            )}
          >
            <User className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { playAvatarSelect(); setAvatarType('agent'); }}
            onMouseEnter={() => playHover()}
            title="Agent avatar"
            className={clsx(
              'p-1.5 rounded-lg transition-all',
              avatarType === 'agent' ? 'bg-fio-accent/20 text-fio-accent' : 'text-fio-muted hover:text-white'
            )}
          >
            <Bot className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
