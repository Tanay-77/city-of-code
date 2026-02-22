'use client';

import { Environment, ContactShadows } from '@react-three/drei';

export default function Lighting() {
  return (
    <>
      {/* Soft ambient base */}
      <ambientLight intensity={0.6} color="#f5f0eb" />

      {/* Main directional light — soft shadow */}
      <directionalLight
        position={[30, 50, 30]}
        intensity={1.0}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={0.1}
        shadow-camera-far={200}
        shadow-bias={-0.0001}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-20, 30, -20]}
        intensity={0.3}
        color="#e8e4f0"
      />

      {/* Rim light for depth */}
      <directionalLight
        position={[0, 20, -40]}
        intensity={0.2}
        color="#d0d8e8"
      />

      {/* Contact shadows for grounding */}
      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.35}
        scale={120}
        blur={2}
        far={50}
        color="#b0b0b0"
      />

      {/* HDR environment for reflections */}
      <Environment preset="city" background={false} environmentIntensity={0.3} />

      {/* Subtle fog for depth */}
      <fog attach="fog" args={['#f0eeec', 60, 180]} />
    </>
  );
}
