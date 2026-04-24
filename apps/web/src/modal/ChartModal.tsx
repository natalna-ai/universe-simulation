import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state/store';
import { useLive } from '../state/liveStore';
import { api } from '../api/client';
import { useQuery } from '@tanstack/react-query';
import { ASPECTS, ALL_ASPECTS, BODIES, SIGNS, formatLongitude, signOfLongitude, signedOrb, effectiveOrb, HOUSE_SYSTEMS } from '@natalna/ephemeris-core';
import type { BodyId, AspectType, NatalChart, BodyPosition } from '@natalna/ephemeris-core';

const SIZE = 720;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 340;
const R_ZODIAC = 308;
const R_HOUSE_RING = 248;
const R_INNER = 180;
const R_BIWHEEL_OUTER = 226;     // transit ring location (between zodiac and house)
const R_NATAL_BODY = 210;
const R_ASPECT_GRID_INNER = 100;

const D2R = Math.PI / 180;

function polar(lonDeg: number, ascDeg: number, r: number): { x: number; y: number } {
  // ASC at the left (180 deg in screen coords). Increasing ecliptic lon goes counter-clockwise.
  const a = (180 - (lonDeg - ascDeg)) * D2R;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
}

interface Props {}

export function ChartModal(_: Props) {
  const open = useApp(s => s.modalOpen);
  const setOpen = useApp(s => s.setModalOpen);
  const mode = useApp(s => s.modalMode);
  const setMode = useApp(s => s.setModalMode);
  const natal = useApp(s => s.natal);
  const liveBodies = useLive(s => s.liveBodies);
  const sceneBodies = useApp(s => s.sceneBodies);
  const orbConfig = useApp(s => s.orbConfig);
  const enabledAspects = useApp(s => s.enabledAspects);
  const birth = useApp(s => s.birthForm);
  const setBirth = useApp(s => s.setBirth);

  const [hsysOverride, setHsysOverride] = useState(birth.hsys);
  useEffect(() => { setHsysOverride(birth.hsys); }, [birth.hsys]);

  // recompute natal chart for the chosen house system on the fly (modal-only)
  const overrideNatal = useQuery({
    queryKey: ['natal-modal', birth.utc, birth.lat, birth.lon, hsysOverride, [...sceneBodies].sort()],
    queryFn: () => api.computeNatal({
      utc: birth.utc, lat: birth.lat, lon: birth.lon, hsys: hsysOverride,
      bodies: [...sceneBodies] as BodyId[],
    }),
    enabled: open && !!natal && hsysOverride !== natal.hsys,
    staleTime: 5 * 60_000,
  });

  const effectiveNatal: NatalChart | null = useMemo(() => {
    if (!natal) return null;
    if (hsysOverride !== natal.hsys && overrideNatal.data) return overrideNatal.data;
    return natal;
  }, [natal, hsysOverride, overrideNatal.data]);

  if (!open || !effectiveNatal) {
    return open ? (
      <div className="modal-overlay" onClick={() => setOpen(false)}>
        <div className="modal-content" style={{ padding: 40 }} onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setOpen(false)}>×</button>
          <div>Computing natal chart...</div>
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setOpen(false)}>×</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: '#4ad8ff', letterSpacing: 2 }}>NATALNA · 2D CHART</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={mode === 'natal' ? 'active' : ''} onClick={() => setMode('natal')}>Natal only</button>
            <button className={mode === 'transit' ? 'active' : ''} onClick={() => setMode('transit')}>Transit only</button>
            <button className={mode === 'biwheel' ? 'active' : ''} onClick={() => setMode('biwheel')}>Bi-wheel</button>
            <span className="mono" style={{ color: '#8b9cb5', fontSize: 10, marginLeft: 12 }}>HOUSE SYS</span>
            <select
              value={hsysOverride}
              onChange={e => {
                const v = e.target.value as typeof birth.hsys;
                setHsysOverride(v);
                setBirth({ hsys: v });
              }}
            >
              {HOUSE_SYSTEMS.map(h => <option key={h.id} value={h.id}>{h.id} · {h.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `${SIZE}px 280px`, gap: 18 }}>
          <ChartSvg
            natal={effectiveNatal}
            transit={mode === 'natal' ? null : liveBodies}
            mode={mode}
            visibleIds={sceneBodies}
            enabledAspects={enabledAspects}
            orbConfig={orbConfig}
          />
          <ChartSummary natal={effectiveNatal} liveBodies={liveBodies} mode={mode} visibleIds={sceneBodies} enabledAspects={enabledAspects} orbConfig={orbConfig} />
        </div>
      </div>
    </div>
  );
}

interface ChartSvgProps {
  natal: NatalChart;
  transit: BodyPosition[] | null;
  mode: 'natal' | 'transit' | 'biwheel';
  visibleIds: Set<BodyId>;
  enabledAspects: Set<AspectType>;
  orbConfig: ReturnType<typeof useApp.getState>['orbConfig'];
}

function ChartSvg({ natal, transit, mode, visibleIds, enabledAspects, orbConfig }: ChartSvgProps) {
  const ascDeg = natal.angles.asc;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} style={{ display: 'block' }}>
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#0a1428" />
          <stop offset="100%" stopColor="#02050a" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={R_OUTER} fill="url(#bg)" />
      <ZodiacWheel ascDeg={ascDeg} />
      <HouseRing natal={natal} />
      {/* aspect lines (natal-natal in inner area) */}
      {(mode !== 'transit') && <AspectLines bodies={natal.bodies.filter(b => visibleIds.has(b.id))} radius={R_ASPECT_GRID_INNER} ascDeg={ascDeg} enabledAspects={enabledAspects} orbConfig={orbConfig} />}
      {/* natal bodies */}
      {(mode === 'natal' || mode === 'biwheel') && natal.bodies.filter(b => visibleIds.has(b.id)).map(b => (
        <BodyMarker key={`n-${b.id}`} body={b} ascDeg={ascDeg} radius={R_NATAL_BODY} variant="natal" />
      ))}
      {/* transit bodies */}
      {(mode === 'transit' || mode === 'biwheel') && transit?.filter(b => visibleIds.has(b.id)).map(b => (
        <BodyMarker key={`t-${b.id}`} body={b} ascDeg={ascDeg} radius={R_BIWHEEL_OUTER + (mode === 'transit' ? -16 : 0)} variant="transit" />
      ))}
      <AnglesLabels natal={natal} />
    </svg>
  );
}

function ZodiacWheel({ ascDeg }: { ascDeg: number }) {
  return (
    <g>
      <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="#4ad8ff" strokeOpacity="0.6" strokeWidth={1.4} />
      <circle cx={CX} cy={CY} r={R_ZODIAC} fill="none" stroke="#4ad8ff" strokeOpacity="0.4" />
      {/* Sign sectors */}
      {SIGNS.map(s => {
        const start = polar(s.startLon, ascDeg, R_OUTER);
        const end = polar(s.startLon, ascDeg, R_ZODIAC);
        return <line key={`b-${s.index}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#4ad8ff" strokeOpacity="0.4" />;
      })}
      {SIGNS.map(s => {
        const mid = polar(s.startLon + 15, ascDeg, (R_OUTER + R_ZODIAC) / 2);
        return (
          <text key={`g-${s.index}`} x={mid.x} y={mid.y + 7} textAnchor="middle" fontSize={20} fill="#ffd84a" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {s.glyph}
          </text>
        );
      })}
      {/* degree ticks every 1 deg */}
      {Array.from({ length: 360 }, (_, i) => i).map(deg => {
        const major = deg % 10 === 0;
        const mid = deg % 5 === 0;
        const r0 = R_ZODIAC;
        const r1 = major ? R_ZODIAC - 12 : mid ? R_ZODIAC - 7 : R_ZODIAC - 4;
        const a = polar(deg, ascDeg, r0);
        const b = polar(deg, ascDeg, r1);
        return <line key={`t-${deg}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#8b9cb5" strokeOpacity={major ? 0.9 : 0.4} strokeWidth={major ? 1 : 0.6} />;
      })}
      {Array.from({ length: 36 }, (_, i) => i * 10).map(deg => {
        const inSign = deg % 30;
        if (inSign === 0) return null;
        const p = polar(deg, ascDeg, R_ZODIAC - 22);
        return <text key={`l-${deg}`} x={p.x} y={p.y + 3} textAnchor="middle" fontSize={9} fill="#8b9cb5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{inSign}</text>;
      })}
    </g>
  );
}

function HouseRing({ natal }: { natal: NatalChart }) {
  const ascDeg = natal.angles.asc;
  return (
    <g>
      <circle cx={CX} cy={CY} r={R_HOUSE_RING} fill="none" stroke="#ffd84a" strokeOpacity="0.3" />
      <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="#ffd84a" strokeOpacity="0.2" />
      {natal.cusps.map((cusp, i) => {
        const a = polar(cusp, ascDeg, R_HOUSE_RING);
        const b = polar(cusp, ascDeg, R_INNER);
        const isAngle = i === 0 || i === 3 || i === 6 || i === 9;
        return <line key={`hc-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ffd84a" strokeOpacity={isAngle ? 0.7 : 0.25} strokeWidth={isAngle ? 1.5 : 0.7} />;
      })}
      {natal.cusps.map((cusp, i) => {
        const next = natal.cusps[(i + 1) % 12]!;
        let mid = (cusp + next) / 2;
        if (next < cusp) mid = ((cusp + next + 360) / 2) % 360;
        const p = polar(mid, ascDeg, R_HOUSE_RING - 16);
        return <text key={`hn-${i}`} x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fill="#ffd84a" fillOpacity={0.6} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{i + 1}</text>;
      })}
    </g>
  );
}

function AnglesLabels({ natal }: { natal: NatalChart }) {
  const ascDeg = natal.angles.asc;
  const labels: { lon: number; text: string; color: string }[] = [
    { lon: natal.angles.asc, text: 'ASC', color: '#4ad8ff' },
    { lon: natal.angles.dsc, text: 'DSC', color: '#4ad8ff' },
    { lon: natal.angles.mc, text: 'MC', color: '#ff9b3b' },
    { lon: natal.angles.ic, text: 'IC', color: '#ff9b3b' },
  ];
  return (
    <g>
      {labels.map((l, i) => {
        const p = polar(l.lon, ascDeg, R_OUTER + 18);
        return <text key={i} x={p.x} y={p.y + 3} textAnchor="middle" fontSize={11} fill={l.color} style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{l.text}</text>;
      })}
    </g>
  );
}

function BodyMarker({ body, ascDeg, radius, variant }: { body: BodyPosition; ascDeg: number; radius: number; variant: 'natal' | 'transit' }) {
  const def = BODIES[body.id];
  const p = polar(body.lon, ascDeg, radius);
  const labelP = polar(body.lon, ascDeg, radius - 22);
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={3} fill={variant === 'natal' ? '#ffd84a' : def.color} />
      <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={16} fill={variant === 'natal' ? '#ffd84a' : def.color} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{def.glyph}</text>
      <text x={labelP.x} y={labelP.y + 3} textAnchor="middle" fontSize={8} fill="#e6f1ff" fillOpacity={0.7} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
        {formatLongitude(body.lon)}{body.retro ? ' R' : ''}
      </text>
    </g>
  );
}

function AspectLines({ bodies, radius, ascDeg, enabledAspects, orbConfig }: { bodies: BodyPosition[]; radius: number; ascDeg: number; enabledAspects: Set<AspectType>; orbConfig: ReturnType<typeof useApp.getState>['orbConfig'] }) {
  const lines: JSX.Element[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i]!, b = bodies[j]!;
      for (const id of enabledAspects) {
        const orb = effectiveOrb(id, a.id, b.id, orbConfig);
        const so = signedOrb(a.lon, b.lon, ASPECTS[id].angle);
        if (Math.abs(so) < orb) {
          const pa = polar(a.lon, ascDeg, radius);
          const pb = polar(b.lon, ascDeg, radius);
          const tightness = 1 - Math.abs(so) / orb;
          lines.push(<line key={`${i}-${j}-${id}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={ASPECTS[id].color} strokeOpacity={0.25 + tightness * 0.7} strokeWidth={0.6 + tightness * 1.4} />);
        }
      }
    }
  }
  return <g>{lines}</g>;
}

function ChartSummary({ natal, liveBodies, mode, visibleIds, enabledAspects, orbConfig }: { natal: NatalChart; liveBodies: BodyPosition[]; mode: 'natal' | 'transit' | 'biwheel'; visibleIds: Set<BodyId>; enabledAspects: Set<AspectType>; orbConfig: ReturnType<typeof useApp.getState>['orbConfig'] }) {
  const sourceBodies = mode === 'transit' ? liveBodies : natal.bodies;
  const bodies = sourceBodies.filter(b => visibleIds.has(b.id));
  return (
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, maxHeight: SIZE, overflowY: 'auto' }}>
      <h3 style={{ marginTop: 0, color: '#4ad8ff' }}>POSITIONS · {mode.toUpperCase()}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#8b9cb5', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <th style={{ textAlign: 'left' }}>BODY</th>
            <th style={{ textAlign: 'left' }}>POS</th>
            <th>HSE</th>
          </tr>
        </thead>
        <tbody>
          {bodies.map(b => {
            const sign = signOfLongitude(b.lon);
            return (
              <tr key={b.id}>
                <td style={{ color: BODIES[b.id].color }}>{BODIES[b.id].glyph} {b.id}</td>
                <td>{sign.glyph} {formatLongitude(b.lon)} {b.retro ? <span style={{ color: '#ff5b5b' }}>R</span> : ''}</td>
                <td style={{ textAlign: 'center', color: '#ffd84a' }}>{b.house ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h3 style={{ color: '#4ad8ff' }}>ANGLES</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <span>ASC</span><span>{formatLongitude(natal.angles.asc)}</span>
        <span>MC</span><span>{formatLongitude(natal.angles.mc)}</span>
        <span>DSC</span><span>{formatLongitude(natal.angles.dsc)}</span>
        <span>IC</span><span>{formatLongitude(natal.angles.ic)}</span>
        <span>VTX</span><span>{formatLongitude(natal.angles.vertex)}</span>
        <span>EP</span><span>{formatLongitude(natal.angles.eastPoint)}</span>
      </div>
      <h3 style={{ color: '#4ad8ff' }}>ASPECT GRID (NATAL)</h3>
      <AspectGrid bodies={natal.bodies.filter(b => visibleIds.has(b.id))} enabledAspects={enabledAspects} orbConfig={orbConfig} />
      <h3 style={{ color: '#4ad8ff' }}>SECT</h3>
      <div>{natal.sect === 'day' ? '☀ DAY chart' : '☾ NIGHT chart'}</div>
    </div>
  );
}

function AspectGrid({ bodies, enabledAspects, orbConfig }: { bodies: BodyPosition[]; enabledAspects: Set<AspectType>; orbConfig: ReturnType<typeof useApp.getState>['orbConfig'] }) {
  const used = bodies.slice(0, 14);
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: 8 }}>
      <thead>
        <tr>
          <th></th>
          {used.map(b => <th key={b.id} style={{ color: BODIES[b.id].color, padding: 2 }}>{BODIES[b.id].glyph}</th>)}
        </tr>
      </thead>
      <tbody>
        {used.map((a, i) => (
          <tr key={a.id}>
            <td style={{ color: BODIES[a.id].color, padding: 2 }}>{BODIES[a.id].glyph}</td>
            {used.map((b, j) => {
              if (j >= i) return <td key={b.id} style={{ padding: 2, color: '#333' }}>{j === i ? '·' : ''}</td>;
              for (const id of ALL_ASPECTS) {
                if (!enabledAspects.has(id)) continue;
                const orb = effectiveOrb(id, a.id, b.id, orbConfig);
                const so = signedOrb(a.lon, b.lon, ASPECTS[id].angle);
                if (Math.abs(so) < orb) {
                  return <td key={b.id} style={{ padding: 2, color: ASPECTS[id].color, textAlign: 'center' }} title={`${id} ${so.toFixed(1)}°`}>{ASPECTS[id].glyph}</td>;
                }
              }
              return <td key={b.id}></td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
