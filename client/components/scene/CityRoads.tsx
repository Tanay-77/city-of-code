'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { RoadSegment } from '../../types';

interface CityRoadsProps {
  roads: RoadSegment[];
}

const ROAD_H = 0.08; // visible slab height
const roadColor = new THREE.Color('#333333');
const sidewalkColor = new THREE.Color('#b0a898');

/**
 * Each road rendered as a standard box mesh (guaranteed visible).
 * Sidewalk curb strips on each side.
 */
export default function CityRoads({ roads }: CityRoadsProps) {
  console.log('[CityRoads] roads received:', roads?.length ?? 'undefined');
  if (!roads || roads.length === 0) return null;

  // Precompute sidewalk data
  const sidewalks = useMemo(() => {
    const SW = 0.3; // sidewalk width
    const result: { x: number; z: number; w: number; d: number }[] = [];

    roads.forEach((seg) => {
      const isV = seg.depth > seg.width; // vertical road
      if (isV) {
        result.push({ x: seg.x - seg.width / 2 - SW / 2, z: seg.z, w: SW, d: seg.depth });
        result.push({ x: seg.x + seg.width / 2 + SW / 2, z: seg.z, w: SW, d: seg.depth });
      } else {
        result.push({ x: seg.x, z: seg.z - seg.depth / 2 - SW / 2, w: seg.width, d: SW });
        result.push({ x: seg.x, z: seg.z + seg.depth / 2 + SW / 2, w: seg.width, d: SW });
      }
    });

    return result;
  }, [roads]);

  return (
    <group>
      {/* Road surfaces — dark asphalt boxes */}
      {roads.map((seg, i) => (
        <mesh
          key={`r${i}`}
          position={[seg.x, ROAD_H / 2, seg.z]}
          receiveShadow
        >
          <boxGeometry args={[seg.width, ROAD_H, seg.depth]} />
          <meshStandardMaterial color={roadColor} roughness={0.9} metalness={0} />
        </mesh>
      ))}

      {/* Sidewalk curbs — lighter raised strips */}
      {sidewalks.map((s, i) => (
        <mesh
          key={`s${i}`}
          position={[s.x, ROAD_H / 2 + 0.02, s.z]}
          receiveShadow
        >
          <boxGeometry args={[s.w, ROAD_H + 0.04, s.d]} />
          <meshStandardMaterial color={sidewalkColor} roughness={0.8} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
