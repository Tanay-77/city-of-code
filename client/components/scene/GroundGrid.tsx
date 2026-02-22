'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface GroundGridProps {
  size: number;
}

/**
 * City ground — simple concrete that sits below roads and buildings.
 */
function createGroundTexture(): THREE.CanvasTexture {
  const res = 512;
  const canvas = document.createElement('canvas');
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext('2d')!;

  // Light warm concrete
  ctx.fillStyle = '#9e9890';
  ctx.fillRect(0, 0, res, res);

  // Fine grain noise
  const imageData = ctx.getImageData(0, 0, res, res);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + n));
    imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + n));
    imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + n));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.needsUpdate = true;
  return texture;
}

export default function GroundGrid({ size }: GroundGridProps) {
  const gridSize = Math.max(size * 2, 60);
  const groundTex = useMemo(() => createGroundTexture(), []);

  return (
    <group>
      {/* Main ground — sits below road boxes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial
          map={groundTex}
          roughness={0.9}
          metalness={0}
          color="#bab4aa"
        />
      </mesh>

      {/* Outer terrain — green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[gridSize * 3, gridSize * 3]} />
        <meshStandardMaterial
          color="#8ca880"
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
