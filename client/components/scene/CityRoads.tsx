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
const stripeColor = new THREE.Color('#e8e8e0');
const zebraColor = new THREE.Color('#f0f0e8');

// Center-line dash dimensions
const DASH_LEN = 0.6;
const DASH_GAP = 0.5;
const DASH_W = 0.06;
const DASH_H = 0.002; // just above road surface

// Zebra crossing dimensions
const ZEBRA_BAR_W = 0.12;
const ZEBRA_BAR_GAP = 0.12;
const ZEBRA_CROSSING_W = 1.0; // total crossing width along the road

/**
 * Roads with dashed center-line markings and zebra crossings.
 */
export default function CityRoads({ roads }: CityRoadsProps) {
  console.log('[CityRoads] roads received:', roads?.length ?? 'undefined');
  if (!roads || roads.length === 0) return null;

  // Precompute sidewalk strips — split around intersections so no borders at crossings
  const sidewalks = useMemo(() => {
    const SW = 0.3;
    const result: { x: number; z: number; w: number; d: number }[] = [];

    const vRoads = roads.filter((r) => r.depth > r.width);
    const hRoads = roads.filter((r) => r.width >= r.depth);

    // Find intersection zones for each road
    const getIntersections = (road: RoadSegment, crossRoads: RoadSegment[], isVertical: boolean) => {
      const zones: { min: number; max: number }[] = [];
      crossRoads.forEach((cr) => {
        if (isVertical) {
          // Vertical road crosses horizontal road — intersection zone along Z
          const crHalfD = cr.depth / 2 + SW + 0.1;
          zones.push({ min: cr.z - crHalfD, max: cr.z + crHalfD });
        } else {
          // Horizontal road crosses vertical road — intersection zone along X
          const crHalfW = cr.width / 2 + SW + 0.1;
          zones.push({ min: cr.x - crHalfW, max: cr.x + crHalfW });
        }
      });
      return zones.sort((a, b) => a.min - b.min);
    };

    // Split a span into segments that avoid intersection zones
    const splitSpan = (start: number, end: number, zones: { min: number; max: number }[]) => {
      const segments: { start: number; end: number }[] = [];
      let cursor = start;
      for (const zone of zones) {
        if (zone.min > cursor) {
          segments.push({ start: cursor, end: Math.min(zone.min, end) });
        }
        cursor = Math.max(cursor, zone.max);
      }
      if (cursor < end) {
        segments.push({ start: cursor, end });
      }
      return segments;
    };

    // Vertical roads — sidewalks run along Z, split at horizontal road intersections
    vRoads.forEach((seg) => {
      const zones = getIntersections(seg, hRoads, true);
      const zStart = seg.z - seg.depth / 2;
      const zEnd = seg.z + seg.depth / 2;
      const spans = splitSpan(zStart, zEnd, zones);

      spans.forEach((sp) => {
        const len = sp.end - sp.start;
        if (len < 0.2) return;
        const midZ = (sp.start + sp.end) / 2;
        // Left sidewalk
        result.push({ x: seg.x - seg.width / 2 - SW / 2, z: midZ, w: SW, d: len });
        // Right sidewalk
        result.push({ x: seg.x + seg.width / 2 + SW / 2, z: midZ, w: SW, d: len });
      });
    });

    // Horizontal roads — sidewalks run along X, split at vertical road intersections
    hRoads.forEach((seg) => {
      const zones = getIntersections(seg, vRoads, false);
      const xStart = seg.x - seg.width / 2;
      const xEnd = seg.x + seg.width / 2;
      const spans = splitSpan(xStart, xEnd, zones);

      spans.forEach((sp) => {
        const len = sp.end - sp.start;
        if (len < 0.2) return;
        const midX = (sp.start + sp.end) / 2;
        // Top sidewalk
        result.push({ x: midX, z: seg.z - seg.depth / 2 - SW / 2, w: len, d: SW });
        // Bottom sidewalk
        result.push({ x: midX, z: seg.z + seg.depth / 2 + SW / 2, w: len, d: SW });
      });
    });

    return result;
  }, [roads]);

  // Precompute dashed center-line stripes — skip intersection zones
  const dashes = useMemo(() => {
    const result: { x: number; z: number; w: number; d: number }[] = [];
    const vRoads = roads.filter((r) => r.depth > r.width);
    const hRoads = roads.filter((r) => r.width >= r.depth);

    // Check if a point is inside any intersection
    const isInIntersection = (px: number, pz: number) => {
      for (const vr of vRoads) {
        for (const hr of hRoads) {
          const pad = 0.3;
          const vrHW = vr.width / 2 + pad;
          const hrHD = hr.depth / 2 + pad;
          if (
            px >= vr.x - vrHW && px <= vr.x + vrHW &&
            pz >= hr.z - hrHD && pz <= hr.z + hrHD
          ) {
            return true;
          }
        }
      }
      return false;
    };

    roads.forEach((seg) => {
      const isV = seg.depth > seg.width;
      const span = isV ? seg.depth : seg.width;
      const halfSpan = span / 2;
      const step = DASH_LEN + DASH_GAP;

      for (let t = -halfSpan + DASH_GAP; t + DASH_LEN <= halfSpan; t += step) {
        if (isV) {
          const dz = seg.z + t + DASH_LEN / 2;
          if (isInIntersection(seg.x, dz)) continue;
          result.push({ x: seg.x, z: dz, w: DASH_W, d: DASH_LEN });
        } else {
          const dx = seg.x + t + DASH_LEN / 2;
          if (isInIntersection(dx, seg.z)) continue;
          result.push({ x: dx, z: seg.z, w: DASH_LEN, d: DASH_W });
        }
      }
    });

    return result;
  }, [roads]);

  // Precompute zebra crossings at intersections
  const zebras = useMemo(() => {
    const result: { x: number; z: number; w: number; d: number }[] = [];

    // Separate vertical and horizontal roads
    const vRoads = roads.filter((r) => r.depth > r.width);
    const hRoads = roads.filter((r) => r.width >= r.depth);

    // At each intersection of a vertical and horizontal road, place zebra bars
    vRoads.forEach((vr) => {
      hRoads.forEach((hr) => {
        // Check if they actually overlap
        const vMinZ = vr.z - vr.depth / 2;
        const vMaxZ = vr.z + vr.depth / 2;
        const hMinX = hr.x - hr.width / 2;
        const hMaxX = hr.x + hr.width / 2;

        if (vr.x >= hMinX && vr.x <= hMaxX && hr.z >= vMinZ && hr.z <= vMaxZ) {
          const ix = vr.x;
          const iz = hr.z;
          const rw = vr.width;
          const rd = hr.depth;

          // Zebra bars on all four sides of the intersection

          // Top side (above intersection) — bars span road width along X
          const topZ = iz - rd / 2 - ZEBRA_CROSSING_W / 2;
          const barCount = Math.floor(rw / (ZEBRA_BAR_W + ZEBRA_BAR_GAP));
          const totalBarSpan = barCount * ZEBRA_BAR_W + (barCount - 1) * ZEBRA_BAR_GAP;
          const startX = ix - totalBarSpan / 2 + ZEBRA_BAR_W / 2;

          for (let b = 0; b < barCount; b++) {
            const bx = startX + b * (ZEBRA_BAR_W + ZEBRA_BAR_GAP);
            result.push({ x: bx, z: topZ, w: ZEBRA_BAR_W, d: ZEBRA_CROSSING_W });
          }

          // Bottom side
          const botZ = iz + rd / 2 + ZEBRA_CROSSING_W / 2;
          for (let b = 0; b < barCount; b++) {
            const bx = startX + b * (ZEBRA_BAR_W + ZEBRA_BAR_GAP);
            result.push({ x: bx, z: botZ, w: ZEBRA_BAR_W, d: ZEBRA_CROSSING_W });
          }

          // Left side — bars span road depth along Z
          const leftX = ix - rw / 2 - ZEBRA_CROSSING_W / 2;
          const barCountV = Math.floor(rd / (ZEBRA_BAR_W + ZEBRA_BAR_GAP));
          const totalBarSpanV = barCountV * ZEBRA_BAR_W + (barCountV - 1) * ZEBRA_BAR_GAP;
          const startZ = iz - totalBarSpanV / 2 + ZEBRA_BAR_W / 2;

          for (let b = 0; b < barCountV; b++) {
            const bz = startZ + b * (ZEBRA_BAR_W + ZEBRA_BAR_GAP);
            result.push({ x: leftX, z: bz, w: ZEBRA_CROSSING_W, d: ZEBRA_BAR_W });
          }

          // Right side
          const rightX = ix + rw / 2 + ZEBRA_CROSSING_W / 2;
          for (let b = 0; b < barCountV; b++) {
            const bz = startZ + b * (ZEBRA_BAR_W + ZEBRA_BAR_GAP);
            result.push({ x: rightX, z: bz, w: ZEBRA_CROSSING_W, d: ZEBRA_BAR_W });
          }
        }
      });
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

      {/* Dashed center-line stripes */}
      {dashes.map((d, i) => (
        <mesh
          key={`d${i}`}
          position={[d.x, ROAD_H + DASH_H, d.z]}
        >
          <boxGeometry args={[d.w, DASH_H, d.d]} />
          <meshStandardMaterial color={stripeColor} roughness={0.6} metalness={0} />
        </mesh>
      ))}

      {/* Zebra crossings at intersections */}
      {zebras.map((z, i) => (
        <mesh
          key={`z${i}`}
          position={[z.x, ROAD_H + DASH_H, z.z]}
        >
          <boxGeometry args={[z.w, DASH_H, z.d]} />
          <meshStandardMaterial color={zebraColor} roughness={0.5} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
