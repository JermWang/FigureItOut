import type { Role, Tool, BlockMaterialId } from './constants';

// ─── Vector Types ───
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform {
  position: Vec3;
  rotation: Quaternion;
  scale: Vec3;
}

// ─── Chunk ───
export interface ChunkCoord {
  cx: number;
  cy: number;
  cz: number;
}

/** Palette-compressed chunk: palette maps local index → material id, data stores indices */
export interface ChunkData {
  coord: ChunkCoord;
  palette: number[];       // BlockMaterialId[]
  data: Uint8Array | number[]; // indices into palette, length = CHUNK_VOLUME
  version: number;
  dirty: boolean;
}

// ─── Entity System ───
export interface Component {
  type: string;
  data: Record<string, unknown>;
}

export interface Entity {
  id: string;
  type: string;
  worldId: string;
  transform: Transform;
  components: Component[];
  metadata: Record<string, unknown>;
  ownerId: string;
  permissions: EntityPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface EntityPermissions {
  canEdit: string[];   // user/agent ids
  canDelete: string[]; // user/agent ids
  isPublic: boolean;
}

// ─── World ───
export interface World {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  settings: WorldSettings;
  createdAt: string;
  updatedAt: string;
}

export interface WorldSettings {
  chunkSize: number;
  seed: number;
  proposalMode: boolean; // if true, agent changes require approval
  maxEntities: number;
  gravity: number;
}

// ─── User / Agent ───
export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  worldId: string;
}

export interface AgentKey {
  id: string;
  key: string;
  name: string;
  worldId: string;
  ownerId: string;
  role: Role;
  permissions: string[];
  quotas: AgentQuotas;
  active: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface AgentQuotas {
  maxBlocksPerMinute: number;
  maxEntitiesPerMinute: number;
  maxRegionSize: Vec3; // max region an agent can modify at once
}

// ─── Actions & Diffs ───
export type ActionType =
  | 'place_block'
  | 'remove_block'
  | 'paint_block'
  | 'fill_region'
  | 'batch_place'
  | 'copy_region'
  | 'paste_region'
  | 'set_label'
  | 'remove_label'
  | 'agent_memo'
  | 'spawn_entity'
  | 'delete_entity'
  | 'update_entity'
  | 'attach_script'
  | 'set_region_permissions'
  | 'terrain_edit';

export interface WorldAction {
  id: string;
  worldId: string;
  actorId: string;
  actorType: 'user' | 'agent';
  type: ActionType;
  payload: ActionPayload;
  timestamp: string;
  status: 'applied' | 'pending' | 'rejected' | 'rolled_back';
  previousState?: unknown; // for rollback
}

export type ActionPayload =
  | PlaceBlockPayload
  | RemoveBlockPayload
  | PaintBlockPayload
  | FillRegionPayload
  | BatchPlacePayload
  | CopyRegionPayload
  | PasteRegionPayload
  | SetLabelPayload
  | RemoveLabelPayload
  | AgentMemoPayload
  | SpawnEntityPayload
  | DeleteEntityPayload
  | UpdateEntityPayload
  | AttachScriptPayload
  | SetRegionPermissionsPayload
  | TerrainEditPayload;

export interface PlaceBlockPayload {
  type: 'place_block';
  position: Vec3;
  material: BlockMaterialId;
}

export interface RemoveBlockPayload {
  type: 'remove_block';
  position: Vec3;
}

export interface PaintBlockPayload {
  type: 'paint_block';
  position: Vec3;
  material: BlockMaterialId;
}

export interface SpawnEntityPayload {
  type: 'spawn_entity';
  entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface DeleteEntityPayload {
  type: 'delete_entity';
  entityId: string;
}

export interface UpdateEntityPayload {
  type: 'update_entity';
  entityId: string;
  changes: Partial<Entity>;
}

export interface AttachScriptPayload {
  type: 'attach_script';
  entityId: string;
  script: string; // script source
  scriptName: string;
}

export interface SetRegionPermissionsPayload {
  type: 'set_region_permissions';
  regionMin: Vec3;
  regionMax: Vec3;
  allowedRoles: Role[];
  allowedIds: string[];
}

export interface TerrainEditPayload {
  type: 'terrain_edit';
  regionMin: Vec3;
  regionMax: Vec3;
  heightDelta: number;
  material?: BlockMaterialId;
}

/** Fill a rectangular region with one material. Max 32x32x32 = 32768 blocks per call. */
export interface FillRegionPayload {
  type: 'fill_region';
  min: Vec3;
  max: Vec3;
  material: BlockMaterialId;
}

/** Place up to 2048 blocks in a single message. */
export interface BatchPlacePayload {
  type: 'batch_place';
  blocks: Array<{ position: Vec3; material: BlockMaterialId }>;
}

/** Copy a region into the agent's clipboard (server-side, per-agent). */
export interface CopyRegionPayload {
  type: 'copy_region';
  min: Vec3;
  max: Vec3;
  label?: string; // optional name for this clipboard slot
}

/** Paste the agent's clipboard at a new origin. */
export interface PasteRegionPayload {
  type: 'paste_region';
  origin: Vec3;   // where min corner of copied region goes
  label?: string; // which clipboard slot to paste
  flipX?: boolean;
  flipZ?: boolean;
  rotate90?: number; // 0|1|2|3 clockwise 90° steps around Y axis
}

/** Attach a floating text label to a world position (visible to all observers). */
export interface SetLabelPayload {
  type: 'set_label';
  position: Vec3;
  text: string;       // max 120 chars
  color?: string;     // hex e.g. '#ff0000'
  agentId?: string;   // auto-filled server-side
}

/** Remove a label at a position. */
export interface RemoveLabelPayload {
  type: 'remove_label';
  position: Vec3;
}

/** Agent stores a persistent key-value memo about the world (e.g. plans, observations). */
export interface AgentMemoPayload {
  type: 'agent_memo';
  key: string;    // e.g. 'plan', 'zone_north', 'todo'
  value: string;  // any string, max 4096 chars
  ttl?: number;   // optional seconds until expiry (default: forever)
}

/** A label in the world */
export interface WorldLabel {
  id: string;
  position: Vec3;
  text: string;
  color: string;
  agentId: string;
  agentName: string;
  createdAt: string;
}

// ─── Proposals (agent changes requiring approval) ───
export interface Proposal {
  id: string;
  worldId: string;
  agentId: string;
  actions: WorldAction[];
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ─── WebSocket Messages ───
export type WSClientMessage =
  | { type: 'auth'; token: string }
  | { type: 'join_world'; worldId: string }
  | { type: 'leave_world'; worldId: string }
  | { type: 'action'; action: Omit<WorldAction, 'id' | 'timestamp' | 'status'> }
  | { type: 'request_chunk'; coord: ChunkCoord }
  | { type: 'cursor_update'; position: Vec3; tool: Tool }
  | { type: 'chat'; message: string };

export type WSServerMessage =
  | { type: 'auth_ok'; userId: string; role: Role }
  | { type: 'auth_error'; message: string }
  | { type: 'world_joined'; worldId: string; users: string[]; agents: string[] }
  | { type: 'chunk_data'; chunk: ChunkData }
  | { type: 'action_applied'; action: WorldAction }
  | { type: 'action_rejected'; actionId: string; reason: string }
  | { type: 'proposal_created'; proposal: Proposal }
  | { type: 'user_joined'; userId: string; name: string }
  | { type: 'user_left'; userId: string }
  | { type: 'agent_connected'; agentId: string; name: string }
  | { type: 'agent_disconnected'; agentId: string }
  | { type: 'cursor_update'; userId: string; position: Vec3; tool: Tool }
  | { type: 'chat'; userId: string; name: string; message: string }
  | { type: 'error'; message: string }
  | { type: 'snapshot_created'; snapshotId: string; timestamp: string }
  | { type: 'rollback_applied'; snapshotId: string; timestamp: string }
  | { type: 'label_set'; label: WorldLabel }
  | { type: 'label_removed'; labelId: string }
  | { type: 'memo_ack'; agentId: string; key: string }
  | { type: 'memo_data'; agentId: string; key: string; value: string | null }
  | { type: 'copy_ack'; agentId: string; label: string; blockCount: number }
  | { type: 'paste_ack'; agentId: string; blockCount: number };

// ─── Agent API Types ───
export interface AgentAuthRequest {
  apiKey: string;
  worldId: string;
}

export interface AgentAuthResponse {
  token: string;
  agentId: string;
  worldId: string;
  permissions: string[];
  expiresAt: string;
}

export interface WorldStateSummary {
  worldId: string;
  name: string;
  chunkCount: number;
  entityCount: number;
  onlineUsers: number;
  onlineAgents: number;
  loadedChunks: ChunkCoord[];
}

export interface WorldPatch {
  actions: Array<Omit<WorldAction, 'id' | 'timestamp' | 'status' | 'worldId' | 'actorId' | 'actorType'>>;
  description?: string;
}

export interface WorldPatchResult {
  applied: number;
  rejected: number;
  results: Array<{ actionId: string; status: 'applied' | 'pending' | 'rejected'; reason?: string }>;
}

// ─── Audit Log ───
export interface AuditEntry {
  id: string;
  worldId: string;
  actorId: string;
  actorType: 'user' | 'agent';
  action: ActionType;
  payload: unknown;
  previousState: unknown;
  timestamp: string;
}

// ─── Snapshots ───
export interface WorldSnapshot {
  id: string;
  worldId: string;
  createdBy: string;
  createdAt: string;
  description: string;
  chunkCount: number;
  entityCount: number;
}
