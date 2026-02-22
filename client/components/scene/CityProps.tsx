'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { CityLayout } from '../../types';

interface CityPropsProps {
  cityLayout: CityLayout;
}

const _obj = new THREE.Object3D();

/**
 * Procedural city decoration: trees and street lamps.
 * Trees line the sidewalks, lamps at intersections.
 */
export default function CityProps({ cityLayout }: CityPropsProps) {
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const treeCanopyRef = useRef<THREE.InstancedMesh>(null);
  const lampPostRef = useRef<THREE.InstancedMesh>(null);
  const lampBulbRef = useRef<THREE.InstancedMesh>(null);

  const { trees, lamps } = useMemo(() => {
    const { buildings, districts } = cityLayout;
    const treePositions: { x: number; z: number; scale: number }[] = [];
    const lampPositions: { x: number; z: number; rotY: number }[] = [];

    // Build occupied set for collision avoidance (buildings + roads)
    const occupied = new Set<string>();
    buildings.forEach((b) => {
      for (let dx = -0.5; dx <= 0.5; dx += 0.5) {
        for (let dz = -0.5; dz <= 0.5; dz += 0.5) {
          occupied.add(`${Math.round((b.x + dx) * 2)},${Math.round((b.z + dz) * 2)}`);
        }
      }
    });

    const isFree = (x: number, z: number) =>
      !occupied.has(`${Math.round(x * 2)},${Math.round(z * 2)}`);

    // Compute city bounds — only place trees within this area
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    districts.forEach((d) => {
      minX = Math.min(minX, d.x - d.width / 2 - 2);
      maxX = Math.max(maxX, d.x + d.width / 2 + 2);
      minZ = Math.min(minZ, d.z - d.depth / 2 - 2);
      maxZ = Math.max(maxZ, d.z + d.depth / 2 + 2);
    });

    const isInCity = (x: number, z: number) =>
      x >= minX && x <= maxX && z >= minZ && z <= maxZ;

    // Place trees along district edges (on sidewalk strips)
    const TREE_SPACING = 3;
    districts.forEach((d) => {
      const hw = d.width / 2;
      const hd = d.depth / 2;

      // Trees along each edge of each district
      for (let t = -hw + 1; t < hw; t += TREE_SPACING + Math.random() * 1.5) {
        const px = d.x + t;
        const topZ = d.z - hd - 0.6;
        const botZ = d.z + hd + 0.6;
        if (isFree(px, topZ) && isInCity(px, topZ))
          treePositions.push({ x: px, z: topZ, scale: 0.4 + Math.random() * 0.5 });
        if (isFree(px, botZ) && isInCity(px, botZ))
          treePositions.push({ x: px, z: botZ, scale: 0.4 + Math.random() * 0.5 });
      }
      for (let t = -hd + 1; t < hd; t += TREE_SPACING + Math.random() * 1.5) {
        const pz = d.z + t;
        const leftX = d.x - hw - 0.6;
        const rightX = d.x + hw + 0.6;
        if (isFree(leftX, pz) && isInCity(leftX, pz))
          treePositions.push({ x: leftX, z: pz, scale: 0.4 + Math.random() * 0.5 });
        if (isFree(rightX, pz) && isInCity(rightX, pz))
          treePositions.push({ x: rightX, z: pz, scale: 0.4 + Math.random() * 0.5 });
      }

      // Lamps at district corners
      const corners = [
        { x: d.x - hw - 0.4, z: d.z - hd - 0.4 },
        { x: d.x + hw + 0.4, z: d.z - hd - 0.4 },
        { x: d.x + hw + 0.4, z: d.z + hd + 0.4 },
        { x: d.x - hw - 0.4, z: d.z + hd + 0.4 },
      ];
      corners.forEach((c) => {
        if (isFree(c.x, c.z))
          lampPositions.push({ ...c, rotY: Math.random() * Math.PI * 2 });
      });
    });

    return {
      trees: treePositions.slice(0, 400),
      lamps: lampPositions.slice(0, 200),
    };
  }, [cityLayout]);

  // Set tree transforms
  useEffect(() => {
    if (!treeTrunkRef.current || !treeCanopyRef.current) return;

    trees.forEach((t, i) => {
      const trunkH = 0.6 * t.scale;
      // Trunk
      _obj.position.set(t.x, trunkH / 2, t.z);
      _obj.scale.set(0.06 * t.scale, trunkH, 0.06 * t.scale);
      _obj.rotation.set(0, 0, 0);
      _obj.updateMatrix();
      treeTrunkRef.current!.setMatrixAt(i, _obj.matrix);
      treeTrunkRef.current!.setColorAt(i, new THREE.Color('#5a3a20'));

      // Canopy (sphere)
      const canopyR = 0.35 * t.scale;
      _obj.position.set(t.x, trunkH + canopyR * 0.7, t.z);
      _obj.scale.set(canopyR, canopyR * 1.1, canopyR);
      _obj.updateMatrix();
      treeCanopyRef.current!.setMatrixAt(i, _obj.matrix);
      // Vary green
      const green = new THREE.Color().setHSL(0.28 + Math.random() * 0.08, 0.5, 0.3 + Math.random() * 0.15);
      treeCanopyRef.current!.setColorAt(i, green);
    });

    treeTrunkRef.current.instanceMatrix.needsUpdate = true;
    if (treeTrunkRef.current.instanceColor) treeTrunkRef.current.instanceColor.needsUpdate = true;
    treeTrunkRef.current.computeBoundingSphere();

    treeCanopyRef.current.instanceMatrix.needsUpdate = true;
    if (treeCanopyRef.current.instanceColor) treeCanopyRef.current.instanceColor.needsUpdate = true;
    treeCanopyRef.current.computeBoundingSphere();
  }, [trees]);

  // Set lamp transforms
  useEffect(() => {
    if (!lampPostRef.current || !lampBulbRef.current) return;

    lamps.forEach((l, i) => {
      const postH = 1.8;
      // Post
      _obj.position.set(l.x, postH / 2, l.z);
      _obj.scale.set(0.04, postH, 0.04);
      _obj.rotation.set(0, 0, 0);
      _obj.updateMatrix();
      lampPostRef.current!.setMatrixAt(i, _obj.matrix);
      lampPostRef.current!.setColorAt(i, new THREE.Color('#3a3a3a'));

      // Bulb / lamp head
      _obj.position.set(l.x, postH + 0.1, l.z);
      _obj.scale.set(0.12, 0.12, 0.12);
      _obj.updateMatrix();
      lampBulbRef.current!.setMatrixAt(i, _obj.matrix);
      lampBulbRef.current!.setColorAt(i, new THREE.Color('#fff8e0'));
    });

    lampPostRef.current.instanceMatrix.needsUpdate = true;
    if (lampPostRef.current.instanceColor) lampPostRef.current.instanceColor.needsUpdate = true;
    lampPostRef.current.computeBoundingSphere();

    lampBulbRef.current.instanceMatrix.needsUpdate = true;
    if (lampBulbRef.current.instanceColor) lampBulbRef.current.instanceColor.needsUpdate = true;
    lampBulbRef.current.computeBoundingSphere();
  }, [lamps]);

  return (
    <group>
      {/* Tree trunks */}
      {trees.length > 0 && (
        <instancedMesh ref={treeTrunkRef} args={[undefined, undefined, trees.length]} frustumCulled={false}>
          <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
          <meshStandardMaterial roughness={0.9} metalness={0} />
        </instancedMesh>
      )}

      {/* Tree canopies */}
      {trees.length > 0 && (
        <instancedMesh ref={treeCanopyRef} args={[undefined, undefined, trees.length]} frustumCulled={false} castShadow>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial roughness={0.85} metalness={0} />
        </instancedMesh>
      )}

      {/* Lamp posts */}
      {lamps.length > 0 && (
        <instancedMesh ref={lampPostRef} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
          <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
          <meshStandardMaterial roughness={0.4} metalness={0.6} />
        </instancedMesh>
      )}

      {/* Lamp bulbs (emissive glow) */}
      {lamps.length > 0 && (
        <instancedMesh ref={lampBulbRef} args={[undefined, undefined, lamps.length]} frustumCulled={false}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            emissive="#ffe8a0"
            emissiveIntensity={1.5}
            roughness={0.2}
            metalness={0}
          />
        </instancedMesh>
      )}
    </group>
  );
}
