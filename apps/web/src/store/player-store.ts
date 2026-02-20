'use client';

import { create } from 'zustand';

export type PlayerMode = 'walk' | 'fly';
export type AvatarType = 'human' | 'agent';

interface PlayerState {
  mode: PlayerMode;
  avatarType: AvatarType;
  position: { x: number; y: number; z: number };
  yaw: number;   // horizontal rotation (radians)
  pitch: number; // vertical rotation (radians, fly only)
  isOnGround: boolean;
  velocityY: number;
  active: boolean; // whether player control is active (vs orbit camera)
  moving: boolean;

  setMode: (mode: PlayerMode) => void;
  setAvatarType: (type: AvatarType) => void;
  setPosition: (pos: { x: number; y: number; z: number }) => void;
  setYaw: (yaw: number) => void;
  setPitch: (pitch: number) => void;
  setOnGround: (v: boolean) => void;
  setVelocityY: (v: number) => void;
  setActive: (v: boolean) => void;
  setMoving: (v: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  mode: 'walk',
  avatarType: 'human',
  position: { x: 0, y: 6, z: 0 },
  yaw: 0,
  pitch: 0,
  isOnGround: false,
  velocityY: 0,
  active: false,
  moving: false,

  setMode: (mode) => set({ mode }),
  setAvatarType: (avatarType) => set({ avatarType }),
  setPosition: (position) => set({ position }),
  setYaw: (yaw) => set({ yaw }),
  setPitch: (pitch) => set({ pitch }),
  setOnGround: (isOnGround) => set({ isOnGround }),
  setVelocityY: (velocityY) => set({ velocityY }),
  setActive: (active) => set({ active }),
  setMoving: (moving) => set({ moving }),
}));
