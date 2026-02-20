'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BODY_MAT    = new THREE.MeshStandardMaterial({ color: '#E8E8F0' });
const WING_MAT    = new THREE.MeshStandardMaterial({ color: '#C8C8DC' });
const COCKPIT_MAT = new THREE.MeshStandardMaterial({ color: '#00FFCC', emissive: '#00FFCC', emissiveIntensity: 0.3 });
const ENGINE_MAT  = new THREE.MeshStandardMaterial({ color: '#888899' });
const STRIPE_MAT  = new THREE.MeshStandardMaterial({ color: '#A78BFA' });
const TAIL_MAT    = new THREE.MeshStandardMaterial({ color: '#C8C8DC' });

interface PlaneAvatarProps {
  position: [number, number, number];
  yaw: number;
  pitch: number;
  speed?: number;
}

export default function PlaneAvatar({ position, yaw, pitch, speed = 0 }: PlaneAvatarProps) {
  const groupRef  = useRef<THREE.Group>(null);
  const propRef   = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(position[0], position[1], position[2]);
    groupRef.current.rotation.y = yaw;
    groupRef.current.rotation.x = pitch * 0.5;

    t.current += delta;

    // Propeller spin — faster when moving
    if (propRef.current) {
      propRef.current.rotation.z += delta * (8 + speed * 12);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Fuselage — main body */}
      <mesh position={[0, 0, 0]} material={BODY_MAT}>
        <boxGeometry args={[0.6, 0.5, 2.4]} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0, 1.3]} material={ENGINE_MAT}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
      </mesh>
      {/* Cockpit glass */}
      <mesh position={[0, 0.28, 0.3]} material={COCKPIT_MAT}>
        <boxGeometry args={[0.44, 0.22, 0.6]} />
      </mesh>
      {/* Fuselage stripe */}
      <mesh position={[0, 0, 0]} material={STRIPE_MAT}>
        <boxGeometry args={[0.62, 0.1, 2.42]} />
      </mesh>

      {/* Left wing */}
      <mesh position={[-1.2, -0.05, 0.1]} material={WING_MAT}>
        <boxGeometry args={[1.8, 0.12, 0.9]} />
      </mesh>
      {/* Right wing */}
      <mesh position={[1.2, -0.05, 0.1]} material={WING_MAT}>
        <boxGeometry args={[1.8, 0.12, 0.9]} />
      </mesh>
      {/* Wing tips accent */}
      <mesh position={[-2.1, -0.05, 0.1]} material={STRIPE_MAT}>
        <boxGeometry args={[0.12, 0.14, 0.9]} />
      </mesh>
      <mesh position={[2.1, -0.05, 0.1]} material={STRIPE_MAT}>
        <boxGeometry args={[0.12, 0.14, 0.9]} />
      </mesh>

      {/* Tail fin (vertical) */}
      <mesh position={[0, 0.4, -1.0]} material={TAIL_MAT}>
        <boxGeometry args={[0.12, 0.7, 0.6]} />
      </mesh>
      {/* Horizontal stabilizers */}
      <mesh position={[-0.55, 0, -1.0]} material={TAIL_MAT}>
        <boxGeometry args={[0.8, 0.1, 0.45]} />
      </mesh>
      <mesh position={[0.55, 0, -1.0]} material={TAIL_MAT}>
        <boxGeometry args={[0.8, 0.1, 0.45]} />
      </mesh>

      {/* Propeller */}
      <mesh ref={propRef} position={[0, 0, 1.52]} material={ENGINE_MAT}>
        <boxGeometry args={[1.2, 0.1, 0.08]} />
      </mesh>

      {/* Engine nacelles under wings */}
      <mesh position={[-0.9, -0.2, 0.2]} material={ENGINE_MAT}>
        <boxGeometry args={[0.22, 0.18, 0.7]} />
      </mesh>
      <mesh position={[0.9, -0.2, 0.2]} material={ENGINE_MAT}>
        <boxGeometry args={[0.22, 0.18, 0.7]} />
      </mesh>
    </group>
  );
}
