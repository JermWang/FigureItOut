import { create } from 'zustand';
import { nanoid } from 'nanoid';
import {
  BLOCK_MATERIALS,
  CHUNK_SIZE,
  TOOLS,
  type Tool,
  type BlockMaterialId,
  type ChunkData,
  type Vec3,
  type Entity,
  type WorldAction,
  type WorldLabel,
  chunkKey,
  createGroundChunk,
  createEmptyChunk,
  worldToChunk,
  worldToLocal,
  localToIndex,
  setBlock,
  getBlock,
} from '@fio/shared';

export type { WorldLabel };

export interface ActivityItem {
  id: string;
  actorName: string;
  actorType: 'user' | 'agent';
  message: string;
  timestamp: number;
}

export interface OnlineUser {
  id: string;
  name: string;
  type: 'user' | 'agent';
  position?: Vec3;
  tool?: Tool;
}

interface WorldState {
  // Connection
  worldId: string | null;
  connected: boolean;
  ws: WebSocket | null;

  // Chunks
  chunks: Map<string, ChunkData>;

  // Entities
  entities: Map<string, Entity>;

  // Tool state
  hoveredBlock: Vec3 | null;
  hoveredFace: Vec3 | null;
  selectedEntity: string | null;

  // Camera
  cameraMode: 'orbit' | 'fly';
  cameraPosition: Vec3;

  // Online
  onlineUsers: OnlineUser[];

  // Activity feed
  activityFeed: ActivityItem[];

  // UI
  introVisible: boolean;
  showCommandBar: boolean;
  showAgentModal: boolean;
  leftPanelOpen: boolean;
  selectedAgent: OnlineUser | null;

  // Labels
  labels: Map<string, WorldLabel>;

  // Actions
  setWorldId: (id: string) => void;
  setConnected: (v: boolean) => void;
  setWs: (ws: WebSocket | null) => void;
  setHoveredBlock: (pos: Vec3 | null, face: Vec3 | null) => void;
  setSelectedEntity: (id: string | null) => void;
  setCameraMode: (m: 'orbit' | 'fly') => void;
  setCameraPosition: (p: Vec3) => void;
  setIntroVisible: (v: boolean) => void;
  setShowCommandBar: (v: boolean) => void;
  setShowAgentModal: (v: boolean) => void;
  setLeftPanelOpen: (v: boolean) => void;
  setSelectedAgent: (agent: OnlineUser | null) => void;
  dismissIntro: () => void;

  // World operations
  loadChunk: (chunk: ChunkData) => void;
  getOrCreateChunk: (cx: number, cy: number, cz: number) => ChunkData;
  getBlockAt: (worldPos: Vec3) => number;

  // Entity operations
  addEntity: (entity: Entity) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, changes: Partial<Entity>) => void;

  // Online users
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (id: string) => void;
  updateOnlineUser: (id: string, changes: Partial<OnlineUser>) => void;

  // Activity
  addActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => void;

  // Labels
  setLabel: (label: WorldLabel) => void;
  removeLabel: (labelId: string) => void;

  // Initialization
  initializeWorld: () => void;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  worldId: null,
  connected: false,
  ws: null,
  chunks: new Map(),
  entities: new Map(),
  hoveredBlock: null,
  hoveredFace: null,
  selectedEntity: null,
  cameraMode: 'orbit',
  cameraPosition: { x: 0, y: 30, z: 30 },
  onlineUsers: [],
  activityFeed: [],
  introVisible: true,
  showCommandBar: false,
  showAgentModal: false,
  leftPanelOpen: true,
  selectedAgent: null,
  labels: new Map(),

  setWorldId: (id) => set({ worldId: id }),
  setConnected: (v) => set({ connected: v }),
  setWs: (ws) => set({ ws }),
  setHoveredBlock: (pos, face) => set({ hoveredBlock: pos, hoveredFace: face }),
  setSelectedEntity: (id) => set({ selectedEntity: id }),
  setCameraMode: (m) => set({ cameraMode: m }),
  setCameraPosition: (p) => set({ cameraPosition: p }),
  setIntroVisible: (v) => set({ introVisible: v }),
  setShowCommandBar: (v) => set({ showCommandBar: v }),
  setShowAgentModal: (v) => set({ showAgentModal: v }),
  setLeftPanelOpen: (v) => set({ leftPanelOpen: v }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  dismissIntro: () => set({ introVisible: false }),

  loadChunk: (chunk) => {
    const key = chunkKey(chunk.coord);
    set((state) => {
      const newChunks = new Map(state.chunks);
      newChunks.set(key, chunk);
      return { chunks: newChunks };
    });
  },

  getOrCreateChunk: (cx: number, cy: number, cz: number) => {
    const key = chunkKey({ cx, cy, cz });
    const existing = get().chunks.get(key);
    if (existing) return existing;
    const chunk = cy <= 0
      ? createGroundChunk({ cx, cy, cz })
      : createEmptyChunk({ cx, cy, cz });
    get().loadChunk(chunk);
    return chunk;
  },

  getBlockAt: (worldPos: Vec3) => {
    const coord = worldToChunk(worldPos);
    const key = chunkKey(coord);
    const chunk = get().chunks.get(key);
    if (!chunk) return BLOCK_MATERIALS.AIR;
    const local = worldToLocal(worldPos);
    return getBlock(chunk, local.x, local.y, local.z);
  },

  addEntity: (entity: Entity) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      newEntities.set(entity.id, entity);
      return { entities: newEntities };
    });
  },

  removeEntity: (id: string) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      newEntities.delete(id);
      return { entities: newEntities };
    });
  },

  updateEntity: (id: string, changes: Partial<Entity>) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      const existing = newEntities.get(id);
      if (existing) {
        newEntities.set(id, { ...existing, ...changes });
      }
      return { entities: newEntities };
    });
  },

  addOnlineUser: (user: OnlineUser) => {
    set((s) => ({ onlineUsers: [...s.onlineUsers.filter((u) => u.id !== user.id), user] }));
  },

  removeOnlineUser: (id: string) => {
    set((s) => ({ onlineUsers: s.onlineUsers.filter((u) => u.id !== id) }));
  },

  updateOnlineUser: (id: string, changes: Partial<OnlineUser>) => {
    set((s) => ({
      onlineUsers: s.onlineUsers.map((u) => (u.id === id ? { ...u, ...changes } : u)),
    }));
  },

  setLabel: (label: WorldLabel) => {
    set((s) => {
      const next = new Map(s.labels);
      next.set(label.id, label);
      return { labels: next };
    });
  },

  removeLabel: (labelId: string) => {
    set((s) => {
      const next = new Map(s.labels);
      next.delete(labelId);
      return { labels: next };
    });
  },

  addActivity: (item: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    const newItem: ActivityItem = {
      ...item,
      id: nanoid(),
      timestamp: Date.now(),
    };
    set((s) => ({
      activityFeed: [newItem, ...s.activityFeed].slice(0, 50), // keep last 50
    }));
  },

  initializeWorld: () => {
    // Basic ground
    const radius = 3;
    for (let cx = -radius; cx <= radius; cx++) {
      for (let cz = -radius; cz <= radius; cz++) {
        get().getOrCreateChunk(cx, 0, cz);
      }
    }
    get().addActivity({
      actorName: 'System',
      actorType: 'user',
      message: 'World initialized',
    });
  },
}));
