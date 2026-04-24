import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, type Vector3 } from 'three';
import { BODIES, type BodyId } from '@natalna/ephemeris-core';
import { useLive } from '../state/liveStore';

export function Trails() {
  const trails = useLive(s => s.trails);
  const items = useMemo(() => {
    const out: { id: BodyId; geo: BufferGeometry; mat: LineBasicMaterial }[] = [];
    for (const [id, points] of trails) {
      if (points.length < 2) continue;
      const positions: number[] = [];
      // pairwise segments to use lineSegments
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i]! as Vector3;
        const p1 = points[i + 1]! as Vector3;
        positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
      }
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(positions, 3));
      const m = new LineBasicMaterial({ color: BODIES[id].color, transparent: true, opacity: 0.5 });
      out.push({ id, geo: g, mat: m });
    }
    return out;
  }, [trails]);
  return (
    <group>
      {items.map(it => <lineSegments key={it.id} geometry={it.geo} material={it.mat} />)}
    </group>
  );
}
