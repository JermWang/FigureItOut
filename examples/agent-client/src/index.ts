/**
 * FIO Example Agent Client
 *
 * Connects to the FIO WebSocket server, authenticates, joins a world,
 * reads state, and builds a small 5x5 platform + a 3-block tower.
 *
 * Usage:
 *   cd examples/agent-client
 *   npm install
 *   npm start
 *
 * Environment:
 *   WS_URL=ws://localhost:8080  (default)
 *   AGENT_NAME=ExampleBot        (default)
 */

import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'ws://localhost:8080';
const AGENT_NAME = process.env.AGENT_NAME || 'ExampleBot';
const WORLD_ID = process.env.WORLD_ID || 'default';

interface ServerMessage {
  type: string;
  [key: string]: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[agent] Connecting to ${WS_URL}...`);
  const ws = new WebSocket(WS_URL);

  const waitForOpen = new Promise<void>((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  await waitForOpen;
  console.log('[agent] Connected!');

  // Message handler
  const messageQueue: ServerMessage[] = [];
  ws.on('message', (data: WebSocket.Data) => {
    const msg = JSON.parse(data.toString()) as ServerMessage;
    messageQueue.push(msg);

    switch (msg.type) {
      case 'auth_ok':
        console.log(`[agent] Authenticated as ${msg.userId} (role: ${msg.role})`);
        break;
      case 'world_joined':
        console.log(`[agent] Joined world "${msg.worldId}" — ${(msg.users as string[]).length} users, ${(msg.agents as string[]).length} agents online`);
        break;
      case 'action_applied':
        // Quiet: many actions will be applied
        break;
      case 'action_rejected':
        console.warn(`[agent] Action rejected: ${msg.reason}`);
        break;
      case 'error':
        console.error(`[agent] Server error: ${msg.message}`);
        break;
      case 'chunk_data':
        // Received chunk data (quiet)
        break;
      default:
        console.log(`[agent] Received: ${msg.type}`);
    }
  });

  // 1. Authenticate
  console.log('[agent] Authenticating...');
  ws.send(JSON.stringify({ type: 'auth', token: AGENT_NAME }));
  await sleep(500);

  // 2. Join world
  console.log(`[agent] Joining world "${WORLD_ID}"...`);
  ws.send(JSON.stringify({ type: 'join_world', worldId: WORLD_ID }));
  await sleep(1000);

  // 3. Build a 5x5 stone platform at y=16 (on top of ground)
  console.log('[agent] Building a 5x5 stone platform...');
  for (let x = 0; x < 5; x++) {
    for (let z = 0; z < 5; z++) {
      ws.send(JSON.stringify({
        type: 'action',
        action: {
          type: 'place_block',
          payload: {
            type: 'place_block',
            position: { x: x + 2, y: 16, z: z + 2 },
            material: 1, // STONE
          },
        },
      }));
      await sleep(50); // Small delay to avoid overwhelming
    }
  }
  console.log('[agent] Platform built!');

  // 4. Build a 5-block tower in the center
  console.log('[agent] Building a tower...');
  for (let y = 17; y < 22; y++) {
    ws.send(JSON.stringify({
      type: 'action',
      action: {
        type: 'place_block',
        payload: {
          type: 'place_block',
          position: { x: 4, y, z: 4 },
          material: 9, // BRICK
        },
      },
    }));
    await sleep(100);
  }
  console.log('[agent] Tower built!');

  // 5. Place a glow block on top
  ws.send(JSON.stringify({
    type: 'action',
    action: {
      type: 'place_block',
      payload: {
        type: 'place_block',
        position: { x: 4, y: 22, z: 4 },
        material: 12, // GLOW
      },
    },
  }));
  console.log('[agent] Glow block placed on top!');

  // 6. Send a chat message
  await sleep(500);
  ws.send(JSON.stringify({
    type: 'chat',
    message: '🤖 ExampleBot finished building! Check out the platform at (2,16,2) and the tower at (4,17,4).',
  }));

  console.log('[agent] Build complete. Listening for events...');

  // Keep alive — listen for events
  ws.on('close', () => {
    console.log('[agent] Disconnected');
    process.exit(0);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('[agent] Shutting down...');
    ws.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[agent] Fatal error:', err);
  process.exit(1);
});
