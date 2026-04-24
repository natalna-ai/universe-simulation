import { useMemo } from 'react';
import { Vector3 } from 'three';
import { Line } from '@react-three/drei';
import { ASPECTS, type BodyPosition } from '@natalna/ephemeris-core';
import { eclipticToCartesian, lonToRingPos, NATAL_RING_RADIUS } from './project';
import type { ActiveAspect } from '../state/liveStore';

interface Props {
  active: ActiveAspect[];
  liveBodies: BodyPosition[];
  natalBodies: BodyPosition[];
  trueScale: boolean;
  maxBeams?: number;
}

export function AspectBeams({ active, liveBodies, natalBodies, trueScale, maxBeams = 30 }: Props) {
  const beams = useMemo(() => {
    const lim = active.slice(0, maxBeams);
    return lim.map(a => {
      const t = liveBodies.find(b => b.id === a.transit);
      const n = natalBodies.find(b => b.id === a.natal);
      if (!t || !n) return null;
      const tPos: Vector3 = eclipticToCartesian(t.lon, t.lat, t.dist, t.id === 'MOON', trueScale);
      const nPos: Vector3 = lonToRingPos(n.lon, NATAL_RING_RADIUS);
      return { id: `${a.transit}-${a.natal}-${a.aspect}`, from: tPos, to: nPos, color: ASPECTS[a.aspect].color, tightness: a.tightness };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [active, liveBodies, natalBodies, trueScale, maxBeams]);

  return (
    <group>
      {beams.map(beam => (
        <Line
          key={beam.id}
          points={[beam.from, beam.to]}
          color={beam.color}
          transparent
          opacity={Math.min(1, 0.25 + beam.tightness * 0.75)}
          lineWidth={1 + beam.tightness * 2.5}
        />
      ))}
    </group>
  );
}
