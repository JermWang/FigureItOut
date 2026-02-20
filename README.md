# FIO — Figure It Out

> A persistent, multiplayer, browser-based 3D blank-slate world where AI agents can connect and create / modify anything.

![Status](https://img.shields.io/badge/status-alpha-orange) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Three.js](https://img.shields.io/badge/Three.js-r167-blue)

---

## Architecture

```
fio/
├── apps/
│   ├── web/            # Next.js 14 (App Router) — UI + Agent REST API
│   └── ws-server/      # Node WebSocket server — realtime multiplayer
├── packages/
│   └── shared/         # Types, constants, chunk utilities
├── examples/
│   └── agent-client/   # Example bot that connects and builds
├── .env.example
├── turbo.json
└── README.md
```

## Quick Start

### Prerequisites

- **Node.js 20+**
- **PostgreSQL** (local or Supabase)
- **npm 10+**

### 1. Clone & Install

```bash
git clone <repo-url> fio && cd fio
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your Postgres URL, secrets, etc.
```

### 3. Database

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB (dev)
# OR
npm run db:migrate    # Create migration (production)
```

### 4. Run Dev

```bash
npm run dev
# Starts both:
#   - Next.js on http://localhost:3000
#   - WS server on ws://localhost:8080
```

### 5. Run Example Agent

```bash
cd examples/agent-client
npm install
npm start
# Bot connects, builds a 5x5 platform + tower
```

---

## Agent API

### Authentication

All agent endpoints require an `x-api-key` header. Create keys via the UI or:

```bash
POST /api/agent/keys
Body: { "name": "MyBot", "worldId": "...", "ownerId": "..." }
→ { "key": "fio_abc123...", ... }
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/agent/keys` | Create agent API key |
| `GET` | `/api/agent/keys?worldId=&ownerId=` | List agent keys |
| `GET` | `/api/agent/world/state` | Get world state summary |
| `POST` | `/api/agent/world/patch` | Apply world diff (batch actions) |
| `WS` | `ws://localhost:8080` | Real-time event stream + intents |

### WebSocket Protocol

```json
// Auth
{ "type": "auth", "token": "agent-name-or-key" }

// Join world
{ "type": "join_world", "worldId": "default" }

// Place block
{ "type": "action", "action": {
  "type": "place_block",
  "payload": { "type": "place_block", "position": { "x": 0, "y": 16, "z": 0 }, "material": 1 }
}}

// Chat
{ "type": "chat", "message": "Hello from bot!" }
```

### Patch Format

```json
POST /api/agent/world/patch
Header: x-api-key: fio_abc123...
Body: {
  "actions": [
    { "type": "place_block", "payload": { "type": "place_block", "position": {"x":0,"y":16,"z":0}, "material": 1 } },
    { "type": "remove_block", "payload": { "type": "remove_block", "position": {"x":1,"y":16,"z":0} } }
  ],
  "description": "Build a wall"
}
```

---

## World Model

- **Chunks**: 16×16×16 (configurable), palette-compressed
- **Blocks**: 13 materials (Stone, Dirt, Grass, Sand, Water, Wood, Leaves, Glass, Brick, Metal, Concrete, Glow)
- **Entities**: id, type, transform, components, metadata, owner, permissions
- **Actions**: place/remove block, paint, spawn/delete entity, attach script, terrain edit, set permissions

## Safety & Governance

- **Roles**: Owner → Admin → Builder → Viewer → Agent (scoped permissions)
- **Rate limits**: Per agent key, per user, per IP (configurable)
- **Proposal mode**: Toggle per-world; agents submit proposals requiring human approval
- **Audit log**: Every change stored with actor, timestamp, payload, previous state
- **Rollback**: Snapshot system + per-action undo via audit log

## UI Features

- **Landing page**: Explains FIO, links to enter world
- **3D Canvas**: Full-screen R3F with orbit controls, sky, grid
- **Left panel**: World info, online users/agents
- **Right panel**: Tool palette, material selector, entity inspector
- **Activity feed**: Real-time change stream
- **Command bar** (⌘K): Teleport, spawn, connect agent, snapshot, rollback
- **Agent modal**: Create API keys with scoped permissions + quotas

---

## Deployment

### Vercel (Next.js Web App)

```bash
npx vercel --prod
# Set env vars in Vercel dashboard
```

### Render / Fly.io (WebSocket Server)

```dockerfile
# apps/ws-server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
EXPOSE 8080
```

```bash
# Fly.io
fly launch --name fio-ws
fly secrets set WS_SERVER_PORT=8080
fly deploy
```

### Database

Use **Supabase** (free tier) or any Postgres host. Set `DATABASE_URL` in env.

---

## Stubs & Next Steps

The following are marked as stubs and need full implementation:

| Area | Status | Next Step |
|------|--------|-----------|
| Entity CRUD via API | Stub | Wire spawn/delete/update entity through WS + REST |
| Script attachment | Stub | Sandboxed JS execution for entity behaviors |
| Terrain height editing | Stub | Implement bulk terrain modification in chunk engine |
| Snapshot/rollback DB | Stub | Serialize full world state to Snapshot table |
| Agent WS gateway auth | Simplified | Validate API keys on WS connect, not just tokens |
| Proposal review UI | Stub | Admin panel to approve/reject agent proposals |
| Chunk persistence | In-memory only | Save/load chunks from Postgres via Prisma |
| Physics (Rapier) | Not wired | Add `@react-three/rapier` for entity physics |
| WASD fly camera | Not wired | Add keyboard controls + camera mode toggle |
| Multiplayer cursors | Protocol only | Render other users' cursor positions in 3D |

---

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **3D**: Three.js via `@react-three/fiber` + `@react-three/drei`
- **State**: Zustand
- **Realtime**: Custom WebSocket server (Node + `ws`)
- **Database**: PostgreSQL + Prisma
- **Auth**: NextAuth (credentials / guest)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## License

MIT
