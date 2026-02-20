import type { ChunkCoord, ChunkData, Vec3 } from './types';
/** Convert world position to chunk coordinate */
export declare function worldToChunk(pos: Vec3): ChunkCoord;
/** Convert world position to local block index within a chunk */
export declare function worldToLocal(pos: Vec3): Vec3;
/** Flatten 3D local coord to 1D index */
export declare function localToIndex(x: number, y: number, z: number): number;
/** 1D index back to 3D local coord */
export declare function indexToLocal(index: number): Vec3;
/** Create an empty chunk filled with AIR */
export declare function createEmptyChunk(coord: ChunkCoord): ChunkData;
/** Create a flat ground chunk (grass on top, dirt below, stone at bottom) */
export declare function createGroundChunk(coord: ChunkCoord): ChunkData;
/** Get block material at local position in chunk */
export declare function getBlock(chunk: ChunkData, x: number, y: number, z: number): number;
/** Set block material at local position in chunk */
export declare function setBlock(chunk: ChunkData, x: number, y: number, z: number, material: number): void;
/** Serialize chunk to JSON-safe format */
export declare function serializeChunk(chunk: ChunkData): object;
/** Deserialize chunk from JSON */
export declare function deserializeChunk(obj: Record<string, unknown>): ChunkData;
/** Chunk coord to string key */
export declare function chunkKey(coord: ChunkCoord): string;
/** Parse chunk key string back to coord */
export declare function parseChunkKey(key: string): ChunkCoord;
//# sourceMappingURL=chunk.d.ts.map