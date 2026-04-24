import { useApp, TIME_SCALE_SECONDS } from '../state/store';
import { useLive } from '../state/liveStore';
import { BODIES } from '@natalna/ephemeris-core';

export function TopRightHud() {
  const liveBodies = useLive(s => s.liveBodies);
  const timeScale = useApp(s => s.timeScale);
  const stepSec = Math.max(60, Math.round(TIME_SCALE_SECONDS[timeScale] / 30));
  return (
    <div className="hud-panel" style={{ position: 'absolute', top: 50, right: 380, minWidth: 220, zIndex: 10 }}>
      <h3>SIMPLIFIED MAP</h3>
      <svg viewBox="-100 -100 200 200" width="180" height="180" style={{ display: 'block', margin: '0 auto' }}>
        <circle cx="0" cy="0" r="92" fill="none" stroke="#4ad8ff" strokeOpacity="0.18" />
        <circle cx="0" cy="0" r="60" fill="none" stroke="#4ad8ff" strokeOpacity="0.10" />
        <circle cx="0" cy="0" r="30" fill="none" stroke="#4ad8ff" strokeOpacity="0.10" />
        {/* Earth at center */}
        <circle cx="0" cy="0" r="3" fill="#1e6bff" />
        {liveBodies.map(b => {
          const def = BODIES[b.id];
          // map distance to map radius (compressed)
          const r = Math.min(92, Math.pow(b.dist, 0.4) * 28);
          const a = (b.lon - 90) * Math.PI / 180;
          const x = r * Math.cos(a);
          const y = r * Math.sin(a);
          return <circle key={b.id} cx={x} cy={y} r={2.2} fill={def.color} />;
        })}
      </svg>
      <div style={{ marginTop: 8 }}>
        <div className="label">EPHEMERIS</div>
        <div className="value" style={{ fontSize: 11 }}>Swiss Ephemeris</div>
      </div>
      <div style={{ marginTop: 4 }}>
        <div className="label">SAMPLE STEP</div>
        <div className="value accent" style={{ fontSize: 11 }}>{stepSec}s · {timeScale}/sec</div>
      </div>
    </div>
  );
}
