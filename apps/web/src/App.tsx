import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useApp } from './state/store';
import { api } from './api/client';
import { Scene } from './three/Scene';
import { TopLeftHud } from './hud/TopLeftHud';
import { TopRightHud } from './hud/TopRightHud';
import { EventsQueue } from './hud/EventsQueue';
import { PlaybackControls } from './hud/PlaybackControls';
import { PlanetDetail } from './hud/PlanetDetail';
import { SidePanel } from './hud/SidePanel';
import { ChartModal } from './modal/ChartModal';
import { ALL_BODY_IDS } from '@natalna/ephemeris-core';

export default function App() {
  const natal = useApp(s => s.natal);
  const setNatal = useApp(s => s.setNatal);
  const birth = useApp(s => s.birthForm);

  const compute = useMutation({
    mutationFn: () => api.computeNatal({
      utc: birth.utc,
      lat: birth.lat,
      lon: birth.lon,
      hsys: birth.hsys,
      bodies: ALL_BODY_IDS,
    }),
    onSuccess: (n) => setNatal(n),
  });

  // auto-compute on first mount
  useEffect(() => {
    if (!natal && !compute.isPending) {
      compute.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recompute = () => compute.mutate();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Scene />

      <div className="title-bar">
        NATALNA / 3D ASTROLOGY TRANSIT VISUALIZER
        <span className="badge mono">SWISS EPHEMERIS</span>
      </div>

      <TopLeftHud />
      <TopRightHud />
      <EventsQueue />
      <PlanetDetail />
      <PlaybackControls />
      <SidePanel />
      <ChartModal />

      {compute.isPending && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: '#4ad8ff', fontFamily: 'JetBrains Mono, monospace',
          zIndex: 200,
        }}>
          Computing natal chart...
        </div>
      )}
      {compute.isError && (
        <div style={{
          position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,91,91,0.15)', border: '1px solid #ff5b5b', padding: 12, borderRadius: 6,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#ff5b5b', zIndex: 200, maxWidth: 600,
        }}>
          Error computing natal chart: {(compute.error as Error).message}
          <button onClick={recompute} style={{ marginLeft: 12 }}>Retry</button>
        </div>
      )}
    </div>
  );
}
