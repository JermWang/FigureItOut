import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/agent/world/state — Get world state summary
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
    }

    // Rate limit by key
    const { success } = rateLimit(`agent:${apiKey}`, 120);
    if (!success) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    // Validate key
    const agentKey = await prisma.agentKey.findUnique({ where: { key: apiKey } });
    if (!agentKey || !agentKey.active) {
      return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 });
    }

    // Update last used
    await prisma.agentKey.update({
      where: { id: agentKey.id },
      data: { lastUsedAt: new Date() },
    });

    // Check read permission
    const permissions = agentKey.permissions as string[];
    if (!permissions.includes('read')) {
      return NextResponse.json({ error: 'No read permission' }, { status: 403 });
    }

    // Get world info
    const world = await prisma.world.findUnique({
      where: { id: agentKey.worldId },
      include: {
        _count: {
          select: { chunks: true, entities: true },
        },
      },
    });

    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 });
    }

    // Get loaded chunks coordinates
    const chunks = await prisma.chunk.findMany({
      where: { worldId: agentKey.worldId },
      select: { cx: true, cy: true, cz: true },
    });

    return NextResponse.json({
      worldId: world.id,
      name: world.name,
      chunkCount: world._count.chunks,
      entityCount: world._count.entities,
      onlineUsers: 0, // STUB: would query WS server
      onlineAgents: 0,
      loadedChunks: chunks.map((c: { cx: number; cy: number; cz: number }) => ({ cx: c.cx, cy: c.cy, cz: c.cz })),
    });
  } catch (error) {
    console.error('[agent/world/state] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
