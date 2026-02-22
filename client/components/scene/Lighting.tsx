'use client';

import { useMemo } from 'react';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/** Procedural gradient sky dome */
function SkyDome() {
  const skyTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // vertical gradient: warm horizon → soft blue zenith
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#6da4d4');    // zenith — soft blue
    grad.addColorStop(0.35, '#a8cce8'); // mid sky
    grad.addColorStop(0.65, '#d4e4f0'); // lower mid
    grad.addColorStop(0.85, '#f0e8d8'); // warm horizon glow
    grad.addColorStop(1.0, '#f8f0e0');  // horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const t = new THREE.CanvasTexture(canvas);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.needsUpdate = true;
    return t;
  }, []);

  return (
    <mesh scale={[200, 200, 200]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial map={skyTex} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  );
}

export default function Lighting() {
  return (
    <>
      <SkyDome />

      {/* Warm ambient fill */}
      <ambientLight intensity={0.55} color="#ffefd5" />

      {/* Key light — golden-hour sun */}
      <directionalLight
        position={[50, 55, 35]}
        intensity={1.8}
        color="#fff0d0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-camera-near={0.1}
        shadow-camera-far={250}
        shadow-bias={-0.0002}
      />

      {/* Cool blue fill light — opposite side */}
      <directionalLight
        position={[-35, 30, -30]}
        intensity={0.5}
        color="#a8c4e8"
      />

      {/* Warm rim / back light for silhouette glow */}
      <directionalLight
        position={[-10, 20, -50]}
        intensity={0.35}
        color="#ffe0b0"
      />

      {/* Hemisphere: sky blue / warm ground bounce */}
      <hemisphereLight args={['#b8d4f0', '#e8d8c0', 0.45]} />

      {/* Contact shadows for building grounding */}
      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.4}
        scale={160}
        blur={2}
        far={70}
        color="#505050"
      />

      {/* Atmospheric perspective fog */}
      <fog attach="fog" args={['#d8e4f0', 70, 220]} />
    </>
  );
}
