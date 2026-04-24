import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

export function EarthCenter() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * 0.06;
  });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshStandardMaterial color="#1e6bff" emissive="#0a3a99" emissiveIntensity={0.4} roughness={0.7} metalness={0.1} wireframe={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.42, 24, 24]} />
        <meshBasicMaterial color="#4ad8ff" wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  );
}
