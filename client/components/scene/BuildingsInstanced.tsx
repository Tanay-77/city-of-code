'use client';

import { useRef, useMemo, useCallback, useEffect, memo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCityStore } from '../../hooks/useCityStore';
import { BuildingData, BuildingType, VisualizationMode } from '../../types';
import { useBuildingTextures } from '../../utils/buildingTextures';

/* ------------------------------------------------------------------ */
/*  Color helpers                                                     */
/* ------------------------------------------------------------------ */

const HOVER_COLOR = new THREE.Color('#ffffff');
const SEARCH_HIGHLIGHT = new THREE.Color('#00ffcc');
const DIM_COLOR = new THREE.Color('#2a2a2a');
const ACTIVITY_HIGH = new THREE.Color('#ff4444');
const ACTIVITY_LOW = new THREE.Color('#334455');

// Per-building-type palettes — bright enough for white-theme, used as texture tint
const TYPE_PALETTES: Record<BuildingType, THREE.Color[]> = {
  skyscraper: [
    new THREE.Color('#dce4ea'),
    new THREE.Color('#c8d4dc'),
    new THREE.Color('#d4dce4'),
    new THREE.Color('#e0e8ee'),
  ],
  tower: [
    new THREE.Color('#c0d0dc'),
    new THREE.Color('#b4c4d0'),
    new THREE.Color('#acc0d0'),
    new THREE.Color('#c8d8e4'),
  ],
  office: [
    new THREE.Color('#e8e0d8'),
    new THREE.Color('#ddd4cc'),
    new THREE.Color('#e4dcd4'),
    new THREE.Color('#d8d0c8'),
  ],
  'low-rise': [
    new THREE.Color('#f0ece8'),
    new THREE.Color('#eae4de'),
    new THREE.Color('#ece8e2'),
    new THREE.Color('#e6e0da'),
  ],
  shed: [
    new THREE.Color('#e4e0dc'),
    new THREE.Color('#dcd8d2'),
    new THREE.Color('#e0dcd8'),
    new THREE.Color('#d8d4d0'),
  ],
};

function pickBaseColor(building: BuildingData): THREE.Color {
  const palette = TYPE_PALETTES[building.buildingType] || TYPE_PALETTES['office'];
  const idx = Math.floor(building.wallTint * palette.length) % palette.length;
  return palette[idx].clone();
}

function getBuildingColor(
  building: BuildingData,
  mode: VisualizationMode,
  isHovered: boolean,
  isHighlighted: boolean,
  hasSearch: boolean,
): THREE.Color {
  if (isHovered) return HOVER_COLOR;
  if (isHighlighted) return SEARCH_HIGHLIGHT;
  if (hasSearch) return DIM_COLOR;

  switch (mode) {
    case 'language':
      return new THREE.Color(building.color);
    case 'activity':
      return building.isFrequentlyUpdated
        ? ACTIVITY_HIGH.clone().lerp(new THREE.Color('#ff8800'), building.emissiveIntensity)
        : ACTIVITY_LOW;
    case 'structure':
    default:
      return pickBaseColor(building);
  }
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface BuildingsInstancedProps {
  buildings: BuildingData[];
  mode: VisualizationMode;
}

/* ------------------------------------------------------------------ */
/*  Bucketing buildings by type for separate InstancedMeshes          */
/* ------------------------------------------------------------------ */

interface Bucket {
  type: BuildingType;
  buildings: BuildingData[];
  /** original index in the full buildings array (needed for pointer events) */
  originalIndices: number[];
}

function bucketByType(buildings: BuildingData[]): Bucket[] {
  const map = new Map<BuildingType, { buildings: BuildingData[]; originalIndices: number[] }>();
  buildings.forEach((b, i) => {
    if (!map.has(b.buildingType)) map.set(b.buildingType, { buildings: [], originalIndices: [] });
    const entry = map.get(b.buildingType)!;
    entry.buildings.push(b);
    entry.originalIndices.push(i);
  });
  return Array.from(map.entries()).map(([type, data]) => ({ type, ...data }));
}

/* ------------------------------------------------------------------ */
/*  Reusable temp objects                                             */
/* ------------------------------------------------------------------ */

const _obj = new THREE.Object3D();
const _color = new THREE.Color();

/* ------------------------------------------------------------------ */
/*  Individual typed instanced mesh                                   */
/* ------------------------------------------------------------------ */

interface TypedMeshProps {
  bucket: Bucket;
  mode: VisualizationMode;
  texture: THREE.Texture;
  allBuildings: BuildingData[];
}

const TypedBuildingMesh = memo(function TypedBuildingMesh({
  bucket,
  mode,
  texture,
  allBuildings,
}: TypedMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const setbackMeshRef = useRef<THREE.InstancedMesh>(null);
  const roofMeshRef = useRef<THREE.InstancedMesh>(null);

  const hoveredBuilding = useCityStore((s) => s.hoveredBuilding);
  const highlightedBuildings = useCityStore((s) => s.highlightedBuildings);
  const searchQuery = useCityStore((s) => s.searchQuery);
  const setHoveredBuilding = useCityStore((s) => s.setHoveredBuilding);
  const setSelectedBuilding = useCityStore((s) => s.setSelectedBuilding);

  const hasSearch = searchQuery.trim().length > 0;
  const { buildings, originalIndices } = bucket;
  const count = buildings.length;

  // Count setback & roof detail buildings
  const setbackCount = useMemo(() => buildings.filter((b) => b.hasSetback).length, [buildings]);
  const roofCount = useMemo(
    () => buildings.filter((b) => b.roofType !== 'flat').length,
    [buildings],
  );

  // Clone texture so each bucket type can have its own settings
  const texClone = useMemo(() => {
    const t = texture.clone();
    t.needsUpdate = true;
    return t;
  }, [texture]);

  // --- Set transforms & colors ---
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;

    let setbackIdx = 0;
    let roofIdx = 0;

    for (let i = 0; i < count; i++) {
      const b = buildings[i];

      // Main body
      const bodyH = b.hasSetback ? b.height * b.setbackHeight : b.height;
      _obj.position.set(b.x, bodyH / 2, b.z);
      _obj.scale.set(b.width, bodyH, b.depth);
      _obj.rotation.set(0, 0, 0);
      _obj.updateMatrix();
      mesh.setMatrixAt(i, _obj.matrix);

      const color = getBuildingColor(b, mode, false, false, false);
      mesh.setColorAt(i, color);

      // Setback upper portion
      if (b.hasSetback && setbackMeshRef.current) {
        const upperH = b.height - bodyH;
        const upperW = b.width * b.setbackRatio;
        const upperD = b.depth * b.setbackRatio;
        _obj.position.set(b.x, bodyH + upperH / 2, b.z);
        _obj.scale.set(upperW, upperH, upperD);
        _obj.updateMatrix();
        setbackMeshRef.current.setMatrixAt(setbackIdx, _obj.matrix);
        // Slightly lighter color for upper section
        _color.copy(color).lerp(new THREE.Color('#ffffff'), 0.12);
        setbackMeshRef.current.setColorAt(setbackIdx, _color);
        setbackIdx++;
      }

      // Roof details
      if (b.roofType !== 'flat' && roofMeshRef.current) {
        const topY = b.height;
        switch (b.roofType) {
          case 'antenna': {
            const antennaH = b.height * 0.15;
            _obj.position.set(b.x, topY + antennaH / 2, b.z);
            _obj.scale.set(0.05, antennaH, 0.05);
            _obj.updateMatrix();
            break;
          }
          case 'helipad': {
            _obj.position.set(b.x, topY + 0.05, b.z);
            _obj.scale.set(b.width * 0.6, 0.1, b.depth * 0.6);
            _obj.updateMatrix();
            break;
          }
          case 'mechanical': {
            const mechH = 0.3 + Math.random() * 0.4;
            _obj.position.set(
              b.x + (Math.random() - 0.5) * b.width * 0.3,
              topY + mechH / 2,
              b.z + (Math.random() - 0.5) * b.depth * 0.3,
            );
            _obj.scale.set(b.width * 0.3, mechH, b.depth * 0.3);
            _obj.updateMatrix();
            break;
          }
        }
        roofMeshRef.current.setMatrixAt(roofIdx, _obj.matrix);
        roofMeshRef.current.setColorAt(roofIdx, new THREE.Color('#8a8a8a'));
        roofIdx++;
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();

    if (setbackMeshRef.current && setbackCount > 0) {
      setbackMeshRef.current.instanceMatrix.needsUpdate = true;
      if (setbackMeshRef.current.instanceColor)
        setbackMeshRef.current.instanceColor.needsUpdate = true;
      setbackMeshRef.current.computeBoundingSphere();
    }
    if (roofMeshRef.current && roofCount > 0) {
      roofMeshRef.current.instanceMatrix.needsUpdate = true;
      if (roofMeshRef.current.instanceColor)
        roofMeshRef.current.instanceColor.needsUpdate = true;
      roofMeshRef.current.computeBoundingSphere();
    }
  }, [buildings, count, mode, setbackCount, roofCount]);

  // --- Animate colors per frame (hover / search) ---
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;
    const time = clock.getElapsedTime();

    let changed = false;
    for (let i = 0; i < count; i++) {
      const b = buildings[i];
      const isHovered = hoveredBuilding?.path === b.path;
      const isHighlighted = highlightedBuildings.has(b.path);
      const color = getBuildingColor(b, mode, isHovered, isHighlighted, hasSearch);

      if (b.isFrequentlyUpdated && mode !== 'structure') {
        const pulse = Math.sin(time * 2 + originalIndices[i] * 0.5) * 0.12 + 0.88;
        _color.copy(color).multiplyScalar(pulse);
        mesh.setColorAt(i, _color);
      } else {
        mesh.setColorAt(i, color);
      }
      changed = true;
    }
    if (changed && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  // --- Pointer events ---
  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < buildings.length) {
        setHoveredBuilding(allBuildings[originalIndices[e.instanceId]]);
        document.body.style.cursor = 'pointer';
      }
    },
    [buildings, allBuildings, originalIndices, setHoveredBuilding],
  );

  const handlePointerOut = useCallback(() => {
    setHoveredBuilding(null);
    document.body.style.cursor = 'default';
  }, [setHoveredBuilding]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < buildings.length) {
        setSelectedBuilding(allBuildings[originalIndices[e.instanceId]]);
      }
    },
    [buildings, allBuildings, originalIndices, setSelectedBuilding],
  );

  if (count === 0) return null;

  return (
    <group>
      {/* Main building bodies */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        frustumCulled={false}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          map={texClone}
          roughness={0.65}
          metalness={0.1}
        />
      </instancedMesh>

      {/* Setback upper portions */}
      {setbackCount > 0 && (
        <instancedMesh
          ref={setbackMeshRef}
          args={[undefined, undefined, setbackCount]}
          frustumCulled={false}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            map={texClone}
            roughness={0.6}
            metalness={0.12}
          />
        </instancedMesh>
      )}

      {/* Rooftop details */}
      {roofCount > 0 && (
        <instancedMesh
          ref={roofMeshRef}
          args={[undefined, undefined, roofCount]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#8a8a8a"
            roughness={0.8}
            metalness={0.3}
          />
        </instancedMesh>
      )}
    </group>
  );
});

/* ------------------------------------------------------------------ */
/*  Main component – splits buildings into typed buckets              */
/* ------------------------------------------------------------------ */

export default function BuildingsInstanced({ buildings, mode }: BuildingsInstancedProps) {
  const textures = useBuildingTextures();

  const buckets = useMemo(() => bucketByType(buildings), [buildings]);

  const texForType = useCallback(
    (type: BuildingType): THREE.Texture => {
      switch (type) {
        case 'skyscraper':
          return textures.skyscraper;
        case 'tower':
          return textures.glassTower;
        case 'office':
          return textures.office;
        case 'low-rise':
        case 'shed':
        default:
          return textures.lowRise;
      }
    },
    [textures],
  );

  if (buildings.length === 0) return null;

  return (
    <group>
      {buckets.map((bucket) => (
        <TypedBuildingMesh
          key={bucket.type}
          bucket={bucket}
          mode={mode}
          texture={texForType(bucket.type)}
          allBuildings={buildings}
        />
      ))}
    </group>
  );
}