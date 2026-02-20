'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BODY_MAT   = new THREE.MeshStandardMaterial({ color: '#2A2A3E' });
const VISOR_MAT  = new THREE.MeshStandardMaterial({ color: '#00FFCC', emissive: '#00FFCC', emissiveIntensity: 0.6 });
const ACCENT_MAT = new THREE.MeshStandardMaterial({ color: '#A78BFA' });
const JOINT_MAT  = new THREE.MeshStandardMaterial({ color: '#1A1A2E' });
const ANTENNA_MAT = new THREE.MeshStandardMaterial({ color: '#F472B6', emissive: '#F472B6', emissiveIntensity: 0.8 });

interface AgentAvatarProps {
  position: [number, number, number];
  yaw: number;
  moving?: boolean;
}

export default function AgentAvatar({ position, yaw, moving = false }: AgentAvatarProps) {
  const groupRef    = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef  = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const antennaRef  = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.set(position[0], position[1], position[2]);
    groupRef.current.rotation.y = yaw;

    t.current += delta;

    if (moving) {
      const swing = Math.sin(t.current * 6) * 0.5;
      if (leftArmRef.current)  leftArmRef.current.rotation.x  =  swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = -swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x =  swing;
    } else {
      [leftArmRef, rightArmRef, leftLegRef, rightLegRef].forEach(r => {
        if (r.current) r.current.rotation.x = 0;
      });
    }

    // Antenna bob
    if (antennaRef.current) {
      antennaRef.current.position.y = 1.92 + Math.sin(t.current * 3) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head — slightly bigger, boxy robot */}
      <mesh position={[0, 1.55, 0]} material={BODY_MAT}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 1.57, 0.28]} material={VISOR_MAT}>
        <boxGeometry args={[0.38, 0.18, 0.02]} />
      </mesh>
      {/* Antenna base */}
      <mesh position={[0, 1.84, 0]} material={JOINT_MAT}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
      </mesh>
      {/* Antenna tip */}
      <mesh ref={antennaRef} position={[0, 1.92, 0]} material={ANTENNA_MAT}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.9, 0]} material={BODY_MAT}>
        <boxGeometry args={[0.55, 0.65, 0.3]} />
      </mesh>
      {/* Chest accent stripe */}
      <mesh position={[0, 0.95, 0.16]} material={ACCENT_MAT}>
        <boxGeometry args={[0.3, 0.08, 0.02]} />
      </mesh>
      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.38, 0.9, 0]} material={BODY_MAT}>
        <boxGeometry args={[0.22, 0.58, 0.24]} />
      </mesh>
      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.38, 0.9, 0]} material={BODY_MAT}>
        <boxGeometry args={[0.22, 0.58, 0.24]} />
      </mesh>
      {/* Left leg */}
      <mesh ref={leftLegRef} position={[-0.14, 0.33, 0]} material={JOINT_MAT}>
        <boxGeometry args={[0.24, 0.62, 0.26]} />
      </mesh>
      {/* Right leg */}
      <mesh ref={rightLegRef} position={[0.14, 0.33, 0]} material={JOINT_MAT}>
        <boxGeometry args={[0.24, 0.62, 0.26]} />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.14, 0.04, 0.04]} material={ACCENT_MAT}>
        <boxGeometry args={[0.25, 0.1, 0.32]} />
      </mesh>
      <mesh position={[0.14, 0.04, 0.04]} material={ACCENT_MAT}>
        <boxGeometry args={[0.25, 0.1, 0.32]} />
      </mesh>
    </group>
  );
}
