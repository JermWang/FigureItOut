import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { nanoid } from 'nanoid';

// POST /api/agent/world/patch — Apply a world diff/patch
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
    }

    // Rate limit
    const { success } = rateLimit(`agent:${apiKey}`, 120);
    if (!success) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    // Validate key
    const agentKey = await prisma.agentKey.findUnique({ where: { key: apiKey } });
    if (!agentKey || !agentKey.active) {
      return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 });
    }

    const permissions = agentKey.permissions as string[];
    if (!permissions.includes('write')) {
      return NextResponse.json({ error: 'No write permission' }, { status: 403 });
    }

    // Update last used
    await prisma.agentKey.update({
      where: { id: agentKey.id },
      data: { lastUsedAt: new Date() },
    });

    const body = await req.json();
    const { actions, description } = body;

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json({ error: 'actions array is required and must be non-empty' }, { status: 400 });
    }

    // Check world settings for proposal mode
    const world = await prisma.world.findUnique({ where: { id: agentKey.worldId } });
    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 });
    }

    const settings = world.settings as Record<string, unknown>;
    const proposalMode = settings?.proposalMode === true;

    if (proposalMode) {
      // Create proposal instead of applying directly
      const proposal = await prisma.proposal.create({
        data: {
          id: nanoid(),
          worldId: agentKey.worldId,
          agentKeyId: agentKey.id,
          actions: JSON.parse(JSON.stringify(actions)),
          description: description || `Patch from agent ${agentKey.name}`,
          status: 'pending',
        },
      });

      return NextResponse.json({
        applied: 0,
        rejected: 0,
        proposalId: proposal.id,
        status: 'pending_approval',
        results: actions.map((_: unknown, i: number) => ({
          actionId: `pending-${i}`,
          status: 'pending',
          reason: 'Proposal mode: awaiting human approval',
        })),
      });
    }

    // Apply actions directly
    const results: Array<{ actionId: string; status: string; reason?: string }> = [];
    let applied = 0;
    let rejected = 0;

    for (const action of actions) {
      const actionId = nanoid();

      try {
        // Log to audit
        await prisma.auditLog.create({
          data: {
            id: actionId,
            worldId: agentKey.worldId,
            actorId: agentKey.id,
            actorType: 'agent',
            action: action.type,
            payload: JSON.parse(JSON.stringify(action.payload || action)),
            previousState: null, // STUB: capture previous state for rollback
          },
        });

        // STUB: In production, apply changes to chunk/entity data in DB
        // and broadcast via WS server. For now, just log + audit.
        results.push({ actionId, status: 'applied' });
        applied++;
      } catch (err) {
        results.push({ actionId, status: 'rejected', reason: String(err) });
        rejected++;
      }
    }

    return NextResponse.json({ applied, rejected, results });
  } catch (error) {
    console.error('[agent/world/patch] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
