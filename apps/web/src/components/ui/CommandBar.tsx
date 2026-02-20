'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorldStore } from '@/store/world-store';
import { Home, Gift, Bot, Camera, Undo2, Sparkles, Search } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandBar() {
  const showCommandBar = useWorldStore((s) => s.showCommandBar);
  const setShowCommandBar = useWorldStore((s) => s.setShowCommandBar);
  const setCameraPosition = useWorldStore((s) => s.setCameraPosition);
  const setShowAgentModal = useWorldStore((s) => s.setShowAgentModal);
  const addActivity = useWorldStore((s) => s.addActivity);

  const [query, setQuery] = useState('');

  const commands: Command[] = [
    {
      id: 'teleport-origin',
      label: 'teleport home',
      icon: <Home className="w-4 h-4" />,
      action: () => {
        setCameraPosition({ x: 0, y: 30, z: 30 });
        addActivity({ actorName: 'You', actorType: 'user', message: 'zoomed back to origin' });
      },
    },
    {
      id: 'spawn-entity',
      label: 'spawn something (coming soon)',
      icon: <Gift className="w-4 h-4" />,
      action: () => {
        addActivity({ actorName: 'System', actorType: 'user', message: 'spawning stuff is coming soon!' });
      },
    },
    {
      id: 'connect-agent',
      label: 'plug in a bot',
      icon: <Bot className="w-4 h-4" />,
      action: () => {
        setShowAgentModal(true);
      },
    },
    {
      id: 'snapshot',
      label: 'take a snapshot (coming soon)',
      icon: <Camera className="w-4 h-4" />,
      action: () => {
        addActivity({ actorName: 'System', actorType: 'user', message: 'snapshots coming soon' });
      },
    },
    {
      id: 'rollback',
      label: 'undo everything (coming soon)',
      icon: <Undo2 className="w-4 h-4" />,
      action: () => {
        addActivity({ actorName: 'System', actorType: 'user', message: 'time travel coming soon' });
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandBar(!showCommandBar);
      }
      if (e.key === 'Escape') {
        setShowCommandBar(false);
      }
    },
    [showCommandBar, setShowCommandBar]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!showCommandBar) return null;

  return (
    <div className="cmd-overlay flex items-start justify-center pt-[18vh]" onClick={() => setShowCommandBar(false)}>
      <div
        className="glass rounded-2xl w-full max-w-md shadow-2xl glow-border overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rainbow-bar" />
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className="w-4 h-4 text-fio-accent" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="what do you wanna do?"
            className="flex-1 bg-transparent outline-none text-sm text-fio-text placeholder:text-fio-muted/50"
          />
          <kbd className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[9px] text-fio-muted/50">esc</kbd>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-fio-border to-transparent" />

        {/* Results */}
        <div className="max-h-60 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-fio-muted/40 p-4 text-center">hmm, nothing matches that</p>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setShowCommandBar(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-fio-accent/10 text-fio-text transition-all text-left group"
              >
                <span className="text-fio-accent group-hover:scale-110 transition-transform">{cmd.icon}</span>
                <span className="text-fio-muted group-hover:text-fio-text transition-colors">{cmd.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
