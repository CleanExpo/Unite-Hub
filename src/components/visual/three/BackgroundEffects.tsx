'use client';

/**
 * 3D Background Effects
 *
 * Ambient background effects for visual inspiration:
 * - Starfield
 * - Floating particles
 * - Gradient fog
 * - Flowing ribbons
 *
 * All effects are subtle and accessibility-safe.
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// STARFIELD BACKGROUND
// ============================================================================

interface StarfieldProps {
  count?: number;
  radius?: number;
  speed?: number;
  color?: string;
}

export function Starfield({
  count = 2000,
  radius = 50,
  speed = 0.1,
  color = '#ffffff',
}: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate random star positions
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * radius;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count, radius]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      // Very slow rotation for ambient effect
      pointsRef.current.rotation.y += delta * speed * 0.1;
      pointsRef.current.rotation.x += delta * speed * 0.05;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

// ============================================================================
// FLOATING PARTICLES
// ============================================================================

interface FloatingParticlesProps {
  count?: number;
  area?: number;
  colors?: string[];
}

export function FloatingParticles({
  count = 50,
  area = 10,
  colors = ['#6366f1', '#8b5cf6', '#ec4899'],
}: FloatingParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * area,
        (Math.random() - 0.5) * area,
        (Math.random() - 0.5) * area * 0.5,
      ] as [number, number, number],
      color: colors[i % colors.length],
      scale: 0.05 + Math.random() * 0.1,
      speed: 0.2 + Math.random() * 0.3,
    }));
  }, [count, area, colors]);

  return (
    <group>
      {particles.map((particle, index) => (
        <Float
          key={index}
          speed={particle.speed}
          rotationIntensity={0.2}
          floatIntensity={0.5}
        >
          <mesh position={particle.position}>
            <sphereGeometry args={[particle.scale, 8, 8]} />
            <meshBasicMaterial color={particle.color} transparent opacity={0.6} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// ============================================================================
// GRADIENT FOG PLANE
// ============================================================================

interface GradientFogProps {
  color1?: string;
  color2?: string;
  opacity?: number;
}

export function GradientFog({
  color1 = '#1e1b4b',
  color2 = '#312e81',
  opacity = 0.5,
}: GradientFogProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create gradient texture
  const gradientTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, [color1, color2]);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle breathing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
      meshRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial map={gradientTexture} transparent opacity={opacity} />
    </mesh>
  );
}

// ============================================================================
// FLOWING RIBBONS
// ============================================================================

interface FlowingRibbonsProps {
  count?: number;
  color?: string;
}

export function FlowingRibbons({
  count = 5,
  color = '#6366f1',
}: FlowingRibbonsProps) {
  const ribbonRefs = useRef<THREE.Mesh[]>([]);

  const ribbons = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        -2 - Math.random() * 3,
      ] as [number, number, number],
      rotation: Math.random() * Math.PI,
      speed: 0.1 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state) => {
    ribbonRefs.current.forEach((ribbon, i) => {
      if (ribbon) {
        const { speed, phase } = ribbons[i];
        ribbon.rotation.z = Math.sin(state.clock.elapsedTime * speed + phase) * 0.3;
        ribbon.position.y = ribbons[i].position[1] + Math.sin(state.clock.elapsedTime * speed * 0.5 + phase) * 0.5;
      }
    });
  });

  return (
    <group>
      {ribbons.map((ribbon, index) => (
        <mesh
          key={index}
          ref={(el) => {
 if (el) {
ribbonRefs.current[index] = el;
} 
}}
          position={ribbon.position}
          rotation={[0, 0, ribbon.rotation]}
        >
          <planeGeometry args={[4, 0.1, 20, 1]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// COMBINED AMBIENT BACKGROUND
// ============================================================================

interface AmbientBackgroundProps {
  preset?: 'starfield' | 'particles' | 'fog' | 'ribbons' | 'all';
}

export function AmbientBackground({ preset = 'all' }: AmbientBackgroundProps) {
  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      {(preset === 'starfield' || preset === 'all') && <Starfield />}
      {(preset === 'particles' || preset === 'all') && <FloatingParticles />}
      {(preset === 'fog' || preset === 'all') && <GradientFog />}
      {(preset === 'ribbons' || preset === 'all') && <FlowingRibbons />}
    </group>
  );
}

export default AmbientBackground;
