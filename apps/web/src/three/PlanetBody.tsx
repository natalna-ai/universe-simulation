import { useMemo, useRef } from 'react';
import { Vector3, Mesh } from 'three';
import { Html } from '@react-three/drei';
import { BODIES, type BodyId, formatLongitude } from '@natalna/ephemeris-core';
import { eclipticToCartesian } from './project';
import { useApp } from '../state/store';

interface Props {
  id: BodyId;
  lon: number;
  lat: number;
  dist: number;
  retro: boolean;
  showLabel: boolean;
  trueScale: boolean;
  kind: 'transit' | 'natal';
}

export function PlanetBody({ id, lon, lat, dist, retro, showLabel, trueScale, kind }: Props) {
  const def = BODIES[id];
  const meshRef = useRef<Mesh>(null);
  const setSelected = useApp(s => s.setSelected);
  const selected = useApp(s => s.selectedBody);
  const isMoon = id === 'MOON';
  const pos: Vector3 = useMemo(
    () => eclipticToCartesian(lon, lat, dist, isMoon, trueScale),
    [lon, lat, dist, isMoon, trueScale],
  );

  const isSelected = selected?.id === id && selected?.kind === kind;
  const radius = def.visualRadius * (kind === 'natal' ? 0.55 : 1);
  const emissive = kind === 'transit' ? def.color : '#777';
  const emissiveIntensity = isSelected ? 1.2 : (kind === 'transit' ? 0.5 : 0.15);

  return (
    <group position={pos.toArray()}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); setSelected({ id, kind }); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[radius, 18, 18]} />
        <meshStandardMaterial color={def.color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.6} metalness={0.1} />
      </mesh>
      {isSelected && (
        <mesh>
          <ringGeometry args={[radius * 1.5, radius * 1.7, 32]} />
          <meshBasicMaterial color="#4ad8ff" transparent opacity={0.8} />
        </mesh>
      )}
      {showLabel && (
        <Html
          center
          distanceFactor={kind === 'natal' ? 30 : 20}
          style={{
            pointerEvents: 'none',
            color: kind === 'natal' ? '#ffd84a' : def.color,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: kind === 'natal' ? 9 : 11,
            opacity: kind === 'natal' ? 0.7 : 1,
            whiteSpace: 'nowrap',
            textShadow: '0 0 4px #000',
            transform: 'translate(0, -22px)',
          }}
        >
          <span style={{ marginRight: 4 }}>{def.glyph}</span>
          <span>{formatLongitude(lon)}</span>
          {retro && <span style={{ color: '#ff5b5b', marginLeft: 4 }}>R</span>}
        </Html>
      )}
    </group>
  );
}
