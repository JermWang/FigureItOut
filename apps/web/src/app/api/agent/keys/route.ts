import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

// POST /api/agent/keys — Create a new agent API key
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const { success } = rateLimit(`ip:${ip}`, 10);
    if (!success) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await req.json();
    const { name, worldId, ownerId, role = 'agent', permissions = ['read', 'write'], quotas = {} } = body;

    if (!name || !worldId || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, worldId, ownerId' },
        { status: 400 }
      );
    }

    // Generate a secure API key
    const rawKey = `fio_${crypto.randomBytes(32).toString('hex')}`;

    const agentKey = await prisma.agentKey.create({
      data: {
        id: nanoid(),
        key: rawKey,
        name,
        worldId,
        ownerId,
        role,
        permissions: JSON.parse(JSON.stringify(permissions)),
        quotas: JSON.parse(JSON.stringify({
          maxBlocksPerMinute: quotas.maxBlocksPerMinute || 60,
          maxEntitiesPerMinute: quotas.maxEntitiesPerMinute || 10,
          maxRegionSize: quotas.maxRegionSize || { x: 16, y: 16, z: 16 },
        })),
        active: true,
      },
    });

    return NextResponse.json({
      id: agentKey.id,
      key: rawKey,
      name: agentKey.name,
      worldId: agentKey.worldId,
      role: agentKey.role,
      permissions: agentKey.permissions,
      quotas: agentKey.quotas,
      createdAt: agentKey.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('[agent/keys] Error creating key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/agent/keys — List agent keys for a world (requires auth)
export async function GET(req: NextRequest) {
  try {
    const worldId = req.nextUrl.searchParams.get('worldId');
    const ownerId = req.nextUrl.searchParams.get('ownerId');

    if (!worldId || !ownerId) {
      return NextResponse.json(
        { error: 'Missing worldId or ownerId query params' },
        { status: 400 }
      );
    }

    const keys = await prisma.agentKey.findMany({
      where: { worldId, ownerId },
      select: {
        id: true,
        name: true,
        role: true,
        permissions: true,
        quotas: true,
        active: true,
        createdAt: true,
        lastUsedAt: true,
        // Intentionally NOT returning the key itself
      },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('[agent/keys] Error listing keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
