'use client';

import { Text } from '@react-three/drei';
import { District as DistrictType } from '../../types';

interface DistrictLabelsProps {
  districts: DistrictType[];
}

export default function DistrictLabels({ districts }: DistrictLabelsProps) {
  return (
    <group>
      {districts.map((district) => (
        <group key={district.name} position={[district.x, 0.05, district.z]}>
          {/* District label */}
          <Text
            position={[0, 0.15, -district.depth / 2 + 0.5]}
            fontSize={0.55}
            color="#e0e8f0"
            anchorX="center"
            anchorY="bottom"
            maxWidth={district.width}
            outlineWidth={0.02}
            outlineColor="#2a2a2a"
          >
            {district.name === '/' ? 'root' : district.name}
          </Text>
        </group>
      ))}
    </group>
  );
}
