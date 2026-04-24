import { useApp } from '../state/store';
import { useLive } from '../state/liveStore';
import { ASPECTS, BODIES, formatLongitude, signOfLongitude, degreeInSign } from '@natalna/ephemeris-core';

export function PlanetDetail() {
  const sel = useApp(s => s.selectedBody);
  const setSel = useApp(s => s.setSelected);
  const natal = useApp(s => s.natal);
  const liveBodies = useLive(s => s.liveBodies);
  const active = useLive(s => s.active);

  if (!sel) return null;

  const def = BODIES[sel.id];
  let lon: number, lat: number, dist: number, speed: number, retro: boolean, house: number | undefined;
  if (sel.kind === 'natal') {
    const n = natal?.bodies.find(b => b.id === sel.id);
    if (!n) return null;
    ({ lon, lat, dist, speed, retro, house } = n);
  } else {
    const t = liveBodies.find(b => b.id === sel.id);
    if (!t) return null;
    ({ lon, lat, dist, speed, retro, house } = t);
  }

  const sign = signOfLongitude(lon);
  const { deg, min, sec } = degreeInSign(lon);

  const relatedAspects = active.filter(a => a.transit === sel.id || a.natal === sel.id);

  return (
    <div className="hud-panel" style={{ position: 'absolute', top: 50, left: 18 + 280, width: 290, zIndex: 12 }}>
      <button className="modal-close" onClick={() => setSel(null)} style={{ position: 'absolute', top: 6, right: 6, padding: '2px 8px', fontSize: 10 }}>×</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 28, color: def.color }}>{def.glyph}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{def.name}</div>
          <div style={{ fontSize: 10, color: sel.kind === 'natal' ? '#ffd84a' : '#4ad8ff', textTransform: 'uppercase', letterSpacing: 1 }}>
            {sel.kind === 'natal' ? '◇ NATAL' : '● TRANSIT'}
          </div>
        </div>
      </div>
      <div className={`detail-card ${sel.kind}`}>
        <div className="kv-grid">
          <div className="k">Longitude</div><div className="v">{formatLongitude(lon)}</div>
          <div className="k">Sign</div><div className="v">{sign.glyph} {sign.name} ({sign.element}/{sign.modality})</div>
          <div className="k">Deg in sign</div><div className="v">{deg}° {min}' {sec}"</div>
          <div className="k">Latitude</div><div className="v">{lat.toFixed(4)}°</div>
          <div className="k">Distance</div><div className="v">{dist.toFixed(4)} AU</div>
          <div className="k">Speed</div><div className="v">{speed.toFixed(4)} °/day {retro ? '(R)' : ''}</div>
          <div className="k">House</div><div className="v">{house ?? '—'}</div>
          <div className="k">Ruler</div><div className="v">{sign.ruler}</div>
        </div>
      </div>
      {relatedAspects.length > 0 && (
        <>
          <h3 style={{ marginTop: 12 }}>ACTIVE ASPECTS</h3>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {relatedAspects.map((a, i) => {
              const other = a.transit === sel.id ? a.natal : a.transit;
              const otherKind = a.transit === sel.id ? 'natal' : 'transit';
              return (
                <div key={i} className="event-row active">
                  <span>
                    <span style={{ color: ASPECTS[a.aspect].color }}>{ASPECTS[a.aspect].glyph} {a.aspect}</span>
                    <span style={{ color: '#8b9cb5', margin: '0 4px' }}>↔</span>
                    <span style={{ color: otherKind === 'natal' ? '#ffd84a' : BODIES[other]?.color ?? '#fff' }}>
                      {BODIES[other]?.glyph} {other} ({otherKind})
                    </span>
                  </span>
                  <span style={{ fontSize: 9, color: '#8b9cb5' }}>orb {a.orb.toFixed(2)}°</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
