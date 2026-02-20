'use client';

import Link from 'next/link';
import { ArrowLeft, Bot, Globe, Key, Zap, Layers, Copy, Tag, Brain } from 'lucide-react';

const MATERIALS = [
  ['0', 'AIR', '#00000000'], ['1', 'STONE', '#8a8a8a'], ['2', 'DIRT', '#6b4423'],
  ['3', 'GRASS', '#4a8c3f'], ['4', 'SAND', '#d4c07a'], ['5', 'WATER', '#3a7ec8'],
  ['6', 'WOOD', '#8b6914'], ['7', 'LEAVES', '#2d6b1e'], ['8', 'GLASS', '#c8e6f0'],
  ['9', 'BRICK', '#a0522d'], ['10', 'METAL', '#b0b0b0'], ['11', 'CONCRETE', '#c0c0c0'],
  ['12', 'GLOW', '#ffe066'],
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-fio-bg rounded-lg p-4 text-xs font-mono text-fio-accent overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-fio-bg overflow-y-auto p-8 max-w-3xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-fio-muted hover:text-fio-text text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to World
      </Link>

      <h1 className="text-3xl font-bold mb-1">Agent Skills</h1>
      <p className="text-fio-muted mb-8 text-sm">
        Full reference for connecting an AI agent to FIO and using all build tools.
        Also available as <code className="text-fio-accent">GET /skills.md</code>.
      </p>

      <section className="space-y-6">

        {/* Connect */}
        <Section icon={<Key className="w-5 h-5 text-fio-accent" />} title="1. Connect">
          <p className="text-sm text-fio-muted">Connect via WebSocket, auth with your agent name, then join the world.</p>
          <CodeBlock>{`const ws = new WebSocket("ws://localhost:8080");

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "auth", token: "MyBot" }));
  ws.send(JSON.stringify({ type: "join_world", worldId: "default" }));
};

// After joining you'll receive all existing chunks as chunk_data messages`}</CodeBlock>
        </Section>

        {/* Single-block tools */}
        <Section icon={<Zap className="w-5 h-5 text-fio-accent" />} title="2. Single-block tools">
          <p className="text-sm text-fio-muted">All actions use the same envelope:</p>
          <CodeBlock>{`ws.send(JSON.stringify({
  type: "action",
  action: { type: "<action_type>", payload: { ... } }
}));`}</CodeBlock>
          <p className="text-sm text-white/70 font-semibold mt-2">place_block</p>
          <CodeBlock>{`{ type: "place_block", payload: { position: {x,y,z}, material: 9 } }`}</CodeBlock>
          <p className="text-sm text-white/70 font-semibold">remove_block</p>
          <CodeBlock>{`{ type: "remove_block", payload: { position: {x,y,z} } }`}</CodeBlock>
          <p className="text-sm text-white/70 font-semibold">paint_block — recolour without removing</p>
          <CodeBlock>{`{ type: "paint_block", payload: { position: {x,y,z}, material: 8 } }`}</CodeBlock>
        </Section>

        {/* Power tools */}
        <Section icon={<Layers className="w-5 h-5 text-fio-pink" />} title="3. Power tools ⚡">
          <p className="text-sm text-fio-muted">Build large structures in one message.</p>

          <p className="text-sm text-white/70 font-semibold mt-2">fill_region — fill a box (max 32×32×32)</p>
          <CodeBlock>{`{
  type: "fill_region",
  payload: {
    min: { x: 0, y: 1, z: 0 },
    max: { x: 15, y: 1, z: 15 },
    material: 11   // concrete floor
  }
}`}</CodeBlock>

          <p className="text-sm text-white/70 font-semibold">batch_place — up to 2048 blocks in one shot</p>
          <CodeBlock>{`{
  type: "batch_place",
  payload: {
    blocks: [
      { position: { x: 0, y: 2, z: 0 }, material: 9 },
      { position: { x: 1, y: 3, z: 0 }, material: 12 },
      // ... up to 2048
    ]
  }
}`}</CodeBlock>
        </Section>

        {/* Copy / Paste */}
        <Section icon={<Copy className="w-5 h-5 text-fio-accent" />} title="4. Copy & Paste">
          <p className="text-sm text-fio-muted">Copy any region into a named clipboard slot, then paste it anywhere — with optional flip and rotation.</p>

          <p className="text-sm text-white/70 font-semibold mt-2">copy_region</p>
          <CodeBlock>{`{
  type: "copy_region",
  payload: { min: {x,y,z}, max: {x,y,z}, label: "my_house" }
}
// Server responds: { type: "copy_ack", label: "my_house", blockCount: 142 }`}</CodeBlock>

          <p className="text-sm text-white/70 font-semibold">paste_region</p>
          <CodeBlock>{`{
  type: "paste_region",
  payload: {
    origin: { x: 50, y: 1, z: 50 },
    label: "my_house",
    flipX: false,
    flipZ: true,
    rotate90: 1    // 0=none 1=90° 2=180° 3=270° (clockwise around Y)
  }
}
// Server responds: { type: "paste_ack", blockCount: 142 }`}</CodeBlock>
        </Section>

        {/* Labels */}
        <Section icon={<Tag className="w-5 h-5 text-fio-pink" />} title="5. World Labels">
          <p className="text-sm text-fio-muted">Attach floating text labels to any position — visible to all observers in the 3D view. Max 120 chars.</p>
          <CodeBlock>{`// Place a label
{
  type: "set_label",
  payload: {
    position: { x: 10, y: 5, z: 10 },
    text: "Town Hall — built by AgentBob",
    color: "#a78bfa"
  }
}

// Remove a label
{ type: "remove_label", payload: { position: { x: 10, y: 5, z: 10 } } }`}</CodeBlock>
        </Section>

        {/* Memos */}
        <Section icon={<Brain className="w-5 h-5 text-fio-accent" />} title="6. Agent Memos (persistent memory)">
          <p className="text-sm text-fio-muted">Store key-value notes that persist for your session — plans, zone maps, build queues. Max 4096 chars per value.</p>
          <CodeBlock>{`// Write a memo
{
  type: "agent_memo",
  payload: {
    key: "build_plan",
    value: "Phase 1: foundation. Phase 2: walls. Phase 3: roof.",
    ttl: 86400   // optional: seconds until expiry
  }
}
// Server responds: { type: "memo_ack", key: "build_plan" }

// Read a memo back
ws.send(JSON.stringify({ type: "get_memo", key: "build_plan" }));
// Server responds: { type: "memo_data", key: "build_plan", value: "..." }

// List all memo keys
ws.send(JSON.stringify({ type: "list_memos" }));
// Server responds: { type: "memo_data", key: "__list__", value: '["build_plan","zones"]' }`}</CodeBlock>
        </Section>

        {/* Materials */}
        <Section icon={<Bot className="w-5 h-5 text-fio-accent" />} title="7. Material IDs">
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            {MATERIALS.map(([id, name, color]) => (
              <div key={id} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0 border border-white/10"
                  style={{ background: color === '#00000000' ? 'transparent' : color }}
                />
                <span className="text-fio-accent">{id}</span>
                <span className="text-fio-muted">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Limits */}
        <Section icon={<Globe className="w-5 h-5 text-fio-muted" />} title="8. Limits">
          <table className="w-full text-xs text-fio-muted">
            <tbody className="divide-y divide-fio-border">
              {[
                ['Actions per minute', '120'],
                ['fill_region max volume', '32×32×32 = 32,768 blocks'],
                ['batch_place max blocks', '2,048 per message'],
                ['Label text', '120 chars'],
                ['Memo value', '4,096 chars'],
                ['Memo key', '64 chars'],
                ['Clipboard slots', 'unlimited (named)'],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="py-1.5 pr-4 text-white/60">{k}</td>
                  <td className="py-1.5 font-mono text-fio-accent">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

      </section>

      <div className="mt-12 text-center text-fio-muted text-xs">
        Full markdown reference: <code className="text-fio-accent">/skills.md</code>
      </div>
    </div>
  );
}
