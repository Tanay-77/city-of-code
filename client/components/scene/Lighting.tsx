'use client';

import { ContactShadows } from '@react-three/drei';

export default function Lighting() {
  return (
    <>
      {/* Soft ambient base */}
      <ambientLight intensity={0.9} color="#ffffff" />

      {/* Key light — bright daylight sun */}
      <directionalLight
        position={[40, 60, 30]}
        intensity={1.4}
        color="#ffffff"
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

      {/* Cool fill light from opposite side */}
      <directionalLight
        position={[-30, 25, -25]}
        intensity={0.4}
        color="#e8ecf4"
      />

      {/* Rim light for depth */}
      <directionalLight
        position={[0, 30, -50]}
        intensity={0.3}
        color="#e0e4f0"
      />

      {/* Hemisphere: sky / ground bounce */}
      <hemisphereLight args={['#f0f4ff', '#e0dcd5', 0.4]} />

      {/* Contact shadows beneath buildings */}
      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.3}
        scale={140}
        blur={2.5}
        far={60}
        color="#b0b0b0"
      />

      {/* Subtle white fog for depth */}
      <fog attach="fog" args={['#f5f3f0', 80, 250]} />
    </>
  );
}
