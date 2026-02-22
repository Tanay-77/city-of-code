'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useCityStore } from '../../hooks/useCityStore';

export default function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraTarget = useCityStore((s) => s.cameraTarget);
  const currentTarget = useRef(new THREE.Vector3(0, 2, 0));
  const targetPosition = useRef(new THREE.Vector3(0, 2, 0));
  const isAnimating = useRef(false);

  // Smooth camera transition when target changes
  useEffect(() => {
    if (cameraTarget) {
      targetPosition.current.set(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
      isAnimating.current = true;
    } else {
      targetPosition.current.set(0, 2, 0);
      isAnimating.current = true;
    }
  }, [cameraTarget]);

  useFrame(({ camera }) => {
    if (!controlsRef.current || !isAnimating.current) return;

    // Smooth lerp to target
    currentTarget.current.lerp(targetPosition.current, 0.05);
    controlsRef.current.target.copy(currentTarget.current);

    // If focusing on a building, also move camera closer
    if (cameraTarget) {
      const desiredCamPos = new THREE.Vector3(
        cameraTarget[0] + 8,
        cameraTarget[1] + 6,
        cameraTarget[2] + 8,
      );
      camera.position.lerp(desiredCamPos, 0.03);
    }

    controlsRef.current.update();

    // Stop animating when close enough
    if (currentTarget.current.distanceTo(targetPosition.current) < 0.01) {
      isAnimating.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={200}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={0.2}
    />
  );
}
