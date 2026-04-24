import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Vector3 } from 'three';
import { useApp, TIME_SCALE_SECONDS } from '../state/store';
import { useLive } from '../state/liveStore';
import { useChunks, interpolateBodies } from '../state/useChunks';
import { activeAspectsAt, type BodyId, type BodyPosition } from '@natalna/ephemeris-core';
import { EarthCenter } from './EarthCenter';
import { EclipticGrid } from './EclipticGrid';
import { ZodiacRing } from './ZodiacRing';
import { PlanetBody } from './PlanetBody';
import { NatalRingMarkers } from './NatalRingMarkers';
import { AspectBeams } from './AspectBeams';
import { OrbitGuides } from './OrbitGuides';
import { HouseLines } from './HouseLines';
import { Trails } from './Trails';
import { eclipticToCartesian } from './project';

const FRAME_THROTTLE_MS = 33;     // ~30 Hz updates to live store
const TRAIL_MAX_POINTS = 80;
const AUTO_PAUSE_DURATION_MS = 3000;

function FrameRunner() {
  const stateRef = useChunks();
  const lastWrite = useRef<number>(0);
  const lastSimTime = useRef<number>(0);
  const autoPauseUntil = useRef<number>(0);

  useFrame((_, delta) => {
    const { playing, simTimeMs, speedMultiplier, timeScale, autoPauseOnEvents, setPlaying } = useApp.getState();

    // resume after auto-pause window
    if (autoPauseUntil.current > 0 && performance.now() >= autoPauseUntil.current) {
      autoPauseUntil.current = 0;
      setPlaying(true);
    }

    if (playing) {
      const secsPerWallSec = TIME_SCALE_SECONDS[timeScale];
      const advanceMs = delta * secsPerWallSec * speedMultiplier * 1000;
      const next = simTimeMs + advanceMs;

      // auto-pause: check if we crossed an aspect peak
      if (autoPauseOnEvents) {
        const events = useLive.getState().upcomingEvents;
        for (const e of events) {
          const peak = Date.parse(e.peakUtc);
          if (lastSimTime.current < peak && next >= peak) {
            setPlaying(false);
            autoPauseUntil.current = performance.now() + AUTO_PAUSE_DURATION_MS;
            break;
          }
        }
      }
      lastSimTime.current = next;
      useApp.getState().setSimTimeMs(next);
    } else {
      lastSimTime.current = simTimeMs;
    }

    // throttle live snapshot writes
    const now = performance.now();
    if (now - lastWrite.current < FRAME_THROTTLE_MS) return;
    lastWrite.current = now;

    const { natal, enabledAspects, orbConfig, aspectBodies } = useApp.getState();
    if (!natal) return;
    const cur = stateRef.current.current?.data ?? null;
    const live = interpolateBodies(cur, useApp.getState().simTimeMs);
    if (!live) return;
    const active = activeAspectsAt(
      natal.bodies.map(b => ({ id: b.id, lon: b.lon })),
      live.map(b => ({ id: b.id, lon: b.lon, speed: b.speed })),
      [...enabledAspects],
      orbConfig,
      aspectBodies,
    );
    useLive.getState().setLive(live, active);
    if (cur) useLive.getState().setUpcoming(cur.aspectEvents);
  });
  return null;
}

function TrailManager() {
  const trailsRef = useRef<Map<BodyId, Vector3[]>>(new Map());
  const lastSample = useRef<number>(0);

  useFrame(() => {
    const visual = useApp.getState().visual;
    if (!visual.showTrails) {
      if (trailsRef.current.size > 0) {
        trailsRef.current = new Map();
        useLive.getState().setTrails(trailsRef.current);
      }
      return;
    }
    const now = performance.now();
    if (now - lastSample.current < 90) return;
    lastSample.current = now;
    const liveBodies = useLive.getState().liveBodies;
    const next = new Map(trailsRef.current);
    for (const b of liveBodies) {
      const arr = next.get(b.id) ?? [];
      arr.push(eclipticToCartesian(b.lon, b.lat, b.dist, b.id === 'MOON', visual.trueScale));
      while (arr.length > TRAIL_MAX_POINTS) arr.shift();
      next.set(b.id, arr);
    }
    trailsRef.current = next;
    useLive.getState().setTrails(next);
  });

  return null;
}

function VisualLayer() {
  const natal = useApp(s => s.natal);
  const visual = useApp(s => s.visual);
  const sceneBodies = useApp(s => s.sceneBodies);
  const liveBodies = useLive(s => s.liveBodies);
  const active = useLive(s => s.active);

  const filteredLive = useMemo(
    () => liveBodies.filter(b => sceneBodies.has(b.id)),
    [liveBodies, sceneBodies],
  );

  if (!natal) return null;

  return (
    <>
      {visual.showOrbitGuides && <OrbitGuides liveBodies={filteredLive} visibleIds={sceneBodies} trueScale={visual.trueScale} />}
      {visual.showHouses && <HouseLines cusps={natal.cusps} natalAscRotation={natal.angles.asc} />}
      {visual.showZodiacRingNatal && <ZodiacRing radius={42} variant="natal" natalAscRotation={natal.angles.asc} />}
      {visual.showZodiacRingTransit && <ZodiacRing radius={48} variant="transit" />}
      {visual.showNatalMarkers && <NatalRingMarkers natalBodies={natal.bodies} visibleIds={sceneBodies} />}
      {visual.showTrails && <Trails />}
      {filteredLive.map(b => (
        <PlanetBody
          key={b.id}
          id={b.id}
          lon={b.lon}
          lat={b.lat}
          dist={b.dist}
          retro={b.retro}
          showLabel={visual.showLabels}
          trueScale={visual.trueScale}
          kind="transit"
        />
      ))}
      {visual.showAspectBeams && (
        <AspectBeams active={active} liveBodies={filteredLive} natalBodies={natal.bodies} trueScale={visual.trueScale} />
      )}
    </>
  );
}

export function Scene() {
  const visual = useApp(s => s.visual);
  return (
    <Canvas
      camera={{ position: [0, -55, 35], fov: 45, near: 0.1, far: 600 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'radial-gradient(ellipse at center, #0a1428 0%, #02050a 70%)' }}
      onPointerMissed={() => useApp.getState().setSelected(null)}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[40, 40, 60]} intensity={0.6} />
      <pointLight position={[0, 0, 0]} intensity={0.3} color="#4ad8ff" />
      {visual.showStars && <Stars radius={200} depth={80} count={3500} factor={4} saturation={0} fade speed={0.5} />}
      <EclipticGrid radius={48} />
      <EarthCenter />
      <VisualLayer />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={250}
        target={[0, 0, 0]}
      />
      <FrameRunner />
      <TrailManager />
      {visual.bloomEnabled && (
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.35} luminanceSmoothing={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
