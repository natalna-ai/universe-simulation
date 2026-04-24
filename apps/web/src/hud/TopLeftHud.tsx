import { DateTime } from 'luxon';
import { useApp } from '../state/store';
import { useLive } from '../state/liveStore';
import { formatLongitude, signOfLongitude } from '@natalna/ephemeris-core';

export function TopLeftHud() {
  const simTimeMs = useApp(s => s.simTimeMs);
  const natal = useApp(s => s.natal);
  const liveBodies = useLive(s => s.liveBodies);
  const active = useLive(s => s.active);

  const sim = DateTime.fromMillis(simTimeMs).toUTC();
  const sun = liveBodies.find(b => b.id === 'SUN');
  const moon = liveBodies.find(b => b.id === 'MOON');
  const mostUrgent = active[0];

  return (
    <div className="hud-panel" style={{ position: 'absolute', top: 50, left: 18, minWidth: 260 }}>
      <div>
        <div className="label">SIM TIME (UTC)</div>
        <div className="value accent">{sim.toFormat('yyyy-LL-dd HH:mm:ss')} UTC</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <div className="label">NATAL</div>
        <div className="value" style={{ fontSize: 11, color: '#ffd84a' }}>
          {natal ? `${DateTime.fromISO(natal.utc).toUTC().toFormat('yyyy-LL-dd HH:mm')} UTC · ${natal.lat.toFixed(2)}, ${natal.lon.toFixed(2)} · HSYS ${natal.hsys}` : '—'}
        </div>
      </div>
      {sun && moon && (
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div className="label">SUN</div>
            <div className="value accent">{formatLongitude(sun.lon)}</div>
            <div style={{ fontSize: 9, color: '#8b9cb5' }}>{signOfLongitude(sun.lon).name}</div>
          </div>
          <div>
            <div className="label">MOON</div>
            <div className="value accent">{formatLongitude(moon.lon)}</div>
            <div style={{ fontSize: 9, color: '#8b9cb5' }}>{signOfLongitude(moon.lon).name}</div>
          </div>
        </div>
      )}
      {mostUrgent && (
        <div style={{ marginTop: 10, padding: 8, background: 'rgba(255,216,74,0.06)', borderLeft: '2px solid #ffd84a', borderRadius: 3 }}>
          <div className="label" style={{ color: '#ffd84a' }}>CURRENT EVENT</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>
            <span className="accent-yellow">{mostUrgent.transit}</span>
            <span style={{ margin: '0 6px', color: '#8b9cb5' }}>{mostUrgent.aspect}</span>
            <span className="accent-yellow">{mostUrgent.natal}</span>
            {' '}· orb {mostUrgent.orb.toFixed(2)}°
            {mostUrgent.applying ? ' · applying' : ' · separating'}
          </div>
        </div>
      )}
    </div>
  );
}
