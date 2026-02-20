'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { CHUNK_SIZE, BLOCK_MATERIALS, BLOCK_COLORS, type ChunkData } from '@fio/shared';

interface VoxelChunkProps {
  chunk: ChunkData;
  onClick?: (worldPos: { x: number; y: number; z: number }, face: { x: number; y: number; z: number }) => void;
}

const FACE_NORMALS = [
  { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },   // +x
  { dir: [-1, 0, 0], corners: [[0,1,0],[0,0,0],[0,0,1],[0,1,1]] },  // -x
  { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },   // +y
  { dir: [0, -1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },  // -y
  { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },   // +z
  { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },  // -z
];

function getBlockFromChunk(chunk: ChunkData, x: number, y: number, z: number): number {
  if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
    return BLOCK_MATERIALS.AIR;
  }
  const idx = x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
  const paletteIdx = Array.isArray(chunk.data) ? chunk.data[idx] : chunk.data[idx];
  return chunk.palette[paletteIdx] ?? BLOCK_MATERIALS.AIR;
}

export default function VoxelChunk({ chunk, onClick }: VoxelChunkProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    let vertexCount = 0;

    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const block = getBlockFromChunk(chunk, x, y, z);
          if (block === BLOCK_MATERIALS.AIR) continue;

          const colorHex = BLOCK_COLORS[block] || '#ff00ff';
          const color = new THREE.Color(colorHex);

          for (const face of FACE_NORMALS) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];
            const neighbor = getBlockFromChunk(chunk, nx, ny, nz);

            if (neighbor !== BLOCK_MATERIALS.AIR) continue;

            for (const corner of face.corners) {
              positions.push(x + corner[0], y + corner[1], z + corner[2]);
              normals.push(face.dir[0], face.dir[1], face.dir[2]);
              colors.push(color.r, color.g, color.b);
            }

            indices.push(
              vertexCount, vertexCount + 1, vertexCount + 2,
              vertexCount, vertexCount + 2, vertexCount + 3
            );
            vertexCount += 4;
          }
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeBoundingSphere();
    return geo;
  }, [chunk, chunk.version]);

  const worldX = chunk.coord.cx * CHUNK_SIZE;
  const worldY = chunk.coord.cy * CHUNK_SIZE;
  const worldZ = chunk.coord.cz * CHUNK_SIZE;

  return (
    <mesh
      ref={meshRef}
      position={[worldX, worldY, worldZ]}
      geometry={geometry}
      onClick={(e) => {
        e.stopPropagation();
        if (!onClick || !e.face) return;
        const point = e.point;
        const normal = e.face.normal;
        const blockX = Math.floor(point.x - worldX - normal.x * 0.01);
        const blockY = Math.floor(point.y - worldY - normal.y * 0.01);
        const blockZ = Math.floor(point.z - worldZ - normal.z * 0.01);
        onClick(
          { x: blockX + worldX, y: blockY + worldY, z: blockZ + worldZ },
          { x: normal.x, y: normal.y, z: normal.z }
        );
      }}
    >
      <meshStandardMaterial vertexColors side={THREE.FrontSide} />
    </mesh>
  );
}
