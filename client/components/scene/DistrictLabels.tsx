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
          {/* District boundary indicator */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[district.width - 0.5, district.depth - 0.5]} />
            <meshStandardMaterial
              color="#4a5568"
              transparent
              opacity={0.2}
              roughness={1}
            />
          </mesh>

          {/* District label */}
          <Text
            position={[0, 0.15, -district.depth / 2 + 0.5]}
            fontSize={0.5}
            color="#a0b0c0"
            anchorX="center"
            anchorY="bottom"
            maxWidth={district.width}
          >
            {district.name === '/' ? 'root' : district.name}
          </Text>
        </group>
      ))}
    </group>
  );
}
