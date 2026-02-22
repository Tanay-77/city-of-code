'use client';

import { Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
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

  if (!cityLayout) return null;

  return (
    <div className="city-canvas-container">
      <Canvas
        camera={{
          position: [40, 30, 40],
          fov: 45,
          near: 0.1,
          far: 500,
        }}
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1.1,
          preserveDrawingBuffer: true, // needed for screenshot
        }}
        onPointerMissed={() => setSelectedBuilding(null)}
      >
        <color attach="background" args={['#f0eeec']} />

        {/* Core scene — never blocked by Suspense */}
        <Lighting />
        <CameraController />

        <BuildingsInstanced
          buildings={cityLayout.buildings}
          mode={visualizationMode}
        />

        <GroundGrid size={cityLayout.gridSize} />

        {/* District labels can suspend (drei Text loads font) — isolated Suspense */}
        <Suspense fallback={null}>
          <DistrictLabels districts={cityLayout.districts} />
        </Suspense>

        <BuildingTooltip />
      </Canvas>
    </div>
  );
}
