'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

// Simple pseudo-noise for gentle rolling hills
function hash(x: number, z: number): number {
  let h = x * 374761393 + z * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff;
}

function smoothNoise(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);

  const n00 = hash(ix, iz);
  const n10 = hash(ix + 1, iz);
  const n01 = hash(ix, iz + 1);
  const n11 = hash(ix + 1, iz + 1);

  const nx0 = n00 + sx * (n10 - n00);
  const nx1 = n01 + sx * (n11 - n01);
  return nx0 + sz * (nx1 - nx0);
}

function terrainHeight(x: number, z: number): number {
  const large  = smoothNoise(x * 0.018, z * 0.018) * 12;
  const medium = smoothNoise(x * 0.055, z * 0.055) * 5;
  const fine   = smoothNoise(x * 0.14,  z * 0.14)  * 1.5;
  // Stronger ridge — peaks up to ~28 blocks
  const ridge  = Math.max(0, smoothNoise(x * 0.011 + 1.3, z * 0.011) - 0.38) * 32;

  // Flatness mask: values < 0.38 = wide open flat fields (~35% of map)
  const flatMask = smoothNoise(x * 0.019 + 5.7, z * 0.019 + 3.1);
  const isFlat   = flatMask < 0.38;
  const hillScale = isFlat ? flatMask / 0.38 * 0.12 : 1.0;

  const hills = (large + medium + fine) * hillScale;
  // Ridge only in hilly zones, not suppressed in mid-range
  const ridgeScaled = isFlat ? 0 : ridge;
  return Math.floor(hills + ridgeScaled);
}

function isRiver(x: number, z: number): boolean {
  const wx = x - 18;
  const wave = Math.sin(z * 0.07) * 8 + Math.sin(z * 0.03) * 5;
  return Math.abs(wx - wave) < 2.5;
}

function hash3(x: number, y: number, z: number): number {
  return hash(hash(x, y) * 1000, z);
}

const GRASS_COLORS = [new THREE.Color('#4E8B2E'), new THREE.Color('#5FA832'), new THREE.Color('#6BBF38')];
const LEAVES_COLORS = [new THREE.Color('#2A7A1A'), new THREE.Color('#338A22'), new THREE.Color('#1E6E14'), new THREE.Color('#3D9A2A')];
const PINE_COLORS   = [new THREE.Color('#1A5C14'), new THREE.Color('#226618'), new THREE.Color('#154E10')];
const MUSH_CAPS     = [new THREE.Color('#CC3322'), new THREE.Color('#DD4433'), new THREE.Color('#BB2211')];
const FLOWER_COLORS = [new THREE.Color('#E85D75'), new THREE.Color('#F5C542'), new THREE.Color('#A06BE8'), new THREE.Color('#4DBEEE'), new THREE.Color('#FF7A3D')];
const DIRT_A  = new THREE.Color('#7A5020');
const DIRT_B  = new THREE.Color('#8B6228');
const STONE_A = new THREE.Color('#7A7A7A');
const STONE_B = new THREE.Color('#6A6A72');
const GRAVEL  = new THREE.Color('#9A9090');
const SAND_A  = new THREE.Color('#D4BC6A');
const WATER_C = new THREE.Color('#2E6FCC');
const TRUNK_A = new THREE.Color('#5C3A1A');
const TRUNK_B = new THREE.Color('#6B4226');
const MUSH_STEM = new THREE.Color('#E8DCC8');
const SNOW_C  = new THREE.Color('#F0F4FF');
const GLOW_A  = new THREE.Color('#FFE066');
const GLOW_B  = new THREE.Color('#FF9A22');

const EXTENT = 140;
const WATER_LEVEL = -2;  // Lower so hills/fields are exposed, only deep valleys have water
const SNOW_LEVEL  = 17;  // Higher so only true mountain peaks get snow

interface BlockData { x: number; y: number; z: number; color: THREE.Color }

function generateTerrain(): { blocks: BlockData[]; waterBlocks: BlockData[] } {
  const blocks: BlockData[] = [];
  const waterBlocks: BlockData[] = [];
  const solidSet = new Set<string>();

  function addBlock(x: number, y: number, z: number, color: THREE.Color) {
    const key = `${x},${y},${z}`;
    if (solidSet.has(key)) return;
    solidSet.add(key);
    blocks.push({ x, y, z, color });
  }

  const treePositions: { x: number; z: number; h: number; pine: boolean }[] = [];

  for (let x = -EXTENT; x <= EXTENT; x++) {
    for (let z = -EXTENT; z <= EXTENT; z++) {
      let h = terrainHeight(x, z);
      const river = isRiver(x, z);
      // River only carves where terrain is low enough
      if (river && h <= WATER_LEVEL + 5) h = WATER_LEVEL - 3;

      const onGrass = h >= WATER_LEVEL && !river;
      const onSnow  = h >= SNOW_LEVEL;
      const onStone = h >= SNOW_LEVEL - 4; // wider stone band below snow

      for (let y = -6; y <= h; y++) {
        let color: THREE.Color;
        if (y === h) {
          if (river || h < WATER_LEVEL) {
            color = SAND_A.clone();
          } else if (onSnow) {
            color = SNOW_C.clone();
            color.offsetHSL(0, 0, (hash(x * 9, z * 17) - 0.5) * 0.04);
          } else if (onStone) {
            color = STONE_B.clone();
            color.offsetHSL(0, 0, (hash(x * 5, z * 11) - 0.5) * 0.06);
          } else {
            const gv = hash(x * 7, z * 13);
            color = GRASS_COLORS[gv < 0.33 ? 0 : gv < 0.66 ? 1 : 2].clone();
            color.offsetHSL(0, (hash(x * 3, z * 7) - 0.5) * 0.06, (hash(x * 11, z * 19) - 0.5) * 0.05);
          }
        } else if (y >= h - 2) {
          color = (h < WATER_LEVEL || river) ? SAND_A.clone() : DIRT_A.clone();
          color.offsetHSL(0, 0, (hash(x * 5, z * 9) - 0.5) * 0.04);
        } else if (y >= h - 4) {
          color = DIRT_B.clone();
        } else {
          color = hash(x * 13, z * 7 + y * 3) > 0.88 ? GRAVEL.clone() : STONE_A.clone();
          color.offsetHSL(0, 0, (hash(x * 3 + y, z * 5) - 0.5) * 0.06);
        }
        if (y <= h - 6 && hash3(x, y, z) > 0.965) {
          color = hash3(x + 1, y, z) > 0.5 ? GLOW_A.clone() : GLOW_B.clone();
        }
        addBlock(x, y, z, color);
      }

      if (h < WATER_LEVEL || river) {
        for (let y = h + 1; y <= WATER_LEVEL; y++) {
          const wc = WATER_C.clone();
          wc.offsetHSL(0, 0, (hash(x * 7, z * 11) - 0.5) * 0.04);
          waterBlocks.push({ x, y, z, color: wc });
        }
      }

      if (onGrass && !onStone && !river) {
        const isPine = h >= SNOW_LEVEL - 6;
        if (hash(x * 17, z * 31) > (isPine ? 0.91 : 0.925) && (Math.abs(x) > 8 || Math.abs(z) > 8)) {
          const minD = isPine ? 3 : 4;
          if (!treePositions.some((t) => Math.abs(t.x - x) < minD && Math.abs(t.z - z) < minD)) {
            treePositions.push({ x, z, h, pine: isPine });
          }
        }
      }

      if (onGrass && !onStone && !river && hash(x * 53, z * 97) > 0.955) {
        addBlock(x, h + 1, z, FLOWER_COLORS[Math.floor(hash(x * 41, z * 67) * FLOWER_COLORS.length)].clone());
      }

      if (onGrass && h <= WATER_LEVEL + 4 && !river && hash(x * 71, z * 113) > 0.975) {
        addBlock(x, h + 1, z, MUSH_STEM.clone());
        const capC = MUSH_CAPS[Math.floor(hash(x * 29, z * 43) * MUSH_CAPS.length)];
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
          const cc = capC.clone(); cc.offsetHSL(0, 0, (hash(x + dx * 7, z + dz * 11) - 0.5) * 0.06);
          addBlock(x + dx, h + 2, z + dz, cc);
        }
      }
    }
  }

  for (const tree of treePositions) {
    if (tree.pine) {
      const trunkH = 5 + Math.floor(hash(tree.x * 13, tree.z * 29) * 4);
      for (let y = tree.h + 1; y <= tree.h + trunkH; y++) addBlock(tree.x, y, tree.z, TRUNK_B.clone());
      const pc = PINE_COLORS[Math.floor(hash(tree.x * 5, tree.z * 17) * PINE_COLORS.length)];
      const layers = 4 + Math.floor(hash(tree.x * 7, tree.z * 11) * 3);
      for (let layer = 0; layer < layers; layer++) {
        const y = Math.floor(tree.h + trunkH - layer * 1.5);
        const radius = Math.min(layer + 1, 3);
        for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) + Math.abs(dz) > radius + 0.5) continue;
          const c = pc.clone(); c.offsetHSL(0, 0, (hash(tree.x + dx * 3, tree.z + dz * 7 + layer) - 0.5) * 0.08);
          addBlock(tree.x + dx, y, tree.z + dz, c);
        }
      }
      addBlock(tree.x, tree.h + trunkH + 1, tree.z, pc.clone());
    } else {
      const trunkH = 3 + Math.floor(hash(tree.x * 11, tree.z * 23) * 3);
      for (let y = tree.h + 1; y <= tree.h + trunkH; y++) addBlock(tree.x, y, tree.z, TRUNK_A.clone());
      const lc = LEAVES_COLORS[Math.floor(hash(tree.x * 7, tree.z * 19) * LEAVES_COLORS.length)];
      for (let y = tree.h + trunkH - 1; y <= tree.h + trunkH + 2; y++) {
        const radius = y < tree.h + trunkH + 2 ? 2 : 1;
        for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
          if (dx === 0 && dz === 0 && y < tree.h + trunkH + 2) continue;
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && hash(tree.x + dx * 3, tree.z + dz * 7) > 0.45) continue;
          const c = lc.clone(); c.offsetHSL(0, (hash(tree.x + dx, tree.z + dz) - 0.5) * 0.08, (hash(tree.x + dx * 5, tree.z + dz * 9) - 0.5) * 0.1);
          addBlock(tree.x + dx, y, tree.z + dz, c);
        }
      }
    }
  }

  return { blocks, waterBlocks };
}

export default function SandboxTerrain() {
  const { solidGeo, waterGeo } = useMemo(() => {
    const { blocks, waterBlocks } = generateTerrain();

    // Combined set for cross-mesh face culling (solid blocks cull water faces and vice versa)
    const solidSet = new Set<string>(blocks.map(b => `${b.x},${b.y},${b.z}`));
    const waterSet = new Set<string>(waterBlocks.map(b => `${b.x},${b.y},${b.z}`));
    const allSet  = new Set<string>([...solidSet, ...waterSet]);

    function buildGeometry(data: BlockData[], cullSet: Set<string>) {
      const positions: number[] = [];
      const normals: number[] = [];
      const colors: number[] = [];
      const indices: number[] = [];
      let vc = 0;

      const blockSet = new Set<string>();
      for (const b of data) {
        blockSet.add(`${b.x},${b.y},${b.z}`);
      }

      const FACES = [
        { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
        { dir: [-1, 0, 0], corners: [[0,1,0],[0,0,0],[0,0,1],[0,1,1]] },
        { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
        { dir: [0, -1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
        { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },
        { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },
      ];

      for (const block of data) {
        for (const face of FACES) {
          const nx = block.x + face.dir[0];
          const ny = block.y + face.dir[1];
          const nz = block.z + face.dir[2];
          if (cullSet.has(`${nx},${ny},${nz}`)) continue;

          for (const corner of face.corners) {
            positions.push(block.x + corner[0], block.y + corner[1], block.z + corner[2]);
            normals.push(face.dir[0], face.dir[1], face.dir[2]);
            colors.push(block.color.r, block.color.g, block.color.b);
          }

          indices.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
          vc += 4;
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(indices);
      geo.computeBoundingSphere();
      return geo;
    }

    return {
      solidGeo: buildGeometry(blocks, allSet),
      waterGeo: buildGeometry(waterBlocks, allSet),
    };
  }, []);

  return (
    <group>
      {/* Infinite ground plane — sunk below all terrain blocks to avoid z-fighting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.01, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#4E8B2E" />
      </mesh>
      <mesh geometry={solidGeo}>
        <meshStandardMaterial vertexColors side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={waterGeo}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.55}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}
