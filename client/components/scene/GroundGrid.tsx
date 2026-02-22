'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

interface GroundGridProps {
  size: number;
}

/**
 * Creates a Canvas2D texture that looks like asphalt with road markings.
 */
function createGroundTexture(gridSize: number): THREE.CanvasTexture {
  const res = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext('2d')!;

  // Light concrete base
  ctx.fillStyle = '#e2e0dc';
  ctx.fillRect(0, 0, res, res);

  // Add grain noise for asphalt texture
  const imageData = ctx.getImageData(0, 0, res, res);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    imageData.data[i] += noise;
    imageData.data[i + 1] += noise;
    imageData.data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);

  // Sidewalk zone — lighter concrete border
  const margin = res * 0.02;
  ctx.strokeStyle = '#d0ccc4';
  ctx.lineWidth = margin;

  // Draw grid roads (every ~8 units mapped to canvas space)
  const roadSpacing = res / Math.max(Math.floor(gridSize / 8), 4);
  ctx.strokeStyle = '#ccc8c0';
  ctx.lineWidth = res * 0.015;

  for (let x = roadSpacing; x < res; x += roadSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, res);
    ctx.stroke();
  }
  for (let y = roadSpacing; y < res; y += roadSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(res, y);
    ctx.stroke();
  }

  // Dashed center lines on roads
  ctx.setLineDash([res * 0.01, res * 0.015]);
  ctx.strokeStyle = '#b0ac98';
  ctx.lineWidth = 2;
  for (let x = roadSpacing; x < res; x += roadSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, res);
    ctx.stroke();
  }
  for (let y = roadSpacing; y < res; y += roadSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(res, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

export default function GroundGrid({ size }: GroundGridProps) {
  const gridSize = Math.max(size * 2, 60);

  const groundTex = useMemo(() => createGroundTexture(gridSize), [gridSize]);

  return (
    <group>
      {/* Main ground plane — light concrete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial
          map={groundTex}
          roughness={0.9}
          metalness={0}
          color="#e8e6e2"
        />
      </mesh>

      {/* Sidewalk / curb ring around city */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <ringGeometry args={[gridSize * 0.48, gridSize * 0.52, 64]} />
        <meshStandardMaterial color="#d5d0c8" roughness={0.85} metalness={0} />
      </mesh>

      {/* Outer ground fade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[gridSize * 2, gridSize * 2]} />
        <meshBasicMaterial color="#f0eee8" />
      </mesh>
    </group>
  );
}
