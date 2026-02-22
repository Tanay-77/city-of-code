'use client';

import { useRef, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCityStore } from '../../hooks/useCityStore';
import { BuildingData, VisualizationMode } from '../../types';

interface BuildingsInstancedProps {
  buildings: BuildingData[];
  mode: VisualizationMode;
}

// Color constants
const HOVER_COLOR = new THREE.Color('#ffffff');
const SEARCH_HIGHLIGHT_COLOR = new THREE.Color('#00ffcc');
const DIM_COLOR = new THREE.Color('#2a2a2a');
const ACTIVITY_HIGH_COLOR = new THREE.Color('#ff4444');
const ACTIVITY_LOW_COLOR = new THREE.Color('#334455');

function getBuildingColor(
  building: BuildingData,
  mode: VisualizationMode,
  isHovered: boolean,
  isHighlighted: boolean,
  hasSearch: boolean,
): THREE.Color {
  if (isHovered) return HOVER_COLOR;
  if (isHighlighted) return SEARCH_HIGHLIGHT_COLOR;
  if (hasSearch) return DIM_COLOR;

  switch (mode) {
    case 'language':
      return new THREE.Color(building.color);
    case 'activity':
      return building.isFrequentlyUpdated
        ? ACTIVITY_HIGH_COLOR.clone().lerp(new THREE.Color('#ff8800'), building.emissiveIntensity)
        : ACTIVITY_LOW_COLOR;
    case 'structure':
    default:
      // White / off-white architectural model style
      const brightness = 0.85 + (building.height / 25) * 0.15;
      return new THREE.Color(brightness, brightness, brightness * 0.98);
  }
}

export default function BuildingsInstanced({ buildings, mode }: BuildingsInstancedProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoveredBuilding = useCityStore((s) => s.hoveredBuilding);
  const highlightedBuildings = useCityStore((s) => s.highlightedBuildings);
  const searchQuery = useCityStore((s) => s.searchQuery);
  const setHoveredBuilding = useCityStore((s) => s.setHoveredBuilding);
  const setSelectedBuilding = useCityStore((s) => s.setSelectedBuilding);

  const hasSearch = searchQuery.trim().length > 0;
  const count = buildings.length;

  // Pre-allocate objects
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Set transforms once (positions don't change after generation)
  const transforms = useMemo(() => {
    const matrix = new THREE.Matrix4();
    const matrices: THREE.Matrix4[] = [];
    buildings.forEach((b) => {
      matrix.identity();
      matrix.makeScale(b.width, b.height, b.depth);
      matrix.setPosition(b.x, b.height / 2, b.z);
      matrices.push(matrix.clone());
    });
    return matrices;
  }, [buildings]);

  // Update instance matrices and colors each frame  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const time = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const building = buildings[i];

      // Set transform
      mesh.setMatrixAt(i, transforms[i]);

      // Calculate color
      const isHovered = hoveredBuilding?.path === building.path;
      const isHighlighted = highlightedBuildings.has(building.path);
      const color = getBuildingColor(building, mode, isHovered, isHighlighted, hasSearch);

      // Add subtle emissive pulsing for frequently updated files
      if (building.isFrequentlyUpdated && mode !== 'structure') {
        const pulse = Math.sin(time * 2 + i * 0.5) * 0.15 + 0.85;
        tempColor.set(color).multiplyScalar(pulse);
        mesh.setColorAt(i, tempColor);
      } else {
        mesh.setColorAt(i, color);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  // Pointer events
  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < buildings.length) {
        setHoveredBuilding(buildings[e.instanceId]);
        document.body.style.cursor = 'pointer';
      }
    },
    [buildings, setHoveredBuilding],
  );

  const handlePointerOut = useCallback(() => {
    setHoveredBuilding(null);
    document.body.style.cursor = 'default';
  }, [setHoveredBuilding]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < buildings.length) {
        setSelectedBuilding(buildings[e.instanceId]);
      }
    },
    [buildings, setSelectedBuilding],
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        vertexColors
        roughness={0.3}
        metalness={0.1}
        envMapIntensity={0.5}
      />
    </instancedMesh>
  );
}
