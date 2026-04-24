import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three';
import { BODIES, type BodyId, type BodyPosition } from '@natalna/ephemeris-core';
import { distanceScale } from './project';

interface Props {
  liveBodies: BodyPosition[];
  visibleIds: Set<BodyId>;
  trueScale: boolean;
}

/**
 * Draws faint circles at each body's current geocentric distance. Lightweight visual hint
 * (real planet orbits aren't perfect circles around Earth, but this matches the chart aesthetic).
 */
export function OrbitGuides({ liveBodies, visibleIds, trueScale }: Props) {
  const items = useMemo(() => {
    const segments = 96;
    return liveBodies.filter(b => visibleIds.has(b.id) && b.id !== 'MOON').map(b => {
      const r = distanceScale(b.dist, false, trueScale);
      const positions: number[] = [];
      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2;
        const a1 = ((i + 1) / segments) * Math.PI * 2;
        positions.push(r * Math.cos(a0), r * Math.sin(a0), 0);
        positions.push(r * Math.cos(a1), r * Math.sin(a1), 0);
      }
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(positions, 3));
      const m = new LineBasicMaterial({ color: BODIES[b.id].color, transparent: true, opacity: 0.12 });
      return { id: b.id, geo: g, mat: m };
    });
  }, [liveBodies, visibleIds, trueScale]);

  return (
    <group>
      {items.map(it => <lineSegments key={it.id} geometry={it.geo} material={it.mat} />)}
    </group>
  );
}
