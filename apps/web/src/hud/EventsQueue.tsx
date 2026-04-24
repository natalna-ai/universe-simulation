import { DateTime } from 'luxon';
import { ASPECTS, BODIES } from '@natalna/ephemeris-core';
import { useApp } from '../state/store';
import { useLive } from '../state/liveStore';

export function EventsQueue() {
  const events = useLive(s => s.upcomingEvents);
  const simTimeMs = useApp(s => s.simTimeMs);
  const setSimTimeMs = useApp(s => s.setSimTimeMs);
  return (
    <div className="hud-panel" style={{ position: 'absolute', bottom: 130, right: 380, width: 320, zIndex: 10 }}>
      <h3>ASPECT EVENTS QUEUE</h3>
      <div className="events-queue">
        {events.length === 0 && <div style={{ color: '#8b9cb5', fontSize: 10 }}>No aspect events in current chunk.</div>}
        {events.slice(0, 50).map((e, i) => {
          const peak = Date.parse(e.peakUtc);
          const ingress = Date.parse(e.ingressUtc);
          const egress = Date.parse(e.egressUtc);
          const status = simTimeMs < ingress ? 'upcoming' : simTimeMs > egress ? 'past' : 'active';
          return (
            <div
              key={i}
              className={`event-row ${status}`}
              onClick={() => setSimTimeMs(peak)}
              title={`${e.transit} ${e.aspect} ${e.natal} · peak ${DateTime.fromMillis(peak).toUTC().toFormat('yyyy-LL-dd HH:mm')} UTC`}
            >
              <span>
                <span style={{ color: BODIES[e.transit]?.color ?? '#fff' }}>{BODIES[e.transit]?.glyph} {e.transit}</span>
                {' '}
                <span style={{ color: ASPECTS[e.aspect].color, margin: '0 4px' }}>{ASPECTS[e.aspect].glyph}</span>
                <span style={{ color: '#ffd84a' }}>{BODIES[e.natal]?.glyph} {e.natal}</span>
                {e.direction === 'retrograde' && <span style={{ color: '#ff5b5b', marginLeft: 4 }}>R</span>}
              </span>
              <span style={{ color: '#8b9cb5', fontSize: 9 }}>
                {DateTime.fromMillis(peak).toUTC().toFormat('LL-dd HH:mm')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
