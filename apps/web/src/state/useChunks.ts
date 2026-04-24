import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useApp, TIME_SCALE_SECONDS } from './store';
import type { ChunkResponse, BodyId } from '@natalna/ephemeris-core';

const CHUNK_SAMPLES = 240;       // samples per chunk
const PREFETCH_AT_FRAC = 0.65;   // prefetch next chunk after 65% consumed

interface ChunkBucket {
  start: number;
  end: number;
  data: ChunkResponse;
}

interface ChunkState {
  current: ChunkBucket | null;
  next: ChunkBucket | null;
  loading: boolean;
  error: string | null;
}

function chunkSpanMs(stepSec: number) {
  return CHUNK_SAMPLES * stepSec * 1000;
}

function alignChunkStart(simTimeMs: number, chunkSpan: number) {
  return Math.floor(simTimeMs / chunkSpan) * chunkSpan;
}

export function useChunks() {
  const natal = useApp(s => s.natal);
  const simTimeMs = useApp(s => s.simTimeMs);
  const timeScale = useApp(s => s.timeScale);
  const sceneBodies = useApp(s => s.sceneBodies);
  const aspectBodies = useApp(s => s.aspectBodies);
  const enabledAspects = useApp(s => s.enabledAspects);
  const orbConfig = useApp(s => s.orbConfig);

  const stepSec = useMemo(() => Math.max(60, Math.round(TIME_SCALE_SECONDS[timeScale] / 30)), [timeScale]);
  const chunkSpan = chunkSpanMs(stepSec);

  const qc = useQueryClient();
  const stateRef = useRef<ChunkState>({ current: null, next: null, loading: false, error: null });
  const requestKeyRef = useRef<string>('');

  const requestKey = useMemo(() => {
    if (!natal) return '';
    const sb = [...sceneBodies].sort().join(',');
    const ab = [...aspectBodies].sort().join(',');
    const ea = [...enabledAspects].sort().join(',');
    return `${natal.utc}:${natal.lat}:${natal.lon}:${natal.hsys}:${stepSec}:${sb}:${ab}:${ea}`;
  }, [natal, sceneBodies, aspectBodies, enabledAspects, stepSec]);

  // Reset chunks when key changes
  useEffect(() => {
    if (requestKeyRef.current !== requestKey) {
      stateRef.current = { current: null, next: null, loading: false, error: null };
      requestKeyRef.current = requestKey;
    }
  }, [requestKey]);

  const fetchChunk = async (startMs: number): Promise<ChunkBucket | null> => {
    if (!natal) return null;
    const endMs = startMs + chunkSpan;
    const key = ['chunk', requestKey, startMs, endMs];
    try {
      const data = await qc.fetchQuery({
        queryKey: key,
        queryFn: () => api.computeChunk({
          natal,
          startUtc: new Date(startMs).toISOString(),
          endUtc: new Date(endMs).toISOString(),
          stepSeconds: stepSec,
          sceneBodies: [...sceneBodies] as BodyId[],
          aspectBodies: [...aspectBodies] as BodyId[],
          enabledAspects: [...enabledAspects],
          orbConfig,
          includeTransitToTransit: false,
        }),
        staleTime: 60_000,
      });
      return { start: startMs, end: endMs, data };
    } catch (err) {
      stateRef.current.error = (err as Error).message;
      return null;
    }
  };

  // Effect: ensure current chunk covers simTime, kick off prefetches
  useEffect(() => {
    if (!natal || !requestKey) return;
    let cancelled = false;
    (async () => {
      const desiredStart = alignChunkStart(simTimeMs, chunkSpan);
      let cur = stateRef.current.current;
      let nxt = stateRef.current.next;
      if (!cur || cur.start !== desiredStart) {
        // shift if next matches
        if (nxt && nxt.start === desiredStart) {
          cur = nxt;
          nxt = null;
        } else {
          stateRef.current.loading = true;
          const fetched = await fetchChunk(desiredStart);
          if (cancelled) return;
          stateRef.current.loading = false;
          if (fetched) cur = fetched;
        }
        stateRef.current.current = cur;
        stateRef.current.next = nxt;
      }
      // prefetch next when needed
      const consumed = (simTimeMs - desiredStart) / chunkSpan;
      if (consumed > PREFETCH_AT_FRAC && !stateRef.current.next) {
        const nextStart = desiredStart + chunkSpan;
        const fetched = await fetchChunk(nextStart);
        if (cancelled) return;
        if (fetched) stateRef.current.next = fetched;
      }
    })();
    return () => { cancelled = true; };
  }, [natal, requestKey, simTimeMs, chunkSpan]);

  return stateRef;
}

/**
 * Linear interpolation of body positions at sim time using a chunk.
 * Returns null if chunk doesn't cover the time.
 */
export function interpolateBodies(chunk: ChunkResponse | null, simTimeMs: number) {
  if (!chunk || chunk.samples.length === 0) return null;
  const samples = chunk.samples;
  const startMs = Date.parse(samples[0]!.utc);
  const endMs = Date.parse(samples[samples.length - 1]!.utc);
  if (simTimeMs < startMs || simTimeMs > endMs) return null;
  const stepMs = (endMs - startMs) / (samples.length - 1);
  const f = (simTimeMs - startMs) / stepMs;
  const i0 = Math.max(0, Math.min(samples.length - 1, Math.floor(f)));
  const i1 = Math.min(samples.length - 1, i0 + 1);
  const t = f - i0;
  const a = samples[i0]!;
  const b = samples[i1]!;
  const out = a.bodies.map(pa => {
    const pb = b.bodies.find(x => x.id === pa.id);
    if (!pb) return pa;
    return {
      id: pa.id,
      lon: lerpAngle(pa.lon, pb.lon, t),
      lat: pa.lat + (pb.lat - pa.lat) * t,
      dist: pa.dist + (pb.dist - pa.dist) * t,
      speed: pa.speed + (pb.speed - pa.speed) * t,
      retro: pa.retro,
      house: pa.house,
    };
  });
  return out;
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = ((b - a) % 360 + 540) % 360 - 180;
  return ((a + d * t) % 360 + 360) % 360;
}
