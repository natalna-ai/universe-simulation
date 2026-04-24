import { useState } from 'react';
import { useApp } from '../state/store';
import { ALL_BODY_IDS, ALL_ASPECTS, BODIES, ASPECTS, HOUSE_SYSTEMS } from '@natalna/ephemeris-core';
import type { BodyId } from '@natalna/ephemeris-core';

type Tab = 'bodies' | 'aspects' | 'visual' | 'birth';

const CATEGORY_GROUPS: { key: string; label: string; ids: BodyId[] }[] = (() => {
  const groups: Record<string, BodyId[]> = {
    'Lights & Classical': [],
    'Modern': [],
    'Nodes & Lilith': [],
    'Centaurs': [],
    'Asteroids': [],
    'TNOs': [],
  };
  for (const id of ALL_BODY_IDS) {
    const cat = BODIES[id].category;
    if (cat === 'lights' || cat === 'classical') groups['Lights & Classical']!.push(id);
    else if (cat === 'modern') groups['Modern']!.push(id);
    else if (cat === 'node' || cat === 'lilith') groups['Nodes & Lilith']!.push(id);
    else if (cat === 'centaur') groups['Centaurs']!.push(id);
    else if (cat === 'asteroid') groups['Asteroids']!.push(id);
    else if (cat === 'tno') groups['TNOs']!.push(id);
  }
  return Object.entries(groups).map(([label, ids]) => ({ key: label, label, ids }));
})();

export function SidePanel() {
  const open = useApp(s => s.sidePanelOpen);
  const setOpen = useApp(s => s.setSidePanelOpen);
  const [tab, setTab] = useState<Tab>('bodies');

  return (
    <>
      <button className={`side-toggle ${open ? 'with-panel' : ''}`} onClick={() => setOpen(!open)}>
        {open ? 'CLOSE' : 'CONFIG'}
      </button>
      <div className={`side-panel ${open ? '' : 'collapsed'}`}>
        <div className="side-panel-tabs">
          <button className={`side-panel-tab ${tab === 'birth' ? 'active' : ''}`} onClick={() => setTab('birth')}>Birth</button>
          <button className={`side-panel-tab ${tab === 'bodies' ? 'active' : ''}`} onClick={() => setTab('bodies')}>Bodies</button>
          <button className={`side-panel-tab ${tab === 'aspects' ? 'active' : ''}`} onClick={() => setTab('aspects')}>Aspects</button>
          <button className={`side-panel-tab ${tab === 'visual' ? 'active' : ''}`} onClick={() => setTab('visual')}>Visual</button>
        </div>
        <div className="side-panel-content">
          {tab === 'birth' && <BirthTab />}
          {tab === 'bodies' && <BodiesTab />}
          {tab === 'aspects' && <AspectsTab />}
          {tab === 'visual' && <VisualTab />}
        </div>
      </div>
    </>
  );
}

function BirthTab() {
  const birth = useApp(s => s.birthForm);
  const setBirth = useApp(s => s.setBirth);
  return (
    <div>
      <h4>NATAL DATA</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, fontSize: 11, alignItems: 'center' }}>
        <span>Label</span>
        <input value={birth.label} onChange={e => setBirth({ label: e.target.value })} />
        <span>UTC</span>
        <input
          type="text"
          value={birth.utc}
          onChange={e => setBirth({ utc: e.target.value })}
          placeholder="1999-01-14T09:55:00.000Z"
        />
        <span>Latitude</span>
        <input type="number" step="0.0001" value={birth.lat} onChange={e => setBirth({ lat: Number(e.target.value) })} />
        <span>Longitude</span>
        <input type="number" step="0.0001" value={birth.lon} onChange={e => setBirth({ lon: Number(e.target.value) })} />
        <span>House Sys.</span>
        <select value={birth.hsys} onChange={e => setBirth({ hsys: e.target.value as typeof birth.hsys })}>
          {HOUSE_SYSTEMS.map(h => <option key={h.id} value={h.id}>{h.id} · {h.name}</option>)}
        </select>
      </div>
      <div style={{ marginTop: 12, fontSize: 10, color: '#8b9cb5' }}>
        Note: Above 66° latitude, Placidus/Koch/etc fall back to Whole Sign automatically.
      </div>
    </div>
  );
}

function BodiesTab() {
  const sceneBodies = useApp(s => s.sceneBodies);
  const aspectBodies = useApp(s => s.aspectBodies);
  const toggleScene = useApp(s => s.toggleSceneBody);
  const toggleAspect = useApp(s => s.toggleAspectBody);

  return (
    <div className="body-list-group">
      <div style={{ display: 'grid', gridTemplateColumns: '16px 1fr 50px 50px', gap: 6, padding: '4px 6px', fontSize: 9, color: '#8b9cb5', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span></span><span>BODY</span><span>SCENE</span><span>ASPECTS</span>
      </div>
      {CATEGORY_GROUPS.map(g => (
        <div key={g.key}>
          <h4>{g.label}</h4>
          {g.ids.map(id => {
            const def = BODIES[id];
            return (
              <div key={id} className="body-list-row">
                <span className="glyph" style={{ color: def.color }}>{def.glyph}</span>
                <span>{def.name}</span>
                <input type="checkbox" checked={sceneBodies.has(id)} onChange={() => toggleScene(id)} />
                <input type="checkbox" checked={aspectBodies.has(id)} onChange={() => toggleAspect(id)} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AspectsTab() {
  const enabled = useApp(s => s.enabledAspects);
  const toggle = useApp(s => s.toggleAspect);
  const orbConfig = useApp(s => s.orbConfig);
  const setOrbConfig = useApp(s => s.setOrbConfig);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '16px 24px 1fr 50px 50px', gap: 6, padding: '4px 6px', fontSize: 9, color: '#8b9cb5', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span>ON</span><span></span><span>ASPECT</span><span>ORB</span><span>S/M ORB</span>
      </div>
      {ALL_ASPECTS.map(id => {
        const def = ASPECTS[id];
        const cfg = orbConfig[id];
        return (
          <div key={id} className="body-list-row" style={{ gridTemplateColumns: '16px 24px 1fr 50px 50px' }}>
            <input type="checkbox" checked={enabled.has(id)} onChange={() => toggle(id)} />
            <span style={{ color: def.color, fontSize: 14 }}>{def.glyph}</span>
            <span>{def.name} <span style={{ color: '#8b9cb5', fontSize: 9 }}>({def.angle}°)</span></span>
            <input
              type="number"
              step="0.5"
              min="0"
              value={cfg.default}
              onChange={e => setOrbConfig({ ...orbConfig, [id]: { ...cfg, default: Number(e.target.value) } })}
              style={{ width: 44, padding: '2px 4px' }}
            />
            <input
              type="number"
              step="0.5"
              min="0"
              value={cfg.sunMoonOverride ?? ''}
              placeholder="—"
              onChange={e => {
                const v = e.target.value === '' ? undefined : Number(e.target.value);
                const next = { ...cfg };
                if (v === undefined) delete next.sunMoonOverride; else next.sunMoonOverride = v;
                setOrbConfig({ ...orbConfig, [id]: next });
              }}
              style={{ width: 44, padding: '2px 4px' }}
            />
          </div>
        );
      })}
      <div style={{ marginTop: 8, fontSize: 10, color: '#8b9cb5' }}>S/M Orb = Sun/Moon override (used when one of the bodies in the pair is Sun or Moon).</div>
    </div>
  );
}

function VisualTab() {
  const visual = useApp(s => s.visual);
  const toggle = useApp(s => s.toggleVisual);
  const items: { k: keyof typeof visual; label: string }[] = [
    { k: 'showOrbitGuides', label: 'Orbit guides' },
    { k: 'showLabels', label: 'Body labels' },
    { k: 'showTrails', label: 'Trajectory trails' },
    { k: 'trueScale', label: 'True scale (raw AU)' },
    { k: 'showZodiacRingNatal', label: 'Natal zodiac ring (yellow, ASC-aligned)' },
    { k: 'showZodiacRingTransit', label: 'Transit zodiac ring (cyan, true sky)' },
    { k: 'showAspectBeams', label: 'Aspect beams' },
    { k: 'showHouses', label: 'House cusp lines' },
    { k: 'showNatalMarkers', label: 'Natal position markers' },
    { k: 'bloomEnabled', label: 'Bloom postprocess' },
    { k: 'showStars', label: 'Star background' },
  ];
  return (
    <div>
      <h4>VISUAL TOGGLES</h4>
      {items.map(it => (
        <label key={it.k} className="checkbox-row">
          <input type="checkbox" checked={visual[it.k]} onChange={() => toggle(it.k)} />
          {it.label}
        </label>
      ))}
      <div style={{ marginTop: 14, padding: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, fontSize: 10, color: '#8b9cb5' }}>
        <strong style={{ color: '#ffd84a' }}>Natal vs Transit:</strong>
        <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
          <li>Yellow rings/glyphs = NATAL (fixed positions on yellow ring at radius 35).</li>
          <li>Cyan/colored spheres = TRANSIT (current sky, animated).</li>
          <li>Click any body for details panel showing which it is.</li>
        </ul>
      </div>
    </div>
  );
}
