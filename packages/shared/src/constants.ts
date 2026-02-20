// ─── World Constants ───
export const CHUNK_SIZE = 16;
export const CHUNK_VOLUME = CHUNK_SIZE ** 3;
export const WORLD_HEIGHT_CHUNKS = 16; // 256 blocks tall
export const WORLD_HEIGHT = CHUNK_SIZE * WORLD_HEIGHT_CHUNKS;
export const SEA_LEVEL = 64;

// ─── Block Materials ───
export const BLOCK_MATERIALS = {
  AIR: 0,
  STONE: 1,
  DIRT: 2,
  GRASS: 3,
  SAND: 4,
  WATER: 5,
  WOOD: 6,
  LEAVES: 7,
  GLASS: 8,
  BRICK: 9,
  METAL: 10,
  CONCRETE: 11,
  GLOW: 12,
} as const;

export type BlockMaterialId = (typeof BLOCK_MATERIALS)[keyof typeof BLOCK_MATERIALS];

export const BLOCK_COLORS: Record<number, string> = {
  [BLOCK_MATERIALS.AIR]: '#00000000',
  [BLOCK_MATERIALS.STONE]: '#8a8a8a',
  [BLOCK_MATERIALS.DIRT]: '#6b4423',
  [BLOCK_MATERIALS.GRASS]: '#4a8c3f',
  [BLOCK_MATERIALS.SAND]: '#d4c07a',
  [BLOCK_MATERIALS.WATER]: '#3a7ec8',
  [BLOCK_MATERIALS.WOOD]: '#8b6914',
  [BLOCK_MATERIALS.LEAVES]: '#2d6b1e',
  [BLOCK_MATERIALS.GLASS]: '#c8e6f0',
  [BLOCK_MATERIALS.BRICK]: '#a0522d',
  [BLOCK_MATERIALS.METAL]: '#b0b0b0',
  [BLOCK_MATERIALS.CONCRETE]: '#c0c0c0',
  [BLOCK_MATERIALS.GLOW]: '#ffe066',
};

export const BLOCK_NAMES: Record<number, string> = {
  [BLOCK_MATERIALS.AIR]: 'Air',
  [BLOCK_MATERIALS.STONE]: 'Stone',
  [BLOCK_MATERIALS.DIRT]: 'Dirt',
  [BLOCK_MATERIALS.GRASS]: 'Grass',
  [BLOCK_MATERIALS.SAND]: 'Sand',
  [BLOCK_MATERIALS.WATER]: 'Water',
  [BLOCK_MATERIALS.WOOD]: 'Wood',
  [BLOCK_MATERIALS.LEAVES]: 'Leaves',
  [BLOCK_MATERIALS.GLASS]: 'Glass',
  [BLOCK_MATERIALS.BRICK]: 'Brick',
  [BLOCK_MATERIALS.METAL]: 'Metal',
  [BLOCK_MATERIALS.CONCRETE]: 'Concrete',
  [BLOCK_MATERIALS.GLOW]: 'Glow',
};

// ─── Roles & Permissions ───
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  BUILDER: 'builder',
  VIEWER: 'viewer',
  AGENT: 'agent',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<Role, Set<string>> = {
  [ROLES.OWNER]: new Set([
    'read', 'write', 'delete', 'manage_roles', 'manage_agents',
    'snapshot', 'rollback', 'set_permissions', 'approve_proposals',
  ]),
  [ROLES.ADMIN]: new Set([
    'read', 'write', 'delete', 'manage_agents',
    'snapshot', 'rollback', 'approve_proposals',
  ]),
  [ROLES.BUILDER]: new Set(['read', 'write', 'delete']),
  [ROLES.VIEWER]: new Set(['read']),
  [ROLES.AGENT]: new Set(['read', 'write']),
};

// ─── Rate Limits (requests per minute) ───
export const DEFAULT_RATE_LIMITS = {
  agent: 120,
  user: 60,
  ip: 30,
} as const;

// ─── Tools ───
export const TOOLS = {
  PLACE: 'place',
  REMOVE: 'remove',
  PAINT: 'paint',
  SELECT: 'select',
  MOVE: 'move',
  ROTATE: 'rotate',
} as const;

export type Tool = (typeof TOOLS)[keyof typeof TOOLS];
