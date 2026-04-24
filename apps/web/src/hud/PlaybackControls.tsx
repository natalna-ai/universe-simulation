import { useApp, type TimeScale } from '../state/store';

const SCALES: { id: TimeScale; label: string }[] = [
  { id: 'minute', label: '1 min/sec' },
  { id: 'hour',   label: '1 hour/sec' },
  { id: 'day',    label: '1 day/sec' },
  { id: 'week',   label: '1 week/sec' },
  { id: 'month',  label: '1 month/sec' },
];

const MULTS = [1, 5, 20];

export function PlaybackControls() {
  const playing = useApp(s => s.playing);
  const setPlaying = useApp(s => s.setPlaying);
  const speed = useApp(s => s.speedMultiplier);
  const setSpeed = useApp(s => s.setSpeedMultiplier);
  const timeScale = useApp(s => s.timeScale);
  const setTimeScale = useApp(s => s.setTimeScale);
  const setSimTimeMs = useApp(s => s.setSimTimeMs);
  const natal = useApp(s => s.natal);
  const setModalOpen = useApp(s => s.setModalOpen);
  const visual = useApp(s => s.visual);
  const toggleVisual = useApp(s => s.toggleVisual);
  const autoPause = useApp(s => s.autoPauseOnEvents);
  const setAutoPause = useApp(s => s.setAutoPauseOnEvents);

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 380, padding: 16, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: 1, color: '#8b9cb5' }}>MISSION PLAYBACK</div>
        <button className="primary" onClick={() => setPlaying(!playing)}>{playing ? '❚❚ Pause' : '▶ Play'}</button>
        <button onClick={() => setSimTimeMs(Date.now())}>Reset to Now</button>
        <button onClick={() => natal && setSimTimeMs(Date.parse(natal.utc))} disabled={!natal}>To Birth</button>

        <span className="mono" style={{ color: '#8b9cb5', fontSize: 9, marginLeft: 8 }}>SPEED</span>
        {MULTS.map(m => (
          <button key={m} className={speed === m ? 'active' : ''} onClick={() => setSpeed(m)}>{m}x</button>
        ))}
        <input
          type="number"
          min={0.1}
          step={0.5}
          value={speed}
          onChange={e => setSpeed(Math.max(0.1, Number(e.target.value)))}
          style={{ width: 64 }}
        />

        <span className="mono" style={{ color: '#8b9cb5', fontSize: 9, marginLeft: 8 }}>SCALE</span>
        <select value={timeScale} onChange={e => setTimeScale(e.target.value as TimeScale)}>
          {SCALES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        <button onClick={() => setModalOpen(true)}>Open 2D Chart</button>

        <label className="checkbox-row" style={{ marginLeft: 'auto' }}>
          <input type="checkbox" checked={autoPause} onChange={() => setAutoPause(!autoPause)} />
          Auto-pause on events
        </label>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap', fontSize: 10 }}>
        <Toggle k="showOrbitGuides" label="Orbit guides" />
        <Toggle k="showLabels" label="Labels" />
        <Toggle k="showTrails" label="Trails" />
        <Toggle k="trueScale" label="True scale" />
        <Toggle k="showZodiacRingNatal" label="Natal zodiac" />
        <Toggle k="showZodiacRingTransit" label="Transit zodiac" />
        <Toggle k="showAspectBeams" label="Aspect beams" />
        <Toggle k="showHouses" label="House lines" />
        <Toggle k="showNatalMarkers" label="Natal markers" />
        <Toggle k="bloomEnabled" label="Bloom" />
        <Toggle k="showStars" label="Stars" />
      </div>
    </div>
  );
}

function Toggle({ k, label }: { k: keyof ReturnType<typeof useApp.getState>['visual']; label: string }) {
  const v = useApp(s => s.visual[k]);
  const t = useApp(s => s.toggleVisual);
  return (
    <label className="checkbox-row">
      <input type="checkbox" checked={v} onChange={() => t(k)} />
      {label}
    </label>
  );
}
