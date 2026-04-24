import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three';

export function EclipticGrid({ radius = 60 }: { radius?: number }) {
  const { lineGeo, mat } = useMemo(() => {
    const segments = 80;
    const positions: number[] = [];
    // concentric rings
    for (let r = 6; r <= radius; r += 6) {
      for (let i = 0; i < segments; i++) {
        const a0 = (i / segments) * Math.PI * 2;
        const a1 = ((i + 1) / segments) * Math.PI * 2;
        positions.push(r * Math.cos(a0), r * Math.sin(a0), 0);
        positions.push(r * Math.cos(a1), r * Math.sin(a1), 0);
      }
    }
    // radial spokes every 30 deg
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2;
      positions.push(0, 0, 0);
      positions.push(radius * Math.cos(a), radius * Math.sin(a), 0);
    }
    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const mat = new LineBasicMaterial({ color: 0x4ad8ff, transparent: true, opacity: 0.08 });
    return { lineGeo, mat };
  }, [radius]);
  return <lineSegments geometry={lineGeo} material={mat} />;
}
