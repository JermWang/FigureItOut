'use client';

import { useRef, useEffect, useState } from 'react';
import { usePlayerStore } from '@/store/player-store';
import { ArrowUp } from 'lucide-react';
import clsx from 'clsx';

export default function MobileControls() {
  const active = usePlayerStore(s => s.active);
  const mode   = usePlayerStore(s => s.mode);
  const [isMobile, setIsMobile] = useState(false);
  const joystickBase = useRef<HTMLDivElement>(null);
  const joystickKnob = useRef<HTMLDivElement>(null);
  const touching = useRef(false);
  const touchId  = useRef<number | null>(null);
  const basePos  = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (!active || !isMobile) return;

    const getJoystick = () => (window as any).__playerJoystick?.current ?? { dx: 0, dz: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (touching.current) return;
      const touch = e.changedTouches[0];
      if (!joystickBase.current) return;
      const rect = joystickBase.current.getBoundingClientRect();
      if (
        touch.clientX < rect.left || touch.clientX > rect.right ||
        touch.clientY < rect.top  || touch.clientY > rect.bottom
      ) return;
      touching.current = true;
      touchId.current  = touch.identifier;
      basePos.current  = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touching.current) return;
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.current);
      if (!touch || !joystickKnob.current) return;

      const dx = touch.clientX - basePos.current.x;
      const dy = touch.clientY - basePos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 36;
      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);

      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      joystickKnob.current.style.transform = `translate(${kx}px, ${ky}px)`;

      const j = getJoystick();
      j.dx = (kx / maxDist);
      j.dz = -(ky / maxDist);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId.current);
      if (!touch) return;
      touching.current = false;
      touchId.current  = null;
      if (joystickKnob.current) joystickKnob.current.style.transform = 'translate(0,0)';
      const j = getJoystick();
      j.dx = 0;
      j.dz = 0;
    };

    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove',  onTouchMove);
    window.addEventListener('touchend',   onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  }, [active, isMobile]);

  if (!active || !isMobile) return null;

  const fireKey = (code: string, down: boolean) => {
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }));
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Left joystick */}
      <div className="absolute bottom-24 left-8 pointer-events-auto">
        <div
          ref={joystickBase}
          className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
        >
          <div
            ref={joystickKnob}
            className="w-10 h-10 rounded-full bg-white/30 border border-white/50 transition-none"
          />
        </div>
      </div>

      {/* Right action buttons */}
      <div className="absolute bottom-24 right-8 pointer-events-auto flex flex-col gap-3 items-center">
        {/* Jump / Up */}
        <button
          onTouchStart={() => fireKey('Space', true)}
          onTouchEnd={() => fireKey('Space', false)}
          className="w-14 h-14 rounded-full bg-fio-accent/30 border border-fio-accent/50 flex items-center justify-center active:bg-fio-accent/60"
        >
          <ArrowUp className="w-6 h-6 text-white" />
        </button>

        {/* Sprint / Fast */}
        <button
          onTouchStart={() => fireKey('ShiftLeft', true)}
          onTouchEnd={() => fireKey('ShiftLeft', false)}
          className={clsx(
            'w-12 h-12 rounded-full border flex items-center justify-center text-xs font-bold text-white active:opacity-80',
            mode === 'fly' ? 'bg-fio-pink/30 border-fio-pink/50' : 'bg-fio-success/30 border-fio-success/50'
          )}
        >
          {mode === 'fly' ? '↓' : '⚡'}
        </button>
      </div>
    </div>
  );
}
