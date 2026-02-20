import 'dotenv/config';
import { WebSocketServer, WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import {
  type WSClientMessage,
  type WSServerMessage,
  type ChunkData,
  type Vec3,
  type WorldAction,
  chunkKey,
  createGroundChunk,
  createEmptyChunk,
  setBlock,
  getBlock,
  worldToChunk,
  worldToLocal,
  serializeChunk,
  BLOCK_MATERIALS,
  ROLES,
  ROLE_PERMISSIONS,
  DEFAULT_RATE_LIMITS,
  type Role,
} from '@fio/shared';

// ─── Types ───
interface Client {
  id: string;
  ws: WebSocket;
  name: string;
  type: 'user' | 'agent';
  role: Role;
  worldId: string | null;
  lastAction: number;
  actionCount: number;
}

interface WorldState {
  id: string;
  name: string;
  chunks: Map<string, ChunkData>;
  entities: Map<string, unknown>;
  clients: Set<string>;
  auditLog: WorldAction[];
  proposalMode: boolean;
}

// ─── Rate Limiter ───
class RateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();

  check(key: string, limit: number, windowMs: number = 60_000): boolean {
    const now = Date.now();
    const entry = this.windows.get(key);
    if (!entry || now > entry.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
  }
}

// ─── Server State ───
const PORT = parseInt(process.env.WS_SERVER_PORT || '8080', 10);
const clients = new Map<string, Client>();
const worlds = new Map<string, WorldState>();
const rateLimiter = new RateLimiter();

// Create default world
function getOrCreateWorld(worldId: string): WorldState {
  let world = worlds.get(worldId);
  if (!world) {
    world = {
      id: worldId,
      name: 'Default World',
      chunks: new Map(),
      entities: new Map(),
      clients: new Set(),
      auditLog: [],
      proposalMode: false,
    };
    // Initialize ground chunks
    const radius = 3;
    for (let cx = -radius; cx <= radius; cx++) {
      for (let cz = -radius; cz <= radius; cz++) {
        const chunk = createGroundChunk({ cx, cy: 0, cz });
        world.chunks.set(chunkKey(chunk.coord), chunk);
      }
    }
    worlds.set(worldId, world);
    console.log(`[world] Created world "${worldId}" with ${world.chunks.size} chunks`);
  }
  return world;
}

// Initialize default world
getOrCreateWorld('default');

// ─── Broadcast ───
function broadcast(worldId: string, msg: WSServerMessage, excludeId?: string) {
  const world = worlds.get(worldId);
  if (!world) return;
  const data = JSON.stringify(msg);
  for (const clientId of world.clients) {
    if (clientId === excludeId) continue;
    const client = clients.get(clientId);
    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }
}

function send(client: Client, msg: WSServerMessage) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(msg));
  }
}

// ─── Permission Check ───
function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

// ─── Handle Messages ───
function handleMessage(client: Client, raw: string) {
  let msg: WSClientMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    send(client, { type: 'error', message: 'Invalid JSON' });
    return;
  }

  switch (msg.type) {
    case 'auth': {
      // Simplified auth: accept any token, assign user role
      // In production: validate JWT / session token / agent API key
      client.name = msg.token || `User-${client.id.slice(0, 6)}`;
      // Humans are observers only — agents get builder role via API key auth
      client.role = client.type === 'agent' ? ROLES.BUILDER : ROLES.VIEWER;
      send(client, { type: 'auth_ok', userId: client.id, role: client.role });
      console.log(`[auth] ${client.name} (${client.id}) authenticated as ${client.role}`);
      break;
    }

    case 'join_world': {
      const worldId = msg.worldId || 'default';
      const world = getOrCreateWorld(worldId);

      // Leave previous world
      if (client.worldId) {
        const prev = worlds.get(client.worldId);
        prev?.clients.delete(client.id);
        broadcast(client.worldId, { type: 'user_left', userId: client.id }, client.id);
      }

      client.worldId = worldId;
      world.clients.add(client.id);

      // Send world info
      const users: string[] = [];
      const agents: string[] = [];
      for (const cid of world.clients) {
        const c = clients.get(cid);
        if (c?.type === 'agent') agents.push(cid);
        else users.push(cid);
      }
      send(client, { type: 'world_joined', worldId, users, agents });

      // Broadcast join
      if (client.type === 'agent') {
        broadcast(worldId, { type: 'agent_connected', agentId: client.id, name: client.name }, client.id);
      } else {
        broadcast(worldId, { type: 'user_joined', userId: client.id, name: client.name }, client.id);
      }

      // Send existing chunks
      for (const [, chunk] of world.chunks) {
        send(client, { type: 'chunk_data', chunk: serializeChunk(chunk) as ChunkData });
      }

      console.log(`[world] ${client.name} joined "${worldId}" (${world.clients.size} online)`);
      break;
    }

    case 'action': {
      if (!client.worldId) {
        send(client, { type: 'error', message: 'Not in a world' });
        return;
      }
      // Only agents can modify the world — humans are observers
      if (client.type !== 'agent') {
        send(client, { type: 'error', message: 'Only agents can modify the world' });
        return;
      }
      if (!hasPermission(client.role, 'write')) {
        send(client, { type: 'error', message: 'No write permission' });
        return;
      }

      // Rate limit
      const limitKey = `${client.type}:${client.id}`;
      const limit = client.type === 'agent' ? DEFAULT_RATE_LIMITS.agent : DEFAULT_RATE_LIMITS.user;
      if (!rateLimiter.check(limitKey, limit)) {
        send(client, { type: 'error', message: 'Rate limited' });
        return;
      }

      const world = worlds.get(client.worldId);
      if (!world) return;

      const action: WorldAction = {
        id: nanoid(),
        worldId: client.worldId,
        actorId: client.id,
        actorType: client.type,
        type: msg.action.type,
        payload: msg.action.payload,
        timestamp: new Date().toISOString(),
        status: 'applied',
      };

      // Check proposal mode for agents
      if (world.proposalMode && client.type === 'agent') {
        action.status = 'pending';
        world.auditLog.push(action);
        broadcast(client.worldId, {
          type: 'proposal_created',
          proposal: {
            id: nanoid(),
            worldId: client.worldId,
            agentId: client.id,
            actions: [action],
            description: `Agent ${client.name} proposed: ${action.type}`,
            status: 'pending',
            createdAt: action.timestamp,
          },
        });
        return;
      }

      // Apply action
      const applied = applyAction(world, action);
      if (applied) {
        world.auditLog.push(action);
        broadcast(client.worldId, { type: 'action_applied', action });
      } else {
        send(client, { type: 'action_rejected', actionId: action.id, reason: 'Failed to apply' });
      }
      break;
    }

    case 'request_chunk': {
      if (!client.worldId) return;
      const world = worlds.get(client.worldId);
      if (!world) return;
      const key = chunkKey(msg.coord);
      let chunk = world.chunks.get(key);
      if (!chunk) {
        chunk = msg.coord.cy <= 0
          ? createGroundChunk(msg.coord)
          : createEmptyChunk(msg.coord);
        world.chunks.set(key, chunk);
      }
      send(client, { type: 'chunk_data', chunk: serializeChunk(chunk) as ChunkData });
      break;
    }

    case 'cursor_update': {
      if (!client.worldId) return;
      broadcast(client.worldId, {
        type: 'cursor_update',
        userId: client.id,
        position: msg.position,
        tool: msg.tool,
      }, client.id);
      break;
    }

    case 'chat': {
      if (!client.worldId) return;
      broadcast(client.worldId, {
        type: 'chat',
        userId: client.id,
        name: client.name,
        message: msg.message,
      });
      break;
    }

    default:
      send(client, { type: 'error', message: `Unknown message type` });
  }
}

// ─── Apply World Action ───
function applyAction(world: WorldState, action: WorldAction): boolean {
  const payload = (action.payload as unknown) as Record<string, unknown>;

  switch (action.type) {
    case 'place_block': {
      const pos = payload.position as Vec3;
      const material = payload.material as number;
      const coord = worldToChunk(pos);
      const key = chunkKey(coord);
      let chunk = world.chunks.get(key);
      if (!chunk) {
        chunk = createEmptyChunk(coord);
        world.chunks.set(key, chunk);
      }
      const local = worldToLocal(pos);
      // Store previous state for rollback
      action.previousState = { block: getBlock(chunk, local.x, local.y, local.z) };
      setBlock(chunk, local.x, local.y, local.z, material);
      return true;
    }

    case 'remove_block': {
      const pos = payload.position as Vec3;
      const coord = worldToChunk(pos);
      const key = chunkKey(coord);
      const chunk = world.chunks.get(key);
      if (!chunk) return false;
      const local = worldToLocal(pos);
      action.previousState = { block: getBlock(chunk, local.x, local.y, local.z) };
      setBlock(chunk, local.x, local.y, local.z, BLOCK_MATERIALS.AIR);
      return true;
    }

    case 'paint_block': {
      const pos = payload.position as Vec3;
      const material = payload.material as number;
      const coord = worldToChunk(pos);
      const key = chunkKey(coord);
      const chunk = world.chunks.get(key);
      if (!chunk) return false;
      const local = worldToLocal(pos);
      const current = getBlock(chunk, local.x, local.y, local.z);
      if (current === BLOCK_MATERIALS.AIR) return false;
      action.previousState = { block: current };
      setBlock(chunk, local.x, local.y, local.z, material);
      return true;
    }

    default:
      console.log(`[action] Unhandled action type: ${action.type}`);
      return false;
  }
}

// ─── WebSocket Server ───
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws, req) => {
  const clientId = nanoid();
  const client: Client = {
    id: clientId,
    ws,
    name: `Anon-${clientId.slice(0, 6)}`,
    type: 'user',
    role: ROLES.VIEWER,
    worldId: null,
    lastAction: 0,
    actionCount: 0,
  };
  clients.set(clientId, client);

  const ip = req.socket.remoteAddress || 'unknown';
  console.log(`[ws] Client connected: ${clientId} from ${ip}`);

  ws.on('message', (data) => {
    // IP-level rate limiting
    if (!rateLimiter.check(`ip:${ip}`, DEFAULT_RATE_LIMITS.ip * 10)) {
      send(client, { type: 'error', message: 'IP rate limited' });
      return;
    }
    handleMessage(client, data.toString());
  });

  ws.on('close', () => {
    if (client.worldId) {
      const world = worlds.get(client.worldId);
      world?.clients.delete(clientId);
      if (client.type === 'agent') {
        broadcast(client.worldId, { type: 'agent_disconnected', agentId: clientId });
      } else {
        broadcast(client.worldId, { type: 'user_left', userId: clientId });
      }
      console.log(`[ws] ${client.name} disconnected from "${client.worldId}"`);
    }
    clients.delete(clientId);
  });

  ws.on('error', (err) => {
    console.error(`[ws] Error for ${clientId}:`, err.message);
  });
});

console.log(`[fio] WebSocket server running on port ${PORT}`);
console.log(`[fio] Default world initialized with ${worlds.get('default')?.chunks.size} chunks`);
