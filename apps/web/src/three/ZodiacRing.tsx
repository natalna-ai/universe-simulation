import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three';
import { SIGNS } from '@natalna/ephemeris-core';

interface Props {
  radius: number;
  natalAscRotation?: number;        // deg, if provided rotates so ASC sits at left (180 deg)
  variant: 'natal' | 'transit';
}

const D2R = Math.PI / 180;

/**
 * Draws a 12-sign ring at a given radius. For natal variant, optionally rotates so ASC is at left.
 */
export function ZodiacRing({ radius, natalAscRotation, variant }: Props) {
  const color = variant === 'natal' ? '#ffd84a' : '#4ad8ff';
  const segments = 240;

  const { ringGeo, ringMat } = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      positions.push(radius * Math.cos(a0), radius * Math.sin(a0), 0);
      positions.push(radius * Math.cos(a1), radius * Math.sin(a1), 0);
    }
    // sign boundary spokes (every 30 deg)
    const inner = radius * 0.95;
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2;
      positions.push(inner * Math.cos(a), inner * Math.sin(a), 0);
      positions.push(radius * Math.cos(a), radius * Math.sin(a), 0);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const m = new LineBasicMaterial({ color, transparent: true, opacity: variant === 'natal' ? 0.45 : 0.3 });
    return { ringGeo: g, ringMat: m };
  }, [radius, color, variant]);

  // For natal: rotate so ASC sits at 180 deg (left side, traditional chart layout)
  // For transit: no rotation, true sky orientation (0 Aries at +X)
  const rotationZ = natalAscRotation !== undefined
    ? (180 - natalAscRotation) * D2R
    : 0;

  return (
    <group rotation={[0, 0, rotationZ]}>
      <lineSegments geometry={ringGeo} material={ringMat} />
      {SIGNS.map(sign => {
        const center = (sign.startLon + 15) * D2R;
        const r = radius * 1.04;
        return (
          <Text
            key={sign.index}
            position={[r * Math.cos(center), r * Math.sin(center), 0]}
            fontSize={1.4}
            color={color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000"
          >
            {sign.glyph}
          </Text>
        );
      })}
    </group>
  );
}
