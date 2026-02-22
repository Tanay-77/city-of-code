'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CityLayout, RoadSegment } from '../../types';

interface CityTrafficProps {
  cityLayout: CityLayout;
}

const _obj = new THREE.Object3D();
const _color = new THREE.Color();

/* ── Car colors ── */
const CAR_COLORS = [
  '#c0392b', '#2980b9', '#f1c40f', '#2ecc71', '#ecf0f1',
  '#1a1a1a', '#7f8c8d', '#e67e22', '#8e44ad', '#d4d4d4',
];

/* ── Dimensions ── */
const CAR_W = 0.28;      // width (across road)
const CAR_H = 0.18;      // height
const CAR_L = 0.5;       // length (along road)
const PERSON_H = 0.32;   // height
const PERSON_W = 0.08;   // body width

/* ── Speeds ── */
const CAR_SPEED_MIN = 0.6;
const CAR_SPEED_MAX = 1.8;
const PERSON_SPEED_MIN = 0.1;
const PERSON_SPEED_MAX = 0.35;

interface CarData {
  roadIdx: number;      // which road this car drives on
  isVertical: boolean;
  lane: number;         // offset from road center (-1 or 1)
  t: number;            // parametric position along road (0-1)
  speed: number;        // units per second
  colorIdx: number;
}

interface PersonData {
  roadIdx: number;
  isVertical: boolean;
  side: number;         // which sidewalk side (-1 or 1)
  t: number;
  speed: number;
  skinIdx: number;
}

export default function CityTraffic({ cityLayout }: CityTrafficProps) {
  const carBodyRef = useRef<THREE.InstancedMesh>(null);
  const carRoofRef = useRef<THREE.InstancedMesh>(null);
  const personBodyRef = useRef<THREE.InstancedMesh>(null);
  const personHeadRef = useRef<THREE.InstancedMesh>(null);

  const carsRef = useRef<CarData[]>([]);
  const peopleRef = useRef<PersonData[]>([]);

  const { roads } = cityLayout;

  // Separate road types
  const roadList = useMemo(() => {
    const v = roads.filter((r) => r.depth > r.width);
    const h = roads.filter((r) => r.width >= r.depth);
    return [...v, ...h];
  }, [roads]);

  // Generate initial car and person positions
  const { carCount, personCount } = useMemo(() => {
    // Seeded PRNG
    let rng = roadList.length * 137 + 42;
    const rand = () => {
      rng = (rng * 16807 + 0) % 2147483647;
      return (rng & 0x7fffffff) / 0x7fffffff;
    };

    const cars: CarData[] = [];
    const people: PersonData[] = [];

    // Place cars on each road — density based on road length
    roadList.forEach((road, idx) => {
      const isV = road.depth > road.width;
      const span = isV ? road.depth : road.width;
      const numCars = Math.min(Math.floor(span / 12) + 1, 3);

      for (let c = 0; c < numCars; c++) {
        const lane = rand() > 0.5 ? 1 : -1;
        const speed = (CAR_SPEED_MIN + rand() * (CAR_SPEED_MAX - CAR_SPEED_MIN)) * lane;
        cars.push({
          roadIdx: idx,
          isVertical: isV,
          lane,
          t: rand(),
          speed,
          colorIdx: Math.floor(rand() * CAR_COLORS.length),
        });
      }

      // People on sidewalks
      const numPeople = Math.min(Math.floor(span / 15) + 1, 3);
      for (let p = 0; p < numPeople; p++) {
        const side = rand() > 0.5 ? 1 : -1;
        const speed = (PERSON_SPEED_MIN + rand() * (PERSON_SPEED_MAX - PERSON_SPEED_MIN)) * side;
        people.push({
          roadIdx: idx,
          isVertical: isV,
          side,
          t: rand(),
          speed,
          skinIdx: Math.floor(rand() * 4),
        });
      }
    });

    carsRef.current = cars.slice(0, 80);
    peopleRef.current = people.slice(0, 100);

    return {
      carCount: carsRef.current.length,
      personCount: peopleRef.current.length,
    };
  }, [roadList]);

  // Skin palette for people
  const skinColors = useMemo(() => [
    new THREE.Color('#f5d0a9'),
    new THREE.Color('#d4a574'),
    new THREE.Color('#8d5524'),
    new THREE.Color('#c68642'),
  ], []);

  // Shirt colors for people bodies
  const shirtColors = useMemo(() => [
    new THREE.Color('#3498db'),
    new THREE.Color('#e74c3c'),
    new THREE.Color('#2ecc71'),
    new THREE.Color('#f39c12'),
    new THREE.Color('#9b59b6'),
    new THREE.Color('#1abc9c'),
    new THREE.Color('#ecf0f1'),
    new THREE.Color('#34495e'),
  ], []);

  // Set initial car colors
  useEffect(() => {
    if (!carBodyRef.current || !carRoofRef.current) return;

    carsRef.current.forEach((car, i) => {
      _color.set(CAR_COLORS[car.colorIdx]);
      carBodyRef.current!.setColorAt(i, _color);
      // Roof slightly darker
      _color.offsetHSL(0, 0, -0.08);
      carRoofRef.current!.setColorAt(i, _color);
    });

    if (carBodyRef.current.instanceColor) carBodyRef.current.instanceColor.needsUpdate = true;
    if (carRoofRef.current.instanceColor) carRoofRef.current.instanceColor.needsUpdate = true;
  }, [carCount]);

  // Set initial person colors
  useEffect(() => {
    if (!personBodyRef.current || !personHeadRef.current) return;

    peopleRef.current.forEach((person, i) => {
      // Body = shirt color
      personBodyRef.current!.setColorAt(i, shirtColors[i % shirtColors.length]);
      // Head = skin color
      personHeadRef.current!.setColorAt(i, skinColors[person.skinIdx]);
    });

    if (personBodyRef.current.instanceColor) personBodyRef.current.instanceColor.needsUpdate = true;
    if (personHeadRef.current.instanceColor) personHeadRef.current.instanceColor.needsUpdate = true;
  }, [personCount, skinColors, shirtColors]);

  // Animate every frame
  useFrame((_, delta) => {
    if (!carBodyRef.current || !carRoofRef.current) return;
    if (!personBodyRef.current || !personHeadRef.current) return;

    const dt = Math.min(delta, 0.05); // clamp delta to avoid huge jumps

    // ── Update cars ──
    carsRef.current.forEach((car, i) => {
      const road = roadList[car.roadIdx];
      if (!road) return;

      const isV = car.isVertical;
      const span = isV ? road.depth : road.width;
      const halfSpan = span / 2;

      // Advance parametric position
      car.t += (car.speed * dt) / span;
      // Wrap around
      if (car.t > 1) car.t -= 1;
      if (car.t < 0) car.t += 1;

      // World position along the full road
      const along = -halfSpan + car.t * span;
      // Lane offset uses the NARROW dimension (cross-section width of road)
      const crossWidth = isV ? road.width : road.depth;
      const laneOffset = car.lane * (crossWidth * 0.2);

      let wx: number, wz: number, rotY: number;
      if (isV) {
        wx = road.x + laneOffset;
        wz = road.z + along;
        rotY = car.speed > 0 ? 0 : Math.PI;
      } else {
        wx = road.x + along;
        wz = road.z + laneOffset;
        rotY = car.speed > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      const wy = 0.08 + CAR_H / 2; // on top of road surface

      // Car body
      _obj.position.set(wx, wy, wz);
      _obj.rotation.set(0, rotY, 0);
      _obj.scale.set(CAR_W, CAR_H, CAR_L);
      _obj.updateMatrix();
      carBodyRef.current!.setMatrixAt(i, _obj.matrix);

      // Car roof (smaller box on top)
      _obj.position.set(wx, wy + CAR_H * 0.45, wz);
      _obj.rotation.set(0, rotY, 0);
      _obj.scale.set(CAR_W * 0.75, CAR_H * 0.5, CAR_L * 0.55);
      _obj.updateMatrix();
      carRoofRef.current!.setMatrixAt(i, _obj.matrix);
    });

    carBodyRef.current.instanceMatrix.needsUpdate = true;
    carRoofRef.current.instanceMatrix.needsUpdate = true;

    // ── Update people ──
    peopleRef.current.forEach((person, i) => {
      const road = roadList[person.roadIdx];
      if (!road) return;

      const isV = person.isVertical;
      const span = isV ? road.depth : road.width;
      const halfSpan = span / 2;

      // Advance
      person.t += (person.speed * dt) / span;
      if (person.t > 1) person.t -= 1;
      if (person.t < 0) person.t += 1;

      const along = -halfSpan + person.t * span;
      // Place on sidewalk (outside road edge)
      const SW = 0.3; // sidewalk width
      const edgeOffset = (isV ? road.width : road.depth) / 2 + SW * 0.5;
      const sideOffset = person.side * edgeOffset;

      let wx: number, wz: number, rotY: number;
      if (isV) {
        wx = road.x + sideOffset;
        wz = road.z + along;
        rotY = person.speed > 0 ? 0 : Math.PI;
      } else {
        wx = road.x + along;
        wz = road.z + sideOffset;
        rotY = person.speed > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      const wy = 0.12; // on sidewalk surface

      // Slight walk wobble
      const wobble = Math.sin(person.t * span * 8 + i) * 0.02;

      // Body (tall thin box)
      _obj.position.set(wx, wy + PERSON_H * 0.4, wz);
      _obj.rotation.set(0, rotY, wobble);
      _obj.scale.set(PERSON_W, PERSON_H * 0.6, PERSON_W * 0.7);
      _obj.updateMatrix();
      personBodyRef.current!.setMatrixAt(i, _obj.matrix);

      // Head (small sphere-ish box)
      _obj.position.set(wx, wy + PERSON_H * 0.8, wz);
      _obj.rotation.set(0, rotY, 0);
      _obj.scale.set(PERSON_W * 0.7, PERSON_W * 0.7, PERSON_W * 0.7);
      _obj.updateMatrix();
      personHeadRef.current!.setMatrixAt(i, _obj.matrix);
    });

    personBodyRef.current.instanceMatrix.needsUpdate = true;
    personHeadRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* ── Car bodies ── */}
      {carCount > 0 && (
        <instancedMesh
          ref={carBodyRef}
          args={[undefined, undefined, carCount]}
          frustumCulled={false}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.4} metalness={0.3} />
        </instancedMesh>
      )}

      {/* ── Car roofs ── */}
      {carCount > 0 && (
        <instancedMesh
          ref={carRoofRef}
          args={[undefined, undefined, carCount]}
          frustumCulled={false}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.3} metalness={0.1} />
        </instancedMesh>
      )}

      {/* ── Person bodies ── */}
      {personCount > 0 && (
        <instancedMesh
          ref={personBodyRef}
          args={[undefined, undefined, personCount]}
          frustumCulled={false}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.8} metalness={0} />
        </instancedMesh>
      )}

      {/* ── Person heads ── */}
      {personCount > 0 && (
        <instancedMesh
          ref={personHeadRef}
          args={[undefined, undefined, personCount]}
          frustumCulled={false}
        >
          <sphereGeometry args={[1, 6, 5]} />
          <meshStandardMaterial roughness={0.7} metalness={0} />
        </instancedMesh>
      )}
    </group>
  );
}
