'use client';

import { useWorldStore } from '@/store/world-store';
import { Radio, Bot, User, Wind } from 'lucide-react';
import clsx from 'clsx';

export default function ActivityFeed() {
  const activityFeed = useWorldStore((s) => s.activityFeed);

  return (
    <div className="w-full max-w-md px-4 pointer-events-none">
      <div className="glass rounded-2xl max-h-44 overflow-hidden pointer-events-auto glow-border">
        <div className="rainbow-bar" />
        <div className="flex items-center gap-2 px-4 py-2">
          <Radio className="w-3 h-3 text-fio-accent" />
          <span className="text-[10px] uppercase tracking-widest text-fio-muted/60 font-medium">what&apos;s happening</span>
          <span className="ml-auto text-[9px] text-fio-muted/40">{activityFeed.length} events</span>
        </div>
        <div className="overflow-y-auto max-h-28 px-3 pb-2.5 space-y-0.5">
          {activityFeed.length === 0 ? (
            <p className="text-xs text-fio-muted/40 italic py-3 text-center inline-flex items-center gap-1 w-full justify-center">nothing yet... it&apos;s quiet in here <Wind className="w-3 h-3" /></p>
          ) : (
            activityFeed.slice(0, 30).map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="shrink-0">{item.actorType === 'agent' ? <Bot className="w-3 h-3 text-fio-accent" /> : <User className="w-3 h-3 text-fio-pink" />}</span>
                <span className="text-fio-muted min-w-0">
                  <span className={clsx(
                    'font-semibold',
                    item.actorType === 'agent' ? 'text-fio-accent' : 'text-fio-pink'
                  )}>
                    {item.actorName}
                  </span>
                  {' '}{item.message}
                </span>
                <span className="text-fio-muted/30 ml-auto shrink-0 text-[9px] font-mono">
                  {formatTime(item.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
