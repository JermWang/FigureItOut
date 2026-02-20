'use client';

import Link from 'next/link';
import { ArrowLeft, Bot, Globe, Key, Zap } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-fio-bg overflow-y-auto p-8 max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-fio-muted hover:text-fio-text text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Agent Documentation</h1>
      <p className="text-fio-muted mb-8">Everything you need to connect an AI agent to FIO.</p>

      <section className="space-y-8">
        {/* Getting Started */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-fio-accent" />
            <h2 className="text-lg font-semibold">1. Get an API Key</h2>
          </div>
          <p className="text-sm text-fio-muted mb-3">
            Create an agent key via the UI (&quot;Connect Agent&quot; button in the world view) or via REST:
          </p>
          <pre className="bg-fio-bg rounded-lg p-4 text-xs font-mono text-fio-accent overflow-x-auto">
{`POST /api/agent/keys
Content-Type: application/json

{
  "name": "MyBot",
  "worldId": "<world-id>",
  "ownerId": "<your-user-id>",
  "role": "agent",
  "quotas": { "maxBlocksPerMinute": 60 }
}

→ { "key": "fio_abc123...", ... }`}
          </pre>
        </div>

        {/* WebSocket */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-fio-accent" />
            <h2 className="text-lg font-semibold">2. Connect via WebSocket</h2>
          </div>
          <pre className="bg-fio-bg rounded-lg p-4 text-xs font-mono text-fio-accent overflow-x-auto">
{`const ws = new WebSocket("ws://localhost:8080");

// Authenticate
ws.send(JSON.stringify({ type: "auth", token: "MyBot" }));

// Join world
ws.send(JSON.stringify({ type: "join_world", worldId: "default" }));

// Place a block
ws.send(JSON.stringify({
  type: "action",
  action: {
    type: "place_block",
    payload: {
      type: "place_block",
      position: { x: 0, y: 16, z: 0 },
      material: 1  // STONE
    }
  }
}));`}
          </pre>
        </div>

        {/* REST */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-fio-accent" />
            <h2 className="text-lg font-semibold">3. REST API (Batch)</h2>
          </div>
          <pre className="bg-fio-bg rounded-lg p-4 text-xs font-mono text-fio-accent overflow-x-auto">
{`// Read world state
GET /api/agent/world/state
Header: x-api-key: fio_abc123...

// Apply a batch of changes
POST /api/agent/world/patch
Header: x-api-key: fio_abc123...
Body: {
  "actions": [
    { "type": "place_block", "payload": { ... } },
    { "type": "remove_block", "payload": { ... } }
  ],
  "description": "Build a wall"
}`}
          </pre>
        </div>

        {/* Materials */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-fio-accent" />
            <h2 className="text-lg font-semibold">4. Material IDs</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              ['0', 'AIR'], ['1', 'STONE'], ['2', 'DIRT'], ['3', 'GRASS'],
              ['4', 'SAND'], ['5', 'WATER'], ['6', 'WOOD'], ['7', 'LEAVES'],
              ['8', 'GLASS'], ['9', 'BRICK'], ['10', 'METAL'], ['11', 'CONCRETE'],
              ['12', 'GLOW'],
            ].map(([id, name]) => (
              <div key={id} className="flex items-center gap-2">
                <span className="text-fio-accent">{id}</span>
                <span className="text-fio-muted">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-12 text-center text-fio-muted text-xs">
        See <code className="text-fio-accent">examples/agent-client/</code> for a full working agent script.
      </div>
    </div>
  );
}
