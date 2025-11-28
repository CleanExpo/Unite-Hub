'use client';

/**
 * 3D Rotating Card Component
 *
 * Interactive 3D card that rotates on hover/drag.
 * Safe, smooth animations without rapid movement.
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface RotatingCard3DProps {
  title?: string;
  subtitle?: string;
  color?: string;
  position?: [number, number, number];
  size?: [number, number, number];
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export function RotatingCard3D({
  title = 'Feature',
  subtitle = 'Description',
  color = '#6366f1',
  position = [0, 0, 0],
  size = [2, 2.8, 0.1],
  autoRotate = true,
  rotationSpeed = 0.3,
}: RotatingCard3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Gentle auto-rotation (safe, not disorienting)
    if (autoRotate && !hovered) {
      meshRef.current.rotation.y += delta * rotationSpeed;
    }

    // Subtle floating effect
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
  });

  return (
    <group position={position}>
      <RoundedBox
        ref={meshRef}
        args={size}
        radius={0.1}
        smoothness={4}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered ? '#8b5cf6' : color}
          metalness={0.3}
          roughness={0.4}
        />
      </RoundedBox>

      {/* Card content using Html for crisp text */}
      <Html
        position={[0, 0, size[2] / 2 + 0.01]}
        center
        distanceFactor={3}
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-center w-40">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-white/60">{subtitle}</p>
        </div>
      </Html>
    </group>
  );
}

// Multiple cards in a row
interface CardRow3DProps {
  cards: Array<{
    title: string;
    subtitle: string;
    color?: string;
  }>;
  spacing?: number;
}

export function CardRow3D({ cards, spacing = 2.5 }: CardRow3DProps) {
  const totalWidth = (cards.length - 1) * spacing;
  const startX = -totalWidth / 2;

  return (
    <group>
      {cards.map((card, index) => (
        <RotatingCard3D
          key={index}
          title={card.title}
          subtitle={card.subtitle}
          color={card.color}
          position={[startX + index * spacing, 0, 0]}
          autoRotate={true}
          rotationSpeed={0.2 + index * 0.1}
        />
      ))}
    </group>
  );
}

export default RotatingCard3D;
