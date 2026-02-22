'use client';

import { Text } from '@react-three/drei';
import { District as DistrictType } from '../../types';

interface DistrictLabelsProps {
  districts: DistrictType[];
}

export default function DistrictLabels({ districts }: DistrictLabelsProps) {
  return (
    <group>
      {districts.map((district) => {
        const label = district.name === '/' ? 'root' : district.name;
        // Banner height scales slightly with district importance
        const poleH = 3.5;
        const bannerW = Math.max(1.6, Math.min(label.length * 0.32 + 0.6, 5));
        const bannerH = 0.6;
        const bannerY = poleH + bannerH / 2;
        const bannerZ = -district.depth / 2 + 0.3;

        return (
          <group key={district.name} position={[district.x, 0, district.z]}>
            {/* Pole */}
            <mesh position={[0, poleH / 2, bannerZ]}>
              <cylinderGeometry args={[0.03, 0.03, poleH, 6]} />
              <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Banner board background */}
            <mesh position={[0, bannerY, bannerZ]}>
              <boxGeometry args={[bannerW, bannerH, 0.06]} />
              <meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.1} />
            </mesh>

            {/* Banner border — subtle lighter frame */}
            <mesh position={[0, bannerY, bannerZ + 0.035]}>
              <boxGeometry args={[bannerW + 0.08, bannerH + 0.08, 0.01]} />
              <meshStandardMaterial color="#3a3a5a" roughness={0.4} metalness={0.2} />
            </mesh>

            {/* Text on the banner */}
            <Text
              position={[0, bannerY, bannerZ + 0.06]}
              fontSize={0.3}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              maxWidth={bannerW - 0.3}
              outlineWidth={0.008}
              outlineColor="#000000"
              font={undefined}
            >
              {label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
