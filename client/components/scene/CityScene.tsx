'use client';

import { Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import BuildingsInstanced from './BuildingsInstanced';
import GroundGrid from './GroundGrid';
import DistrictLabels from './DistrictLabels';
import CameraController from './CameraController';
import BuildingTooltip from './BuildingTooltip';
import Lighting from './Lighting';
import { useCityStore } from '../../hooks/useCityStore';

export default function CityScene() {
  const cityLayout = useCityStore((s) => s.cityLayout);
  const visualizationMode = useCityStore((s) => s.visualizationMode);
  const setSelectedBuilding = useCityStore((s) => s.setSelectedBuilding);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // If clicking on canvas background (not a building), deselect
      if ((e.target as HTMLElement).tagName === 'CANVAS') {
        // The building click handler will stopPropagation,
        // so this only fires for background clicks
      }
    },
    [],
  );

  if (!cityLayout) return null;

  return (
    <div className="city-canvas-container" onClick={handleCanvasClick}>
      <Canvas
        camera={{
          position: [40, 30, 40],
          fov: 45,
          near: 0.1,
          far: 500,
        }}
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1.1,
        }}
        onPointerMissed={() => setSelectedBuilding(null)}
      >
        <color attach="background" args={['#f0eeec']} />

        <Suspense fallback={null}>
          <Lighting />
          <CameraController />

          <BuildingsInstanced
            buildings={cityLayout.buildings}
            mode={visualizationMode}
          />

          <GroundGrid size={cityLayout.gridSize} />
          <DistrictLabels districts={cityLayout.districts} />
          <BuildingTooltip />

          {/* Post-processing */}
          <EffectComposer multisampling={4}>
            <Bloom
              luminanceThreshold={0.9}
              luminanceSmoothing={0.5}
              intensity={0.15}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.1} darkness={0.3} />
          </EffectComposer>

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
