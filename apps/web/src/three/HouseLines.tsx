import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three';
import { lonToRingPos, NATAL_RING_RADIUS } from './project';

const D2R = Math.PI / 180;

interface Props {
  cusps: number[];
  natalAscRotation: number;
}

/**
 * House cusp lines from origin out to the natal ring radius. House numbers placed midway between cusps.
 * Drawn in the natal frame (rotated so ASC sits at the left).
 */
export function HouseLines({ cusps, natalAscRotation }: Props) {
  const { geo, mat, labels } = useMemo(() => {
    const positions: number[] = [];
    const inner = 4;
    for (let i = 0; i < 12; i++) {
      const lon = cusps[i]!;
      const p = lonToRingPos(lon, NATAL_RING_RADIUS * 0.92);
      const pi = lonToRingPos(lon, inner);
      positions.push(pi.x, pi.y, pi.z);
      positions.push(p.x, p.y, p.z);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const m = new LineBasicMaterial({ color: 0xffd84a, transparent: true, opacity: 0.18 });
    const labels: { num: number; pos: [number, number, number] }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = cusps[i]!;
      const b = cusps[(i + 1) % 12]!;
      let mid = (a + b) / 2;
      // wrap correction
      if (b < a) mid = ((a + b + 360) / 2) % 360;
      const p = lonToRingPos(mid, NATAL_RING_RADIUS * 0.85);
      labels.push({ num: i + 1, pos: [p.x, p.y, p.z] });
    }
    return { geo: g, mat: m, labels };
  }, [cusps]);

  return (
    <group rotation={[0, 0, (180 - natalAscRotation) * D2R]}>
      <lineSegments geometry={geo} material={mat} />
      {labels.map(l => (
        <Text key={l.num} position={l.pos} fontSize={0.7} color="#ffd84a" fillOpacity={0.55} anchorX="center" anchorY="middle">
          {l.num.toString()}
        </Text>
      ))}
    </group>
  );
}
