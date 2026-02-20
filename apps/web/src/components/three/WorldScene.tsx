'use client';

import { useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { useWorldStore } from '@/store/world-store';
import { usePlayerStore } from '@/store/player-store';
import VoxelChunk from './VoxelChunk';
import BlockHighlight from './BlockHighlight';
import SandboxTerrain from './SandboxTerrain';
import WeatherSystem from './WeatherSystem';
import PlayerController from './PlayerController';
import HumanAvatar from './avatars/HumanAvatar';
import AgentAvatar from './avatars/AgentAvatar';
import PlaneAvatar from './avatars/PlaneAvatar';

function SceneContent({ onBlockClick }: { onBlockClick: () => void }) {
  const chunks      = useWorldStore((s) => s.chunks);
  const active      = usePlayerStore((s) => s.active);
  const mode        = usePlayerStore((s) => s.mode);
  const avatarType  = usePlayerStore((s) => s.avatarType);
  const position    = usePlayerStore((s) => s.position);
  const yaw         = usePlayerStore((s) => s.yaw);
  const pitch       = usePlayerStore((s) => s.pitch);
  const moving      = usePlayerStore((s) => s.moving);
  const chunkArray  = Array.from(chunks.values());

  // Third-person offset so avatar is visible while exploring
  const avatarPos: [number, number, number] = [position.x, position.y - 1.6, position.z];

  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 180, 320]} />

      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#87CEEB', '#4E8B2E', 0.55]} />

      <Sky
        distance={450000}
        sunPosition={[100, 60, 80]}
        inclination={0.49}
        azimuth={0.25}
        rayleigh={0.8}
        turbidity={6}
        mieCoefficient={0.003}
        mieDirectionalG={0.7}
      />

      <WeatherSystem />
      <SandboxTerrain />

      {chunkArray.map((chunk) => (
        <VoxelChunk
          key={`${chunk.coord.cx},${chunk.coord.cy},${chunk.coord.cz}-${chunk.version}`}
          chunk={chunk}
          onClick={onBlockClick}
        />
      ))}

      <BlockHighlight />

      {/* Player avatar — shown in explore mode */}
      {active && mode === 'walk' && avatarType === 'human' && (
        <HumanAvatar position={avatarPos} yaw={yaw} moving={moving} />
      )}
      {active && mode === 'walk' && avatarType === 'agent' && (
        <AgentAvatar position={avatarPos} yaw={yaw} moving={moving} />
      )}
      {active && mode === 'fly' && (
        <PlaneAvatar position={avatarPos} yaw={yaw} pitch={pitch} />
      )}

      {/* Player controller — takes over camera when active */}
      <PlayerController />

      {/* Orbit controls — only when not in explore mode */}
      {!active && (
        <OrbitControls
          makeDefault
          target={[0, 4, 0]}
          enableDamping
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={300}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.25}
        />
      )}
    </>
  );
}

export default function WorldScene() {
  const initializeWorld = useWorldStore((s) => s.initializeWorld);

  useEffect(() => {
    initializeWorld();
  }, [initializeWorld]);

  const handleBlockClick = useCallback(() => {
    // Humans are observers only - no building actions allowed
  }, []);

  return (
    <Canvas
      camera={{ position: [80, 45, 80], fov: 65, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <SceneContent onBlockClick={handleBlockClick} />
    </Canvas>
  );
}
