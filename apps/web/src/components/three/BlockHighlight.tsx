'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '@/store/world-store';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

export default function BlockHighlight() {
  const boxRef = useRef<THREE.Mesh>(null);
  const setHoveredBlock = useWorldStore((s) => s.setHoveredBlock);

  useFrame(({ camera, scene, mouse }) => {
    if (!boxRef.current) return;

    pointer.copy(mouse);
    raycaster.setFromCamera(pointer, camera);

    const meshes = scene.children.filter(
      (c): c is THREE.Mesh => c instanceof THREE.Mesh && c !== boxRef.current
    );
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.face) {
        const normal = hit.face.normal.clone();
        const point = hit.point.clone();

        // Block position (the block we clicked on)
        const blockPos = new THREE.Vector3(
          Math.floor(point.x - normal.x * 0.01),
          Math.floor(point.y - normal.y * 0.01),
          Math.floor(point.z - normal.z * 0.01)
        );

        // Always show highlight on the block itself (observer mode)
        boxRef.current.position.set(
          blockPos.x + 0.5,
          blockPos.y + 0.5,
          blockPos.z + 0.5
        );

        boxRef.current.visible = true;
        setHoveredBlock(
          { x: blockPos.x, y: blockPos.y, z: blockPos.z },
          { x: normal.x, y: normal.y, z: normal.z }
        );
      }
    } else {
      boxRef.current.visible = false;
      setHoveredBlock(null, null);
    }
  });

  const color = '#ffffff';

  return (
    <mesh ref={boxRef} visible={false}>
      <boxGeometry args={[1.02, 1.02, 1.02]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} wireframe={false} />
    </mesh>
  );
}
