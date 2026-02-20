'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Animated Sun ---
// Slowly orbits to create a gentle day cycle
function AnimatedSun() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const timeRef = useRef(Math.PI * 0.3); // Start at pleasant morning angle

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    // Very slow cycle — full day in ~5 minutes
    timeRef.current += delta * 0.02;

    const angle = timeRef.current;
    const sunX = Math.cos(angle) * 100;
    const sunY = Math.abs(Math.sin(angle)) * 80 + 20; // Never goes below horizon
    const sunZ = Math.sin(angle) * 60;

    lightRef.current.position.set(sunX, sunY, sunZ);

    // Warm at low angles, neutral at high
    const warmth = 1 - (sunY - 20) / 80;
    const r = 1;
    const g = 0.95 - warmth * 0.1;
    const b = 0.85 - warmth * 0.2;
    lightRef.current.color.setRGB(r, g, b);
    lightRef.current.intensity = 0.8 + (sunY - 20) / 80 * 0.6;
  });

  return (
    <directionalLight
      ref={lightRef}
      position={[50, 80, 50]}
      intensity={1.2}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-far={200}
      shadow-camera-left={-60}
      shadow-camera-right={60}
      shadow-camera-top={60}
      shadow-camera-bottom={-60}
    />
  );
}

// --- Blocky Clouds ---
// Minecraft-style flat puffy clouds drifting across the sky
function BlockyClouds() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 180;

  // Generate cloud block positions
  const { offsets, speeds } = useMemo(() => {
    const offsets: THREE.Matrix4[] = [];
    const speeds: number[] = [];
    const dummy = new THREE.Matrix4();

    // Generate ~12 cloud clusters
    for (let c = 0; c < 14; c++) {
      const cx = (Math.random() - 0.5) * 200;
      const cy = 35 + Math.random() * 15;
      const cz = (Math.random() - 0.5) * 200;
      const speed = 0.8 + Math.random() * 1.2;

      // Each cluster is a flat blob of cubes
      const width = 3 + Math.floor(Math.random() * 6);
      const depth = 2 + Math.floor(Math.random() * 4);
      for (let dx = 0; dx < width; dx++) {
        for (let dz = 0; dz < depth; dz++) {
          // Skip corners randomly for organic shape
          if ((dx === 0 || dx === width - 1) && (dz === 0 || dz === depth - 1) && Math.random() > 0.4) continue;
          if (offsets.length >= COUNT) break;

          const scale = 2 + Math.random() * 1;
          dummy.makeScale(scale, 1 + Math.random() * 0.5, scale);
          dummy.setPosition(cx + dx * 2.5, cy, cz + dz * 2.5);
          offsets.push(dummy.clone());
          speeds.push(speed);
        }
      }
    }

    return { offsets, speeds };
  }, []);

  const initialized = useRef(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Init on first frame when ref is available
    if (!initialized.current) {
      for (let i = 0; i < offsets.length; i++) {
        meshRef.current.setMatrixAt(i, offsets[i]);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      initialized.current = true;
      return;
    }

    const dummy = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quat = new THREE.Quaternion();

    for (let i = 0; i < offsets.length; i++) {
      meshRef.current.getMatrixAt(i, dummy);
      dummy.decompose(pos, quat, scale);

      // Drift
      pos.x += speeds[i] * delta;

      // Wrap around
      if (pos.x > 120) pos.x = -120;

      dummy.compose(pos, quat, scale);
      meshRef.current.setMatrixAt(i, dummy);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        transparent
        opacity={0.7}
        roughness={1}
        emissive="#ffffff"
        emissiveIntensity={0.15}
      />
    </instancedMesh>
  );
}

// --- Floating Particles ---
// Tiny specks floating in the air for atmosphere
function AmbientParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 300;

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 30 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      velocities[i * 3] = (Math.random() - 0.5) * 0.3;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return { positions, velocities };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < COUNT; i++) {
      let x = pos.getX(i) + velocities[i * 3] * delta;
      let y = pos.getY(i) + velocities[i * 3 + 1] * delta + Math.sin(state.clock.elapsedTime + i) * 0.003;
      let z = pos.getZ(i) + velocities[i * 3 + 2] * delta;

      // Wrap around
      if (x > 50) x = -50;
      if (x < -50) x = 50;
      if (z > 50) z = -50;
      if (z < -50) z = 50;
      if (y > 32) y = 2;
      if (y < 2) y = 32;

      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#e8dfc8"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// --- Main Weather System ---
export default function WeatherSystem() {
  return (
    <group>
      <AnimatedSun />
      <BlockyClouds />
      <AmbientParticles />
    </group>
  );
}
