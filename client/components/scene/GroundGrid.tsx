'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GroundGridProps {
  size: number;
}

export default function GroundGrid({ size }: GroundGridProps) {
  const gridRef = useRef<THREE.Group>(null);
  const gridSize = Math.max(size * 2, 60);

  useFrame(({ clock }) => {
    if (gridRef.current) {
      // Subtle floating animation
      gridRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.02;
    }
  });

  return (
    <group ref={gridRef}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial
          color="#e8e8e8"
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Grid lines */}
      <gridHelper
        args={[gridSize, Math.floor(gridSize / 2), '#d0d0d0', '#e0e0e0']}
        position={[0, -0.04, 0]}
      />

      {/* Subtle glow plane beneath */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize * 1.5, gridSize * 1.5]} />
        <meshBasicMaterial color="#f5f5f5" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
