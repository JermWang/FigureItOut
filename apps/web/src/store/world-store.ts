import { create } from 'zustand';
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
  chunkKey,
  createGroundChunk,
  createEmptyChunk,
  worldToChunk,
  worldToLocal,
  localToIndex,
  setBlock,
  getBlock,
} from '@fio/shared';

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
  activeTool: Tool;
  activeMaterial: BlockMaterialId;
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
  rightPanelOpen: boolean;

  // Spectator
  selectedAgent: OnlineUser | null;

  // Actions
  setWorldId: (id: string) => void;
  setConnected: (v: boolean) => void;
  setWs: (ws: WebSocket | null) => void;
  setActiveTool: (t: Tool) => void;
  setActiveMaterial: (m: BlockMaterialId) => void;
  setHoveredBlock: (pos: Vec3 | null, face: Vec3 | null) => void;
  setSelectedEntity: (id: string | null) => void;
  setCameraMode: (m: 'orbit' | 'fly') => void;
  setCameraPosition: (p: Vec3) => void;
  setIntroVisible: (v: boolean) => void;
  setShowCommandBar: (v: boolean) => void;
  setShowAgentModal: (v: boolean) => void;
  setLeftPanelOpen: (v: boolean) => void;
  setRightPanelOpen: (v: boolean) => void;
  setSelectedAgent: (agent: OnlineUser | null) => void;
  dismissIntro: () => void;

  // World operations
  loadChunk: (chunk: ChunkData) => void;
  getOrCreateChunk: (cx: number, cy: number, cz: number) => ChunkData;
  placeBlock: (worldPos: Vec3, material: BlockMaterialId) => void;
  removeBlock: (worldPos: Vec3) => void;
  paintBlock: (worldPos: Vec3, material: BlockMaterialId) => void;
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

  // Initialization
  initializeWorld: () => void;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  worldId: null,
  connected: false,
  ws: null,
  chunks: new Map(),
  entities: new Map(),
  activeTool: TOOLS.PLACE,
  activeMaterial: BLOCK_MATERIALS.STONE,
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
  rightPanelOpen: true,
  selectedAgent: null,

  setWorldId: (id) => set({ worldId: id }),
  setConnected: (v) => set({ connected: v }),
  setWs: (ws) => set({ ws }),
  setActiveTool: (t) => set({ activeTool: t }),
  setActiveMaterial: (m) => set({ activeMaterial: m }),
  setHoveredBlock: (pos, face) => set({ hoveredBlock: pos, hoveredFace: face }),
  setSelectedEntity: (id) => set({ selectedEntity: id }),
  setCameraMode: (m) => set({ cameraMode: m }),
  setCameraPosition: (p) => set({ cameraPosition: p }),
  setIntroVisible: (v) => set({ introVisible: v }),
  setShowCommandBar: (v) => set({ showCommandBar: v }),
  setShowAgentModal: (v) => set({ showAgentModal: v }),
  setLeftPanelOpen: (v) => set({ leftPanelOpen: v }),
  setRightPanelOpen: (v) => set({ rightPanelOpen: v }),
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

  getOrCreateChunk: (cx, cy, cz) => {
    const key = chunkKey({ cx, cy, cz });
    const existing = get().chunks.get(key);
    if (existing) return existing;
    const chunk = cy <= 0
      ? createGroundChunk({ cx, cy, cz })
      : createEmptyChunk({ cx, cy, cz });
    get().loadChunk(chunk);
    return chunk;
  },

  placeBlock: (worldPos, material) => {
    const coord = worldToChunk(worldPos);
    const chunk = get().getOrCreateChunk(coord.cx, coord.cy, coord.cz);
    const local = worldToLocal(worldPos);
    setBlock(chunk, local.x, local.y, local.z, material);
    // Trigger re-render by creating new map ref
    set((state) => {
      const newChunks = new Map(state.chunks);
      newChunks.set(chunkKey(coord), { ...chunk });
      return { chunks: newChunks };
    });
    get().addActivity({
      actorName: 'You',
      actorType: 'user',
      message: `placed block at (${worldPos.x}, ${worldPos.y}, ${worldPos.z})`,
    });
  },

  removeBlock: (worldPos) => {
    const coord = worldToChunk(worldPos);
    const key = chunkKey(coord);
    const chunk = get().chunks.get(key);
    if (!chunk) return;
    const local = worldToLocal(worldPos);
    setBlock(chunk, local.x, local.y, local.z, BLOCK_MATERIALS.AIR);
    set((state) => {
      const newChunks = new Map(state.chunks);
      newChunks.set(key, { ...chunk });
      return { chunks: newChunks };
    });
    get().addActivity({
      actorName: 'You',
      actorType: 'user',
      message: `removed block at (${worldPos.x}, ${worldPos.y}, ${worldPos.z})`,
    });
  },

  paintBlock: (worldPos, material) => {
    const coord = worldToChunk(worldPos);
    const key = chunkKey(coord);
    const chunk = get().chunks.get(key);
    if (!chunk) return;
    const local = worldToLocal(worldPos);
    const current = getBlock(chunk, local.x, local.y, local.z);
    if (current === BLOCK_MATERIALS.AIR) return;
    setBlock(chunk, local.x, local.y, local.z, material);
    set((state) => {
      const newChunks = new Map(state.chunks);
      newChunks.set(key, { ...chunk });
      return { chunks: newChunks };
    });
  },

  getBlockAt: (worldPos) => {
    const coord = worldToChunk(worldPos);
    const key = chunkKey(coord);
    const chunk = get().chunks.get(key);
    if (!chunk) return BLOCK_MATERIALS.AIR;
    const local = worldToLocal(worldPos);
    return getBlock(chunk, local.x, local.y, local.z);
  },

  addEntity: (entity) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      newEntities.set(entity.id, entity);
      return { entities: newEntities };
    });
  },

  removeEntity: (id) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      newEntities.delete(id);
      return { entities: newEntities };
    });
  },

  updateEntity: (id, changes) => {
    set((state) => {
      const newEntities = new Map(state.entities);
      const existing = newEntities.get(id);
      if (existing) {
        newEntities.set(id, { ...existing, ...changes });
      }
      return { entities: newEntities };
    });
  },

  addOnlineUser: (user) => set((s) => ({
    onlineUsers: [...s.onlineUsers.filter((u) => u.id !== user.id), user],
  })),

  removeOnlineUser: (id) => set((s) => ({
    onlineUsers: s.onlineUsers.filter((u) => u.id !== id),
  })),

  updateOnlineUser: (id, changes) => set((s) => ({
    onlineUsers: s.onlineUsers.map((u) => u.id === id ? { ...u, ...changes } : u),
  })),

  addActivity: (item) => {
    const entry: ActivityItem = {
      ...item,
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
    };
    set((s) => ({
      activityFeed: [entry, ...s.activityFeed].slice(0, 200),
    }));
  },

  initializeWorld: () => {
    const renderRadius = 2;
    for (let cx = -renderRadius; cx <= renderRadius; cx++) {
      for (let cz = -renderRadius; cz <= renderRadius; cz++) {
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
