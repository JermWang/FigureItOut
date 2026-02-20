'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { useWorldStore } from '@/store/world-store';
import { usePlayerStore } from '@/store/player-store';
import {
  type WSServerMessage,
  type WorldAction,
  setBlock,
  worldToChunk,
  worldToLocal,
  chunkKey,
  createEmptyChunk,
  BLOCK_MATERIALS,
} from '@fio/shared';
import VoxelChunk from './VoxelChunk';
import BlockHighlight from './BlockHighlight';
import SandboxTerrain from './SandboxTerrain';
import WeatherSystem from './WeatherSystem';
import PlayerController from './PlayerController';
import HumanAvatar from './avatars/HumanAvatar';
import AgentAvatar from './avatars/AgentAvatar';
import PlaneAvatar from './avatars/PlaneAvatar';
import WorldLabels from './WorldLabels';

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
      <fog attach="fog" args={['#87CEEB', 80, 160]} />

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
      <WorldLabels />

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
  const initializeWorld  = useWorldStore((s) => s.initializeWorld);
  const setConnected     = useWorldStore((s) => s.setConnected);
  const setWs            = useWorldStore((s) => s.setWs);
  const loadChunk        = useWorldStore((s) => s.loadChunk);
  const addOnlineUser    = useWorldStore((s) => s.addOnlineUser);
  const removeOnlineUser = useWorldStore((s) => s.removeOnlineUser);
  const updateOnlineUser = useWorldStore((s) => s.updateOnlineUser);
  const addActivity      = useWorldStore((s) => s.addActivity);
  const setLabel         = useWorldStore((s) => s.setLabel);
  const removeLabel      = useWorldStore((s) => s.removeLabel);
  const getChunks        = useWorldStore((s) => s.chunks);
  const wsRef            = useRef<WebSocket | null>(null);

  useEffect(() => {
    initializeWorld();
  }, [initializeWorld]);

  // ── WebSocket connection ──
  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8080';
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setWs(ws);

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ type: 'auth', token: 'Observer' }));
        ws.send(JSON.stringify({ type: 'join_world', worldId: 'default' }));
      };

      ws.onclose = () => {
        setConnected(false);
        setWs(null);
        wsRef.current = null;
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (ev) => {
        let msg: WSServerMessage;
        try { msg = JSON.parse(ev.data); } catch { return; }

        switch (msg.type) {
          case 'chunk_data':
            loadChunk(msg.chunk);
            break;

          case 'action_applied': {
            const action = msg.action as WorldAction;
            const p = action.payload as Record<string, unknown>;
            // Apply single-block actions directly to client chunks
            if (action.type === 'place_block' || action.type === 'paint_block') {
              const pos = p.position as { x: number; y: number; z: number };
              const mat = p.material as number;
              const coord = worldToChunk(pos);
              const key = chunkKey(coord);
              const chunks = useWorldStore.getState().chunks;
              let chunk = chunks.get(key);
              if (!chunk) chunk = createEmptyChunk(coord);
              const local = worldToLocal(pos);
              const updated = { ...chunk, version: chunk.version + 1 };
              setBlock(updated, local.x, local.y, local.z, mat);
              loadChunk(updated);
            } else if (action.type === 'remove_block') {
              const pos = p.position as { x: number; y: number; z: number };
              const coord = worldToChunk(pos);
              const key = chunkKey(coord);
              const chunks = useWorldStore.getState().chunks;
              const chunk = chunks.get(key);
              if (chunk) {
                const local = worldToLocal(pos);
                const updated = { ...chunk, version: chunk.version + 1 };
                setBlock(updated, local.x, local.y, local.z, BLOCK_MATERIALS.AIR);
                loadChunk(updated);
              }
            }
            // For fill_region / batch_place the server will push updated chunk_data
            addActivity({
              actorName: action.actorId.slice(0, 8),
              actorType: action.actorType,
              message: `${action.type.replace(/_/g, ' ')}`,
            });
            break;
          }

          case 'agent_connected':
            addOnlineUser({ id: msg.agentId, name: msg.name, type: 'agent' });
            addActivity({ actorName: msg.name, actorType: 'agent', message: 'connected' });
            break;

          case 'agent_disconnected':
            removeOnlineUser(msg.agentId);
            addActivity({ actorName: msg.agentId.slice(0, 8), actorType: 'agent', message: 'disconnected' });
            break;

          case 'user_joined':
            addOnlineUser({ id: msg.userId, name: msg.name, type: 'user' });
            break;

          case 'user_left':
            removeOnlineUser(msg.userId);
            break;

          case 'cursor_update':
            updateOnlineUser(msg.userId, { position: msg.position, tool: msg.tool });
            break;

          case 'chat':
            addActivity({ actorName: msg.name, actorType: 'user', message: msg.message });
            break;

          case 'label_set':
            setLabel(msg.label);
            break;

          case 'label_removed':
            removeLabel(msg.labelId);
            break;

          case 'error':
            console.warn('[ws] server error:', msg.message);
            break;
        }
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBlockClick = useCallback(() => {
    // Humans are observers only - no building actions allowed
  }, []);

  return (
    <Canvas
      camera={{ position: [80, 45, 80], fov: 65, near: 0.1, far: 1200 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <SceneContent onBlockClick={handleBlockClick} />
    </Canvas>
  );
}
