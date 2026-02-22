'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { CityLayout } from '../../types';

interface CityNatureProps {
  cityLayout: CityLayout;
}

const _obj = new THREE.Object3D();
const _color = new THREE.Color();

/**
 * Dense forest trees and water ponds filling every empty space
 * in and around the city — gives a "city in a forest" vibe.
 */
export default function CityNature({ cityLayout }: CityNatureProps) {
  // Forest trees (bigger than sidewalk trees)
  const forestTrunkRef = useRef<THREE.InstancedMesh>(null);
  const forestCanopyRef = useRef<THREE.InstancedMesh>(null);
  // Bushes / shrubs
  const bushRef = useRef<THREE.InstancedMesh>(null);
  // Water ponds
  const pondRef = useRef<THREE.InstancedMesh>(null);
  // Lily pads on ponds
  const lilyRef = useRef<THREE.InstancedMesh>(null);
  // Surrounding dense forest ring
  const outerTrunkRef = useRef<THREE.InstancedMesh>(null);
  const outerCanopyRef = useRef<THREE.InstancedMesh>(null);

  const { forestTrees, bushes, ponds, lilies, outerTrees } = useMemo(() => {
    const { buildings, districts, roads, gridSize } = cityLayout;

    // Build occupied set — buildings occupy a footprint
    const occupied = new Set<string>();
    const key = (x: number, z: number) =>
      `${Math.round(x * 2)},${Math.round(z * 2)}`;

    buildings.forEach((b) => {
      const pad = Math.max(b.width, b.depth) / 2 + 0.4;
      for (let dx = -pad; dx <= pad; dx += 0.5) {
        for (let dz = -pad; dz <= pad; dz += 0.5) {
          occupied.add(key(b.x + dx, b.z + dz));
        }
      }
    });

    // Mark roads as occupied
    roads.forEach((r) => {
      const hw = r.width / 2 + 0.3;
      const hd = r.depth / 2 + 0.3;
      // Sample points along the road (roads can be very long, sample sparsely)
      const stepX = Math.min(hw * 2, 1);
      const stepZ = Math.min(hd * 2, 1);
      for (let dx = -hw; dx <= hw; dx += stepX) {
        for (let dz = -Math.min(hd, 30); dz <= Math.min(hd, 30); dz += stepZ) {
          occupied.add(key(r.x + dx, r.z + dz));
        }
      }
    });

    const isFree = (x: number, z: number) => !occupied.has(key(x, z));

    // City bounds
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    districts.forEach((d) => {
      minX = Math.min(minX, d.x - d.width / 2 - 3);
      maxX = Math.max(maxX, d.x + d.width / 2 + 3);
      minZ = Math.min(minZ, d.z - d.depth / 2 - 3);
      maxZ = Math.max(maxZ, d.z + d.depth / 2 + 3);
    });

    const isInCity = (x: number, z: number) =>
      x >= minX && x <= maxX && z >= minZ && z <= maxZ;

    // Seeded PRNG
    const seed = districts.length * 251 + buildings.length * 73 + 42;
    let rng = seed;
    const rand = () => {
      rng = (rng * 16807 + 0) % 2147483647;
      return (rng & 0x7fffffff) / 0x7fffffff;
    };

    const forestTreePos: { x: number; z: number; scale: number; type: number }[] = [];
    const bushPos: { x: number; z: number; scale: number }[] = [];
    const pondPos: { x: number; z: number; w: number; d: number; rot: number }[] = [];
    const lilyPos: { x: number; z: number; scale: number; rot: number }[] = [];
    const outerTreePos: { x: number; z: number; scale: number; type: number }[] = [];

    // ─── 1. Fill empty grid cells inside city with forest trees & bushes ───
    const STEP = 1.8; // scan step — dense enough to fill gaps
    for (let gx = minX; gx <= maxX; gx += STEP) {
      for (let gz = minZ; gz <= maxZ; gz += STEP) {
        const px = gx + (rand() - 0.5) * 1.2;
        const pz = gz + (rand() - 0.5) * 1.2;

        if (!isFree(px, pz)) continue;
        if (!isInCity(px, pz)) continue;

        const r = rand();
        if (r < 0.35) {
          // Forest tree
          forestTreePos.push({
            x: px,
            z: pz,
            scale: 0.5 + rand() * 0.8,
            type: Math.floor(rand() * 3), // 0=round, 1=tall, 2=wide
          });
          // Mark this spot as occupied so nearby items don't pile up
          occupied.add(key(px, pz));
        } else if (r < 0.55) {
          // Bush / shrub
          bushPos.push({
            x: px,
            z: pz,
            scale: 0.15 + rand() * 0.25,
          });
        }
        // else leave empty for breathing room
      }
    }

    // ─── 2. Water ponds in larger gaps between districts ───
    for (let i = 0; i < districts.length; i++) {
      for (let j = i + 1; j < districts.length; j++) {
        const d1 = districts[i];
        const d2 = districts[j];
        const mx = (d1.x + d2.x) / 2;
        const mz = (d1.z + d2.z) / 2;
        const dist = Math.sqrt((d1.x - d2.x) ** 2 + (d1.z - d2.z) ** 2);

        if (dist > 6 && dist < 20 && isFree(mx, mz) && rand() < 0.4) {
          const pw = 1.0 + rand() * 2.0;
          const pd = 0.8 + rand() * 1.5;
          pondPos.push({ x: mx, z: mz, w: pw, d: pd, rot: rand() * Math.PI });

          // Lily pads on the pond
          const lilyCount = 2 + Math.floor(rand() * 4);
          for (let l = 0; l < lilyCount; l++) {
            lilyPos.push({
              x: mx + (rand() - 0.5) * pw * 0.7,
              z: mz + (rand() - 0.5) * pd * 0.7,
              scale: 0.08 + rand() * 0.1,
              rot: rand() * Math.PI * 2,
            });
          }

          // Mark pond area
          for (let dx = -pw; dx <= pw; dx += 0.5) {
            for (let dz = -pd; dz <= pd; dz += 0.5) {
              occupied.add(key(mx + dx, mz + dz));
            }
          }
        }
      }
    }

    // Also scatter some ponds in open areas within the city grid
    for (let gx = minX + 3; gx <= maxX - 3; gx += 8) {
      for (let gz = minZ + 3; gz <= maxZ - 3; gz += 8) {
        const px = gx + (rand() - 0.5) * 4;
        const pz = gz + (rand() - 0.5) * 4;
        if (rand() < 0.2 && isFree(px, pz) && isFree(px + 1, pz) && isFree(px, pz + 1)) {
          const pw = 0.8 + rand() * 1.5;
          const pd = 0.6 + rand() * 1.2;
          pondPos.push({ x: px, z: pz, w: pw, d: pd, rot: rand() * Math.PI });

          const lilyCount = 1 + Math.floor(rand() * 3);
          for (let l = 0; l < lilyCount; l++) {
            lilyPos.push({
              x: px + (rand() - 0.5) * pw * 0.6,
              z: pz + (rand() - 0.5) * pd * 0.6,
              scale: 0.06 + rand() * 0.08,
              rot: rand() * Math.PI * 2,
            });
          }
        }
      }
    }

    // ─── 3. Dense surrounding forest ring (outside city, inside ground) ───
    const outerPad = 4;
    const outerExtent = gridSize + 8;
    const OUTER_STEP = 2.2;

    for (let ox = -outerExtent; ox <= outerExtent; ox += OUTER_STEP) {
      for (let oz = -outerExtent; oz <= outerExtent; oz += OUTER_STEP) {
        const px = ox + (rand() - 0.5) * 1.5;
        const pz = oz + (rand() - 0.5) * 1.5;

        // Only outside city bounds (with a small pad)
        const insideCity =
          px >= minX - outerPad && px <= maxX + outerPad &&
          pz >= minZ - outerPad && pz <= maxZ + outerPad;
        if (insideCity) continue;

        // Distance from origin — thin out at far edges
        const distFromCenter = Math.sqrt(px * px + pz * pz);
        if (distFromCenter > outerExtent * 1.3) continue;

        if (rand() < 0.65) {
          outerTreePos.push({
            x: px,
            z: pz,
            scale: 0.6 + rand() * 1.0,
            type: Math.floor(rand() * 3),
          });
        }
      }
    }

    return {
      forestTrees: forestTreePos.slice(0, 800),
      bushes: bushPos.slice(0, 500),
      ponds: pondPos.slice(0, 60),
      lilies: lilyPos.slice(0, 200),
      outerTrees: outerTreePos.slice(0, 2000),
    };
  }, [cityLayout]);

  // ─── Set forest tree transforms ───
  useEffect(() => {
    if (!forestTrunkRef.current || !forestCanopyRef.current) return;

    forestTrees.forEach((t, i) => {
      const trunkH = 0.8 * t.scale;
      const trunkR = 0.07 * t.scale;

      // Trunk
      _obj.position.set(t.x, trunkH / 2, t.z);
      _obj.scale.set(trunkR, trunkH, trunkR);
      _obj.rotation.set(0, 0, 0);
      _obj.updateMatrix();
      forestTrunkRef.current!.setMatrixAt(i, _obj.matrix);
      // Brown trunk with variation
      _color.setHSL(0.07 + (i % 4) * 0.02, 0.5, 0.2 + (i % 3) * 0.05);
      forestTrunkRef.current!.setColorAt(i, _color);

      // Canopy — shape varies by type
      let cw: number, ch: number, cd: number;
      switch (t.type) {
        case 0: // round
          cw = cd = 0.4 * t.scale;
          ch = 0.45 * t.scale;
          break;
        case 1: // tall pine-like
          cw = cd = 0.25 * t.scale;
          ch = 0.7 * t.scale;
          break;
        default: // wide oak-like
          cw = cd = 0.55 * t.scale;
          ch = 0.35 * t.scale;
          break;
      }
      _obj.position.set(t.x, trunkH + ch * 0.5, t.z);
      _obj.scale.set(cw, ch, cd);
      _obj.updateMatrix();
      forestCanopyRef.current!.setMatrixAt(i, _obj.matrix);

      // Rich varied greens
      const hue = 0.24 + (i % 9) * 0.012;
      const sat = 0.45 + (i % 5) * 0.07;
      const light = 0.22 + (i % 7) * 0.04;
      _color.setHSL(hue, sat, light);
      forestCanopyRef.current!.setColorAt(i, _color);
    });

    forestTrunkRef.current.instanceMatrix.needsUpdate = true;
    if (forestTrunkRef.current.instanceColor) forestTrunkRef.current.instanceColor.needsUpdate = true;
    forestTrunkRef.current.computeBoundingSphere();

    forestCanopyRef.current.instanceMatrix.needsUpdate = true;
    if (forestCanopyRef.current.instanceColor) forestCanopyRef.current.instanceColor.needsUpdate = true;
    forestCanopyRef.current.computeBoundingSphere();
  }, [forestTrees]);

  // ─── Set bush transforms ───
  useEffect(() => {
    if (!bushRef.current) return;

    bushes.forEach((b, i) => {
      _obj.position.set(b.x, b.scale * 0.5, b.z);
      _obj.scale.set(b.scale * 1.2, b.scale, b.scale * 1.2);
      _obj.rotation.set(0, i * 1.3, 0);
      _obj.updateMatrix();
      bushRef.current!.setMatrixAt(i, _obj.matrix);

      const hue = 0.26 + (i % 6) * 0.015;
      const sat = 0.5 + (i % 4) * 0.06;
      const light = 0.25 + (i % 5) * 0.04;
      _color.setHSL(hue, sat, light);
      bushRef.current!.setColorAt(i, _color);
    });

    bushRef.current.instanceMatrix.needsUpdate = true;
    if (bushRef.current.instanceColor) bushRef.current.instanceColor.needsUpdate = true;
    bushRef.current.computeBoundingSphere();
  }, [bushes]);

  // ─── Set pond transforms ───
  useEffect(() => {
    if (!pondRef.current) return;

    ponds.forEach((p, i) => {
      _obj.position.set(p.x, 0.02, p.z);
      _obj.rotation.set(-Math.PI / 2, 0, p.rot);
      _obj.scale.set(p.w, p.d, 1);
      _obj.updateMatrix();
      pondRef.current!.setMatrixAt(i, _obj.matrix);

      // Vary water color — some darker, some lighter, slightly blue-green
      const hue = 0.52 + (i % 5) * 0.02;
      const sat = 0.35 + (i % 3) * 0.1;
      const light = 0.3 + (i % 4) * 0.05;
      _color.setHSL(hue, sat, light);
      pondRef.current!.setColorAt(i, _color);
    });

    pondRef.current.instanceMatrix.needsUpdate = true;
    if (pondRef.current.instanceColor) pondRef.current.instanceColor.needsUpdate = true;
    pondRef.current.computeBoundingSphere();
  }, [ponds]);

  // ─── Set lily pad transforms ───
  useEffect(() => {
    if (!lilyRef.current) return;

    lilies.forEach((l, i) => {
      _obj.position.set(l.x, 0.04, l.z);
      _obj.rotation.set(-Math.PI / 2, 0, l.rot);
      _obj.scale.set(l.scale, l.scale, 1);
      _obj.updateMatrix();
      lilyRef.current!.setMatrixAt(i, _obj.matrix);

      // Green lily pads
      _color.setHSL(0.32 + (i % 4) * 0.02, 0.55, 0.35 + (i % 3) * 0.05);
      lilyRef.current!.setColorAt(i, _color);
    });

    lilyRef.current.instanceMatrix.needsUpdate = true;
    if (lilyRef.current.instanceColor) lilyRef.current.instanceColor.needsUpdate = true;
    lilyRef.current.computeBoundingSphere();
  }, [lilies]);

  // ─── Set outer forest transforms ───
  useEffect(() => {
    if (!outerTrunkRef.current || !outerCanopyRef.current) return;

    outerTrees.forEach((t, i) => {
      const trunkH = 1.0 * t.scale;
      const trunkR = 0.08 * t.scale;

      _obj.position.set(t.x, trunkH / 2, t.z);
      _obj.scale.set(trunkR, trunkH, trunkR);
      _obj.rotation.set(0, 0, 0);
      _obj.updateMatrix();
      outerTrunkRef.current!.setMatrixAt(i, _obj.matrix);

      _color.setHSL(0.06 + (i % 3) * 0.02, 0.45, 0.2 + (i % 4) * 0.03);
      outerTrunkRef.current!.setColorAt(i, _color);

      // Canopy
      let cw: number, ch: number, cd: number;
      switch (t.type) {
        case 0:
          cw = cd = 0.5 * t.scale;
          ch = 0.55 * t.scale;
          break;
        case 1:
          cw = cd = 0.3 * t.scale;
          ch = 0.9 * t.scale;
          break;
        default:
          cw = cd = 0.65 * t.scale;
          ch = 0.4 * t.scale;
          break;
      }
      _obj.position.set(t.x, trunkH + ch * 0.45, t.z);
      _obj.scale.set(cw, ch, cd);
      _obj.updateMatrix();
      outerCanopyRef.current!.setMatrixAt(i, _obj.matrix);

      // Slightly darker greens for outer forest
      const hue = 0.25 + (i % 8) * 0.01;
      const sat = 0.5 + (i % 4) * 0.06;
      const light = 0.18 + (i % 6) * 0.035;
      _color.setHSL(hue, sat, light);
      outerCanopyRef.current!.setColorAt(i, _color);
    });

    outerTrunkRef.current.instanceMatrix.needsUpdate = true;
    if (outerTrunkRef.current.instanceColor) outerTrunkRef.current.instanceColor.needsUpdate = true;
    outerTrunkRef.current.computeBoundingSphere();

    outerCanopyRef.current.instanceMatrix.needsUpdate = true;
    if (outerCanopyRef.current.instanceColor) outerCanopyRef.current.instanceColor.needsUpdate = true;
    outerCanopyRef.current.computeBoundingSphere();
  }, [outerTrees]);

  return (
    <group>
      {/* ── Inner forest trees (filling empty city spaces) ── */}
      {forestTrees.length > 0 && (
        <instancedMesh
          ref={forestTrunkRef}
          args={[undefined, undefined, forestTrees.length]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.5, 0.6, 1, 6]} />
          <meshStandardMaterial roughness={0.9} metalness={0} />
        </instancedMesh>
      )}
      {forestTrees.length > 0 && (
        <instancedMesh
          ref={forestCanopyRef}
          args={[undefined, undefined, forestTrees.length]}
          frustumCulled={false}
          castShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial roughness={0.85} metalness={0} />
        </instancedMesh>
      )}

      {/* ── Bushes / shrubs ── */}
      {bushes.length > 0 && (
        <instancedMesh
          ref={bushRef}
          args={[undefined, undefined, bushes.length]}
          frustumCulled={false}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial roughness={0.9} metalness={0} />
        </instancedMesh>
      )}

      {/* ── Water ponds ── */}
      {ponds.length > 0 && (
        <instancedMesh
          ref={pondRef}
          args={[undefined, undefined, ponds.length]}
          frustumCulled={false}
          receiveShadow
        >
          <circleGeometry args={[1, 16]} />
          <meshStandardMaterial
            roughness={0.15}
            metalness={0.3}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
      )}

      {/* ── Lily pads ── */}
      {lilies.length > 0 && (
        <instancedMesh
          ref={lilyRef}
          args={[undefined, undefined, lilies.length]}
          frustumCulled={false}
        >
          <circleGeometry args={[1, 8]} />
          <meshStandardMaterial
            roughness={0.8}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
      )}

      {/* ── Outer surrounding forest ── */}
      {outerTrees.length > 0 && (
        <instancedMesh
          ref={outerTrunkRef}
          args={[undefined, undefined, outerTrees.length]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[0.5, 0.6, 1, 5]} />
          <meshStandardMaterial roughness={0.9} metalness={0} />
        </instancedMesh>
      )}
      {outerTrees.length > 0 && (
        <instancedMesh
          ref={outerCanopyRef}
          args={[undefined, undefined, outerTrees.length]}
          frustumCulled={false}
          castShadow
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial roughness={0.85} metalness={0} />
        </instancedMesh>
      )}
    </group>
  );
}
