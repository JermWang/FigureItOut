'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayerStore } from '@/store/player-store';
import { playFootstep, playJump, playLand } from '@/lib/sounds';

const WALK_SPEED   = 6;
const SPRINT_SPEED = 12;
const FLY_SPEED    = 18;
const FLY_FAST     = 36;
const JUMP_VEL     = 8;
const GRAVITY      = -20;
const GROUND_Y     = 2.0; // approx terrain surface + avatar height
const CAM_HEIGHT   = 1.6; // eye level above position

// Simple terrain height approximation matching SandboxTerrain noise
function approxGroundY(x: number, z: number): number {
  // Rough sine approximation — good enough for collision feel
  const h = Math.sin(x * 0.018) * 5 + Math.sin(z * 0.018) * 5
          + Math.sin(x * 0.055) * 2 + Math.sin(z * 0.055) * 2;
  return Math.max(0, Math.floor(h)) + GROUND_Y;
}

export default function PlayerController() {
  const { camera, gl } = useThree();
  const mode      = usePlayerStore(s => s.mode);
  const active    = usePlayerStore(s => s.active);
  const position  = usePlayerStore(s => s.position);
  const yaw       = usePlayerStore(s => s.yaw);
  const pitch     = usePlayerStore(s => s.pitch);
  const velocityY = usePlayerStore(s => s.velocityY);
  const isOnGround = usePlayerStore(s => s.isOnGround);

  const setPosition  = usePlayerStore(s => s.setPosition);
  const setYaw       = usePlayerStore(s => s.setYaw);
  const setPitch     = usePlayerStore(s => s.setPitch);
  const setVelocityY = usePlayerStore(s => s.setVelocityY);
  const setOnGround  = usePlayerStore(s => s.setOnGround);
  const setMoving    = usePlayerStore(s => s.setMoving);

  const keys   = useRef<Set<string>>(new Set());
  const posRef = useRef(new THREE.Vector3(position.x, position.y, position.z));
  const yawRef = useRef(yaw);
  const pitchRef = useRef(pitch);
  const velYRef  = useRef(velocityY);
  const movingRef = useRef(false);
  const lockedRef = useRef(false);
  const footstepTimerRef = useRef(0);
  const wasOnGroundRef = useRef(true);
  const wasAirborneRef = useRef(false);

  // Mobile touch refs
  const joystickRef = useRef<{ dx: number; dz: number }>({ dx: 0, dz: 0 });

  useEffect(() => {
    if (!active) return;

    const onKey = (e: KeyboardEvent, down: boolean) => {
      keys.current[down ? 'add' : 'delete'](e.code);
    };
    const onKeyDown = (e: KeyboardEvent) => onKey(e, true);
    const onKeyUp   = (e: KeyboardEvent) => onKey(e, false);

    const onMouseMove = (e: MouseEvent) => {
      if (!lockedRef.current) return;
      const sens = 0.002;
      yawRef.current   -= e.movementX * sens;
      pitchRef.current -= e.movementY * sens;
      pitchRef.current  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitchRef.current));
    };

    const onPointerLockChange = () => {
      lockedRef.current = document.pointerLockElement === gl.domElement;
    };

    const onClick = () => {
      if (active && !lockedRef.current) {
        gl.domElement.requestPointerLock();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    gl.domElement.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      gl.domElement.removeEventListener('click', onClick);
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
    };
  }, [active, gl.domElement]);

  // Expose joystick setter for MobileControls
  useEffect(() => {
    (window as any).__playerJoystick = joystickRef;
  }, []);

  useFrame((_, delta) => {
    if (!active) return;

    const k = keys.current;
    const sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    const speed  = mode === 'fly'
      ? (sprint ? FLY_FAST : FLY_SPEED)
      : (sprint ? SPRINT_SPEED : WALK_SPEED);

    // Build move direction from keys + joystick
    const fwd  = (k.has('KeyW') || k.has('ArrowUp')    ? 1 : 0) + joystickRef.current.dz;
    const back = (k.has('KeyS') || k.has('ArrowDown')  ? 1 : 0);
    const left = (k.has('KeyA') || k.has('ArrowLeft')  ? 1 : 0) + joystickRef.current.dx;
    const right= (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0);

    const moveZ = fwd - back;
    const moveX = right - left;
    const moving = moveZ !== 0 || moveX !== 0;
    if (moving !== movingRef.current) {
      movingRef.current = moving;
      setMoving(moving);
    }

    if (moving) {
      const angle = yawRef.current;
      const dx = (Math.sin(angle) * moveZ + Math.cos(angle) * moveX) * speed * delta;
      const dz = (Math.cos(angle) * moveZ - Math.sin(angle) * moveX) * speed * delta;
      posRef.current.x += dx;
      posRef.current.z -= dz;

      // Footstep sounds — only in walk mode on ground
      if (mode === 'walk') {
        footstepTimerRef.current -= delta;
        if (footstepTimerRef.current <= 0) {
          playFootstep();
          footstepTimerRef.current = sprint ? 0.28 : 0.42;
        }
      }
    } else {
      footstepTimerRef.current = 0;
    }

    if (mode === 'fly') {
      // Vertical fly controls
      if (k.has('Space'))                                posRef.current.y += speed * delta;
      if (k.has('ShiftLeft') || k.has('ShiftRight'))    posRef.current.y -= speed * delta * 0.5;
      // Pitch-based vertical when moving
      if (moving) posRef.current.y -= Math.sin(pitchRef.current) * speed * delta;
      posRef.current.y = Math.max(2, posRef.current.y);
    } else {
      // Walk — gravity + jump
      const groundY = approxGroundY(posRef.current.x, posRef.current.z);
      velYRef.current += GRAVITY * delta;
      posRef.current.y += velYRef.current * delta;

      if (posRef.current.y <= groundY) {
        posRef.current.y = groundY;
        // Land sound when hitting ground after being airborne
        if (wasAirborneRef.current) {
          playLand();
          wasAirborneRef.current = false;
        }
        velYRef.current  = 0;
        setOnGround(true);
        if (k.has('Space')) {
          velYRef.current = JUMP_VEL;
          playJump();
          setOnGround(false);
          wasAirborneRef.current = true;
        }
      } else {
        wasAirborneRef.current = true;
        setOnGround(false);
      }
    }

    // Update camera
    const eyePos = posRef.current.clone().add(new THREE.Vector3(0, CAM_HEIGHT, 0));
    camera.position.copy(eyePos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;

    // Sync store (throttled to avoid excessive re-renders)
    setPosition({ x: posRef.current.x, y: posRef.current.y, z: posRef.current.z });
    setYaw(yawRef.current);
    setPitch(pitchRef.current);
    setVelocityY(velYRef.current);
  });

  return null;
}
