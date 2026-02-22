'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { CityLayout } from '../../types';

interface CityGrassProps {
  cityLayout: CityLayout;
}

const _obj = new THREE.Object3D();
const _color = new THREE.Color();

/**
 * Procedural grass patches, park areas, and grass strips
 * scattered throughout the city for a realistic urban vibe.
 */
export default function CityGrass({ cityLayout }: CityGrassProps) {
  const grassPatchRef = useRef<THREE.InstancedMesh>(null);
  const grassBladeRef = useRef<THREE.InstancedMesh>(null);
  const parkBenchRef = useRef<THREE.InstancedMesh>(null);

  const { patches, blades, benches } = useMemo(() => {
    const { buildings, districts, roads } = cityLayout;

    // Build occupied set for collision avoidance
    const occupied = new Set<string>();
    buildings.forEach((b) => {
      // Mark a wider area around buildings as occupied
      for (let dx = -1; dx <= 1; dx += 0.5) {
        for (let dz = -1; dz <= 1; dz += 0.5) {
          occupied.add(`${Math.round((b.x + dx) * 2)},${Math.round((b.z + dz) * 2)}`);
        }
      }
    });

    const isFree = (x: number, z: number) =>
      !occupied.has(`${Math.round(x * 2)},${Math.round(z * 2)}`);

    // Road overlap check — reject items on or near roads
    const PAD = 0.4; // padding around roads
    const isOnRoad = (x: number, z: number) =>
      roads.some((r) => {
        const hw = r.width / 2 + PAD;
        const hd = r.depth / 2 + PAD;
        return x >= r.x - hw && x <= r.x + hw && z >= r.z - hd && z <= r.z + hd;
      });

    // Compute city bounds
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    districts.forEach((d) => {
      minX = Math.min(minX, d.x - d.width / 2 - 3);
      maxX = Math.max(maxX, d.x + d.width / 2 + 3);
      minZ = Math.min(minZ, d.z - d.depth / 2 - 3);
      maxZ = Math.max(maxZ, d.z + d.depth / 2 + 3);
    });

    const isInCity = (x: number, z: number) =>
      x >= minX && x <= maxX && z >= minZ && z <= maxZ;

    const patchPositions: { x: number; z: number; scaleX: number; scaleZ: number; rot: number }[] = [];
    const bladePositions: { x: number; z: number; scale: number; rot: number }[] = [];
    const benchPositions: { x: number; z: number; rot: number }[] = [];

    // Seeded-ish PRNG for determinism based on district count
    const seed = districts.length * 137 + buildings.length * 31;
    let rng = seed;
    const rand = () => {
      rng = (rng * 16807 + 0) % 2147483647;
      return (rng & 0x7fffffff) / 0x7fffffff;
    };

    // --- 1. Small grass patches between districts (medians / mini parks) ---
    for (let i = 0; i < districts.length; i++) {
      for (let j = i + 1; j < districts.length; j++) {
        const d1 = districts[i];
        const d2 = districts[j];
        const mx = (d1.x + d2.x) / 2;
        const mz = (d1.z + d2.z) / 2;
        const dist = Math.sqrt((d1.x - d2.x) ** 2 + (d1.z - d2.z) ** 2);

        if (dist < 15 && dist > 3 && isFree(mx, mz) && isInCity(mx, mz) && !isOnRoad(mx, mz)) {
          // Place a grass patch in the gap between districts
          const sw = 0.6 + rand() * 1.2;
          const sd = 0.6 + rand() * 1.2;
          patchPositions.push({ x: mx, z: mz, scaleX: sw, scaleZ: sd, rot: rand() * Math.PI });

          // Scatter a few grass blades on the patch
          for (let b = 0; b < 4 + Math.floor(rand() * 6); b++) {
            const bx = mx + (rand() - 0.5) * sw * 1.5;
            const bz = mz + (rand() - 0.5) * sd * 1.5;
            if (!isOnRoad(bx, bz))
              bladePositions.push({ x: bx, z: bz, scale: 0.06 + rand() * 0.06, rot: rand() * Math.PI * 2 });
          }

          // Occasional bench near the grass
          if (rand() > 0.5) {
            const benchX = mx + (rand() - 0.5) * 1.5;
            const benchZ = mz + (rand() - 0.5) * 1.5;
            if (!isOnRoad(benchX, benchZ))
              benchPositions.push({ x: benchX, z: benchZ, rot: rand() * Math.PI });
          }
        }
      }
    }

    // --- 2. Grass strips along district edges (urban sidewalk grass) ---
    const GRASS_STRIP_SPACING = 4;
    districts.forEach((d) => {
      const hw = d.width / 2;
      const hd = d.depth / 2;

      // Grass along top and bottom edges
      for (let t = -hw + 0.5; t < hw; t += GRASS_STRIP_SPACING + rand() * 2) {
        const px = d.x + t;

        // Top edge
        const tz1 = d.z - hd - 1.2;
        if (isFree(px, tz1) && isInCity(px, tz1) && !isOnRoad(px, tz1)) {
          const sw = 0.3 + rand() * 0.6;
          patchPositions.push({ x: px, z: tz1, scaleX: sw, scaleZ: 0.2 + rand() * 0.3, rot: 0 });
          for (let b = 0; b < 2 + Math.floor(rand() * 3); b++) {
            bladePositions.push({
              x: px + (rand() - 0.5) * sw,
              z: tz1 + (rand() - 0.5) * 0.3,
              scale: 0.04 + rand() * 0.05,
              rot: rand() * Math.PI * 2,
            });
          }
        }

        // Bottom edge
        const tz2 = d.z + hd + 1.2;
        if (isFree(px, tz2) && isInCity(px, tz2) && !isOnRoad(px, tz2)) {
          const sw = 0.3 + rand() * 0.6;
          patchPositions.push({ x: px, z: tz2, scaleX: sw, scaleZ: 0.2 + rand() * 0.3, rot: 0 });
          for (let b = 0; b < 2 + Math.floor(rand() * 3); b++) {
            bladePositions.push({
              x: px + (rand() - 0.5) * sw,
              z: tz2 + (rand() - 0.5) * 0.3,
              scale: 0.04 + rand() * 0.05,
              rot: rand() * Math.PI * 2,
            });
          }
        }
      }

      // Grass along left and right edges
      for (let t = -hd + 0.5; t < hd; t += GRASS_STRIP_SPACING + rand() * 2) {
        const pz = d.z + t;

        const tx1 = d.x - hw - 1.2;
        if (isFree(tx1, pz) && isInCity(tx1, pz) && !isOnRoad(tx1, pz)) {
          const sd = 0.3 + rand() * 0.6;
          patchPositions.push({ x: tx1, z: pz, scaleX: 0.2 + rand() * 0.3, scaleZ: sd, rot: 0 });
          for (let b = 0; b < 2 + Math.floor(rand() * 3); b++) {
            bladePositions.push({
              x: tx1 + (rand() - 0.5) * 0.3,
              z: pz + (rand() - 0.5) * sd,
              scale: 0.04 + rand() * 0.05,
              rot: rand() * Math.PI * 2,
            });
          }
        }

        const tx2 = d.x + hw + 1.2;
        if (isFree(tx2, pz) && isInCity(tx2, pz) && !isOnRoad(tx2, pz)) {
          const sd = 0.3 + rand() * 0.6;
          patchPositions.push({ x: tx2, z: pz, scaleX: 0.2 + rand() * 0.3, scaleZ: sd, rot: 0 });
          for (let b = 0; b < 2 + Math.floor(rand() * 3); b++) {
            bladePositions.push({
              x: tx2 + (rand() - 0.5) * 0.3,
              z: pz + (rand() - 0.5) * sd,
              scale: 0.04 + rand() * 0.05,
              rot: rand() * Math.PI * 2,
            });
          }
        }
      }
    });

    // --- 3. Scattered small park patches in open areas ---
    const gridStep = 5;
    for (let gx = minX; gx <= maxX; gx += gridStep) {
      for (let gz = minZ; gz <= maxZ; gz += gridStep) {
        const px = gx + (rand() - 0.5) * 3;
        const pz = gz + (rand() - 0.5) * 3;
        if (rand() > 0.65 && isFree(px, pz) && isInCity(px, pz) && !isOnRoad(px, pz)) {
          const sw = 0.5 + rand() * 1.0;
          const sd = 0.5 + rand() * 1.0;
          patchPositions.push({ x: px, z: pz, scaleX: sw, scaleZ: sd, rot: rand() * Math.PI });

          const bladeCount = 3 + Math.floor(rand() * 5);
          for (let b = 0; b < bladeCount; b++) {
            const bx = px + (rand() - 0.5) * sw * 1.8;
            const bz = pz + (rand() - 0.5) * sd * 1.8;
            if (!isOnRoad(bx, bz))
              bladePositions.push({
                x: bx,
                z: bz,
                scale: 0.04 + rand() * 0.06,
                rot: rand() * Math.PI * 2,
              });
          }

          // Occasional bench
          if (rand() > 0.8) {
            const benchX = px + sw * 0.6;
            if (!isOnRoad(benchX, pz))
              benchPositions.push({ x: benchX, z: pz, rot: rand() * Math.PI });
          }
        }
      }
    }

    return {
      patches: patchPositions.slice(0, 600),
      blades: bladePositions.slice(0, 3000),
      benches: benchPositions.slice(0, 80),
    };
  }, [cityLayout]);

  // --- Set grass patch transforms (flat green quads on the ground) ---
  useEffect(() => {
    if (!grassPatchRef.current) return;

    patches.forEach((p, i) => {
      _obj.position.set(p.x, 0.01, p.z); // just above ground
      _obj.rotation.set(-Math.PI / 2, 0, p.rot);
      _obj.scale.set(p.scaleX, p.scaleZ, 1);
      _obj.updateMatrix();
      grassPatchRef.current!.setMatrixAt(i, _obj.matrix);

      // Vary green tones
      const hue = 0.27 + (i % 5) * 0.015;
      const sat = 0.45 + (i % 3) * 0.08;
      const light = 0.32 + (i % 4) * 0.04;
      _color.setHSL(hue, sat, light);
      grassPatchRef.current!.setColorAt(i, _color);
    });

    grassPatchRef.current.instanceMatrix.needsUpdate = true;
    if (grassPatchRef.current.instanceColor) grassPatchRef.current.instanceColor.needsUpdate = true;
    grassPatchRef.current.computeBoundingSphere();
  }, [patches]);

  // --- Set grass blade transforms (small thin triangles poking up) ---
  useEffect(() => {
    if (!grassBladeRef.current) return;

    blades.forEach((b, i) => {
      _obj.position.set(b.x, b.scale * 0.5, b.z);
      _obj.rotation.set(0, b.rot, (Math.sin(i * 0.7) * 0.15)); // slight lean
      _obj.scale.set(b.scale * 0.3, b.scale, b.scale * 0.3);
      _obj.updateMatrix();
      grassBladeRef.current!.setMatrixAt(i, _obj.matrix);

      // Richer green variation for blades
      const hue = 0.25 + (i % 7) * 0.012;
      const sat = 0.5 + (i % 5) * 0.06;
      const light = 0.28 + (i % 6) * 0.04;
      _color.setHSL(hue, sat, light);
      grassBladeRef.current!.setColorAt(i, _color);
    });

    grassBladeRef.current.instanceMatrix.needsUpdate = true;
    if (grassBladeRef.current.instanceColor) grassBladeRef.current.instanceColor.needsUpdate = true;
    grassBladeRef.current.computeBoundingSphere();
  }, [blades]);

  // --- Set park bench transforms ---
  useEffect(() => {
    if (!parkBenchRef.current) return;

    benches.forEach((b, i) => {
      _obj.position.set(b.x, 0.12, b.z);
      _obj.rotation.set(0, b.rot, 0);
      _obj.scale.set(0.4, 0.24, 0.18);
      _obj.updateMatrix();
      parkBenchRef.current!.setMatrixAt(i, _obj.matrix);

      _color.set('#6b4226');
      parkBenchRef.current!.setColorAt(i, _color);
    });

    parkBenchRef.current.instanceMatrix.needsUpdate = true;
    if (parkBenchRef.current.instanceColor) parkBenchRef.current.instanceColor.needsUpdate = true;
    parkBenchRef.current.computeBoundingSphere();
  }, [benches]);

  return (
    <group>
      {/* Grass patches — flat green quads on the ground */}
      {patches.length > 0 && (
        <instancedMesh
          ref={grassPatchRef}
          args={[undefined, undefined, patches.length]}
          frustumCulled={false}
          receiveShadow
        >
          <circleGeometry args={[1, 8]} />
          <meshStandardMaterial
            roughness={0.95}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
      )}

      {/* Grass blades — small cones poking up */}
      {blades.length > 0 && (
        <instancedMesh
          ref={grassBladeRef}
          args={[undefined, undefined, blades.length]}
          frustumCulled={false}
        >
          <coneGeometry args={[0.5, 1, 3]} />
          <meshStandardMaterial
            roughness={0.9}
            metalness={0}
          />
        </instancedMesh>
      )}

      {/* Park benches — simple boxes */}
      {benches.length > 0 && (
        <instancedMesh
          ref={parkBenchRef}
          args={[undefined, undefined, benches.length]}
          frustumCulled={false}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            roughness={0.85}
            metalness={0.1}
          />
        </instancedMesh>
      )}
    </group>
  );
}
