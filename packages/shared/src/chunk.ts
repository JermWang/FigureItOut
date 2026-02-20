import { CHUNK_SIZE, CHUNK_VOLUME, BLOCK_MATERIALS } from './constants';
import type { ChunkCoord, ChunkData, Vec3 } from './types';

/** Convert world position to chunk coordinate */
export function worldToChunk(pos: Vec3): ChunkCoord {
  return {
    cx: Math.floor(pos.x / CHUNK_SIZE),
    cy: Math.floor(pos.y / CHUNK_SIZE),
    cz: Math.floor(pos.z / CHUNK_SIZE),
  };
}

/** Convert world position to local block index within a chunk */
export function worldToLocal(pos: Vec3): Vec3 {
  return {
    x: ((pos.x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
    y: ((pos.y % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
    z: ((pos.z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
  };
}

/** Flatten 3D local coord to 1D index */
export function localToIndex(x: number, y: number, z: number): number {
  return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
}

/** 1D index back to 3D local coord */
export function indexToLocal(index: number): Vec3 {
  const x = index % CHUNK_SIZE;
  const y = Math.floor(index / CHUNK_SIZE) % CHUNK_SIZE;
  const z = Math.floor(index / (CHUNK_SIZE * CHUNK_SIZE));
  return { x, y, z };
}

/** Create an empty chunk filled with AIR */
export function createEmptyChunk(coord: ChunkCoord): ChunkData {
  return {
    coord,
    palette: [BLOCK_MATERIALS.AIR],
    data: new Array(CHUNK_VOLUME).fill(0),
    version: 0,
    dirty: false,
  };
}

/** Create a flat ground chunk (grass on top, dirt below, stone at bottom) */
export function createGroundChunk(coord: ChunkCoord): ChunkData {
  const palette = [
    BLOCK_MATERIALS.AIR,
    BLOCK_MATERIALS.STONE,
    BLOCK_MATERIALS.DIRT,
    BLOCK_MATERIALS.GRASS,
  ];
  const data = new Array(CHUNK_VOLUME).fill(0);

  // Only generate terrain for y=0 chunk (ground level)
  if (coord.cy === 0) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const idx = localToIndex(x, y, z);
          if (y === CHUNK_SIZE - 1) {
            data[idx] = 3; // grass (palette index)
          } else if (y >= CHUNK_SIZE - 4) {
            data[idx] = 2; // dirt
          } else {
            data[idx] = 1; // stone
          }
        }
      }
    }
  } else if (coord.cy < 0) {
    // Below ground: all stone
    for (let i = 0; i < CHUNK_VOLUME; i++) {
      data[i] = 1;
    }
  }
  // cy > 0 => all air (default)

  return { coord, palette, data, version: 0, dirty: false };
}

/** Get block material at local position in chunk */
export function getBlock(chunk: ChunkData, x: number, y: number, z: number): number {
  const idx = localToIndex(x, y, z);
  const paletteIdx = Array.isArray(chunk.data) ? chunk.data[idx] : chunk.data[idx];
  return chunk.palette[paletteIdx] ?? BLOCK_MATERIALS.AIR;
}

/** Set block material at local position in chunk */
export function setBlock(chunk: ChunkData, x: number, y: number, z: number, material: number): void {
  let paletteIdx = chunk.palette.indexOf(material);
  if (paletteIdx === -1) {
    paletteIdx = chunk.palette.length;
    chunk.palette.push(material);
  }
  const idx = localToIndex(x, y, z);
  if (Array.isArray(chunk.data)) {
    chunk.data[idx] = paletteIdx;
  } else {
    chunk.data[idx] = paletteIdx;
  }
  chunk.version++;
  chunk.dirty = true;
}

/** Serialize chunk to JSON-safe format */
export function serializeChunk(chunk: ChunkData): object {
  return {
    coord: chunk.coord,
    palette: chunk.palette,
    data: Array.from(chunk.data),
    version: chunk.version,
  };
}

/** Deserialize chunk from JSON */
export function deserializeChunk(obj: Record<string, unknown>): ChunkData {
  const raw = obj as { coord: ChunkCoord; palette: number[]; data: number[]; version: number };
  return {
    coord: raw.coord,
    palette: raw.palette,
    data: raw.data,
    version: raw.version,
    dirty: false,
  };
}

/** Chunk coord to string key */
export function chunkKey(coord: ChunkCoord): string {
  return `${coord.cx},${coord.cy},${coord.cz}`;
}

/** Parse chunk key string back to coord */
export function parseChunkKey(key: string): ChunkCoord {
  const [cx, cy, cz] = key.split(',').map(Number);
  return { cx, cy, cz };
}
