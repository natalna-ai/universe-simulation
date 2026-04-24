import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { BODIES, type BodyId, type BodyPosition, formatLongitude } from '@natalna/ephemeris-core';
import { lonToRingPos, NATAL_RING_RADIUS } from './project';
import { useApp } from '../state/store';

interface Props {
  natalBodies: BodyPosition[];
  visibleIds: Set<BodyId>;
}

/**
 * Renders the natal positions as dim outline markers on a fixed-radius ring on the ecliptic.
 * Yellow tint distinguishes natal from cyan transit bodies.
 */
export function NatalRingMarkers({ natalBodies, visibleIds }: Props) {
  const setSelected = useApp(s => s.setSelected);
  const selected = useApp(s => s.selectedBody);
  const showLabels = useApp(s => s.visual.showLabels);

  const items = useMemo(() => natalBodies.filter(b => visibleIds.has(b.id)), [natalBodies, visibleIds]);

  return (
    <group>
      {items.map(b => {
        const pos: Vector3 = lonToRingPos(b.lon, NATAL_RING_RADIUS);
        const def = BODIES[b.id];
        const isSelected = selected?.id === b.id && selected?.kind === 'natal';
        return (
          <group key={b.id} position={pos.toArray()}>
            <mesh
              onClick={(e) => { e.stopPropagation(); setSelected({ id: b.id, kind: 'natal' }); }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
              <ringGeometry args={[0.55, 0.85, 18]} />
              <meshBasicMaterial color={def.color} transparent opacity={isSelected ? 1 : 0.7} />
            </mesh>
            {showLabels && (
              <Html
                center
                distanceFactor={28}
                style={{
                  pointerEvents: 'none',
                  color: '#ffd84a',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9,
                  opacity: 0.6,
                  whiteSpace: 'nowrap',
                  textShadow: '0 0 4px #000',
                  transform: 'translate(0, 16px)',
                }}
              >
                <span>{def.glyph}</span>
                <span style={{ marginLeft: 3 }}>{formatLongitude(b.lon)}</span>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
