'use client';

import dynamic from 'next/dynamic';
import { useWorldStore } from '@/store/world-store';
import IntroOverlay from '@/components/ui/IntroOverlay';
import LeftPanel from '@/components/ui/LeftPanel';
// RightPanel removed — humans are observers, only agents can build
import ActivityFeed from '@/components/ui/ActivityFeed';
import CommandBar from '@/components/ui/CommandBar';
import AgentModal from '@/components/ui/AgentModal';
import AgentInfoPanel from '@/components/ui/AgentInfoPanel';
import ModeSelector from '@/components/ui/ModeSelector';
import MobileControls from '@/components/ui/MobileControls';
import { Sparkles, Bot, Eye, Box, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { playCommandOpen, playHover, playModalOpen, playNotification } from '@/lib/sounds';

const WorldScene = dynamic(() => import('@/components/three/WorldScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen" style={{ background: '#87CEEB' }}>
      <div className="flex flex-col items-center gap-4">
        <Box className="w-10 h-10 text-fio-accent animate-bounce" />
        <span className="text-fio-muted text-sm animate-pulse">loading the vibes...</span>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const introVisible = useWorldStore((s) => s.introVisible);
  const setShowCommandBar = useWorldStore((s) => s.setShowCommandBar);
  const connected = useWorldStore((s) => s.connected);
  const onlineUsers = useWorldStore((s) => s.onlineUsers);

  const agentCount = onlineUsers.filter((u) => u.type === 'agent').length;
  const userCount = onlineUsers.filter((u) => u.type === 'user').length;

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#87CEEB' }}>
      {/* 3D Canvas — always running */}
      <div
        className={clsx(
          'absolute inset-0 transition-[filter] duration-700 ease-out',
          introVisible ? 'world-blurred' : 'world-clear'
        )}
      >
        <WorldScene />
      </div>

      {/* Glassmorphic intro overlay */}
      <IntroOverlay />

      {/* UI — fades in after intro dismissed */}
      <div
        className={clsx(
          'transition-opacity duration-500 ease-out',
          introVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <LeftPanel />
        <ActivityFeed />
        <AgentInfoPanel />

        {/* Top bar — fun & minimal */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="glass rounded-2xl px-4 py-2 flex items-center gap-3 glow-border">
            <span className="text-sm font-bold gradient-text">FIO</span>
            <div className="w-px h-3.5 bg-fio-border" />

            {/* Status pills */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-fio-success dot-breathe' : 'bg-fio-warning animate-pulse'}`} />
              <span className="text-[10px] text-fio-muted">{connected ? 'vibin' : 'connecting...'}</span>
            </div>

            {agentCount > 0 && (
              <>
                <div className="w-px h-3.5 bg-fio-border" />
                <span className="text-[10px] text-fio-accent inline-flex items-center gap-1"><Bot className="w-3 h-3" /> {agentCount}</span>
              </>
            )}

            {userCount > 0 && (
              <span className="text-[10px] text-fio-pink inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {userCount}</span>
            )}

            <div className="w-px h-3.5 bg-fio-border" />

            <button
              onClick={() => { playCommandOpen(); setShowCommandBar(true); }}
              onMouseEnter={() => playHover()}
              className="flex items-center gap-1 text-[10px] text-fio-muted hover:text-fio-accent transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px]">⌘K</kbd>
            </button>
          </div>
        </div>

        <CommandBar />
        <AgentModal />
      </div>

      {/* Explore mode HUD — always visible after intro */}
      {!introVisible && <ModeSelector />}
      {!introVisible && <MobileControls />}
    </div>
  );
}
