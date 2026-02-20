'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SKIN  = new THREE.MeshStandardMaterial({ color: '#F5CBA7' });
const SHIRT = new THREE.MeshStandardMaterial({ color: '#4A90D9' });
const PANTS = new THREE.MeshStandardMaterial({ color: '#2C3E6B' });
const SHOE  = new THREE.MeshStandardMaterial({ color: '#1A1A1A' });
const HAIR  = new THREE.MeshStandardMaterial({ color: '#3B2314' });

interface HumanAvatarProps {
  position: [number, number, number];
  yaw: number;
  moving?: boolean;
}

export default function HumanAvatar({ position, yaw, moving = false }: HumanAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef  = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(position[0], position[1], position[2]);
    groupRef.current.rotation.y = yaw;

    if (moving) {
      t.current += delta * 6;
      const swing = Math.sin(t.current) * 0.5;
      if (leftArmRef.current)  leftArmRef.current.rotation.x  =  swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = -swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x =  swing;
    } else {
      t.current = 0;
      [leftArmRef, rightArmRef, leftLegRef, rightLegRef].forEach(r => {
        if (r.current) r.current.rotation.x = 0;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.5, 0]} material={SKIN}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
      </mesh>
      {/* Hair */}
      <mesh position={[0, 1.78, 0]} material={HAIR}>
        <boxGeometry args={[0.52, 0.12, 0.52]} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} material={SHIRT}>
        <boxGeometry args={[0.5, 0.6, 0.28]} />
      </mesh>
      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.35, 0.9, 0]} material={SHIRT}>
        <boxGeometry args={[0.2, 0.55, 0.22]} />
      </mesh>
      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.35, 0.9, 0]} material={SHIRT}>
        <boxGeometry args={[0.2, 0.55, 0.22]} />
      </mesh>
      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.13, 0.35, 0]} material={PANTS}>
        <boxGeometry args={[0.22, 0.6, 0.24]} />
      </mesh>
      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.13, 0.35, 0]} material={PANTS}>
        <boxGeometry args={[0.22, 0.6, 0.24]} />
      </mesh>
      {/* Left shoe */}
      <mesh position={[-0.13, 0.06, 0.03]} material={SHOE}>
        <boxGeometry args={[0.23, 0.12, 0.3]} />
      </mesh>
      {/* Right shoe */}
      <mesh position={[0.13, 0.06, 0.03]} material={SHOE}>
        <boxGeometry args={[0.23, 0.12, 0.3]} />
      </mesh>
    </group>
  );
}
