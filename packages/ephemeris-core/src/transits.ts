import { calcBodies, jdUtToDate, utcToJd } from './ephemeris';
import { houseOfLongitude } from './houses';
import { ASPECTS, effectiveOrb, signedOrb } from './aspects';
import type {
  AspectEvent, AspectType, BodyId, ChunkRequest, ChunkResponse,
  NatalChart, SampleFrame,
} from './types';

const SECS_PER_DAY = 86400;

export function computeChunk(req: ChunkRequest): ChunkResponse {
  const startDate = new Date(req.startUtc);
  const endDate = new Date(req.endUtc);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Invalid chunk window');
  }
  if (endDate <= startDate) {
    throw new Error('endUtc must be after startUtc');
  }
  if (req.stepSeconds <= 0) throw new Error('stepSeconds must be > 0');

  const samples = sampleWindow(startDate, endDate, req.stepSeconds, req.sceneBodies, req.natal);
  const aspectEvents = detectAspectEvents(samples, req);

  return {
    startUtc: startDate.toISOString(),
    endUtc: endDate.toISOString(),
    stepSeconds: req.stepSeconds,
    samples,
    aspectEvents,
  };
}

function sampleWindow(start: Date, end: Date, stepSec: number, bodies: BodyId[], natal: NatalChart): SampleFrame[] {
  const frames: SampleFrame[] = [];
  const { jdEt: startEt } = utcToJd(start);
  const startMs = start.getTime();
  const endMs = end.getTime();
  const stepDays = stepSec / SECS_PER_DAY;
  let frameIdx = 0;
  const cusps = natal.cusps;
  for (let t = startMs; t <= endMs; t += stepSec * 1000) {
    const jdEt = startEt + frameIdx * stepDays;
    const positions = calcBodies(jdEt, bodies);
    for (const p of positions) {
      p.house = houseOfLongitude(p.lon, cusps);
    }
    frames.push({
      utc: new Date(t).toISOString(),
      jd: jdEt,
      bodies: positions,
    });
    frameIdx += 1;
  }
  return frames;
}

interface SeriesEntry {
  lon: number;
  speed: number;
  jd: number;
  utcMs: number;
}

interface PairKey { transit: BodyId; natal: BodyId; aspect: AspectType; }

function detectAspectEvents(samples: SampleFrame[], req: ChunkRequest): AspectEvent[] {
  const events: AspectEvent[] = [];
  if (samples.length < 2) return events;

  const aspectBodies = new Set(req.aspectBodies);
  const sceneBodies = new Set(req.sceneBodies);
  // index transit body series
  const transitSeries = new Map<BodyId, SeriesEntry[]>();
  for (const id of req.aspectBodies) {
    if (!sceneBodies.has(id)) continue;
    const series: SeriesEntry[] = samples.map(s => {
      const p = s.bodies.find(b => b.id === id)!;
      return { lon: p.lon, speed: p.speed, jd: s.jd, utcMs: Date.parse(s.utc) };
    });
    transitSeries.set(id, series);
  }

  // Natal lookup
  const natalLon = new Map<BodyId, number>();
  for (const b of req.natal.bodies) {
    if (aspectBodies.has(b.id)) natalLon.set(b.id, b.lon);
  }

  // transit-to-natal
  for (const [transit, series] of transitSeries) {
    for (const [natal, nLon] of natalLon) {
      for (const aspectId of req.enabledAspects) {
        const orb = effectiveOrb(aspectId, transit, natal, req.orbConfig);
        scanForCrossings(series, aspectId, orb,
          (e) => signedOrb(e.lon, nLon, ASPECTS[aspectId].angle),
          (peakMs, ingressMs, egressMs, peakSignedOrb, peakSpeed) => {
            events.push({
              transit, natal, aspect: aspectId,
              ingressUtc: new Date(ingressMs).toISOString(),
              peakUtc: new Date(peakMs).toISOString(),
              egressUtc: new Date(egressMs).toISOString(),
              peakOrb: peakSignedOrb,
              direction: peakSpeed < 0 ? 'retrograde' : 'direct',
              applying: false, // computed at moment of inspection
              isFixedStar: false,
            });
          });
      }
    }
  }

  // transit-to-transit
  if (req.includeTransitToTransit) {
    const ids = Array.from(transitSeries.keys());
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i]!, b = ids[j]!;
        const sa = transitSeries.get(a)!;
        const sb = transitSeries.get(b)!;
        for (const aspectId of req.enabledAspects) {
          const orb = effectiveOrb(aspectId, a, b, req.orbConfig);
          scanForCrossingsPair(sa, sb, aspectId, orb,
            (peakMs, ingressMs, egressMs, peakSignedOrb, peakSpeedA) => {
              events.push({
                transit: a, natal: b, aspect: aspectId,
                ingressUtc: new Date(ingressMs).toISOString(),
                peakUtc: new Date(peakMs).toISOString(),
                egressUtc: new Date(egressMs).toISOString(),
                peakOrb: peakSignedOrb,
                direction: peakSpeedA < 0 ? 'retrograde' : 'direct',
                applying: false,
                isFixedStar: false,
              });
            });
        }
      }
    }
  }

  // sort by peak time
  events.sort((x, y) => Date.parse(x.peakUtc) - Date.parse(y.peakUtc));
  return events;
}

type SignedOrbFn = (e: SeriesEntry) => number;

function scanForCrossings(
  series: SeriesEntry[],
  _aspect: AspectType,
  orb: number,
  fn: SignedOrbFn,
  emit: (peakMs: number, ingressMs: number, egressMs: number, peakOrb: number, peakSpeed: number) => void,
): void {
  if (series.length < 3) return;
  // Compute |signedOrb| series
  const so = series.map(fn);
  const ao = so.map(Math.abs);
  let inOrb = ao[0]! < orb;
  let ingressIdx = inOrb ? 0 : -1;
  for (let i = 1; i < series.length; i++) {
    const above = ao[i]! >= orb;
    const below = ao[i]! < orb;
    if (!inOrb && below) {
      ingressIdx = interpolateIndex(ao[i - 1]!, ao[i]!, orb, i - 1);
      inOrb = true;
    } else if (inOrb && above) {
      const egressIdx = interpolateIndex(ao[i - 1]!, ao[i]!, orb, i - 1);
      // find peak (local minimum of ao within [ingressIdx, egressIdx])
      const peak = findPeak(series, so, ao, Math.floor(ingressIdx), Math.min(Math.ceil(egressIdx), series.length - 1));
      const ingressMs = interpolateMs(series, ingressIdx);
      const egressMs = interpolateMs(series, egressIdx);
      emit(peak.ms, ingressMs, egressMs, peak.signed, peak.speed);
      inOrb = false;
      ingressIdx = -1;
    }
  }
}

function scanForCrossingsPair(
  seriesA: SeriesEntry[],
  seriesB: SeriesEntry[],
  aspect: AspectType,
  orb: number,
  emit: (peakMs: number, ingressMs: number, egressMs: number, peakOrb: number, peakSpeedA: number) => void,
): void {
  if (seriesA.length !== seriesB.length || seriesA.length < 3) return;
  const angle = ASPECTS[aspect].angle;
  const so = seriesA.map((a, i) => signedOrb(a.lon, seriesB[i]!.lon, angle));
  const ao = so.map(Math.abs);
  let inOrb = ao[0]! < orb;
  let ingressIdx = inOrb ? 0 : -1;
  for (let i = 1; i < seriesA.length; i++) {
    const above = ao[i]! >= orb;
    const below = ao[i]! < orb;
    if (!inOrb && below) {
      ingressIdx = interpolateIndex(ao[i - 1]!, ao[i]!, orb, i - 1);
      inOrb = true;
    } else if (inOrb && above) {
      const egressIdx = interpolateIndex(ao[i - 1]!, ao[i]!, orb, i - 1);
      const peak = findPeak(seriesA, so, ao, Math.floor(ingressIdx), Math.min(Math.ceil(egressIdx), seriesA.length - 1));
      const ingressMs = interpolateMs(seriesA, ingressIdx);
      const egressMs = interpolateMs(seriesA, egressIdx);
      emit(peak.ms, ingressMs, egressMs, peak.signed, peak.speed);
      inOrb = false;
      ingressIdx = -1;
    }
  }
}

function interpolateIndex(prev: number, next: number, target: number, prevIdx: number): number {
  if (next === prev) return prevIdx;
  const frac = (target - prev) / (next - prev);
  return prevIdx + frac;
}

function interpolateMs(series: SeriesEntry[], fracIdx: number): number {
  const i0 = Math.floor(fracIdx);
  const i1 = Math.min(i0 + 1, series.length - 1);
  const f = fracIdx - i0;
  return series[i0]!.utcMs + (series[i1]!.utcMs - series[i0]!.utcMs) * f;
}

function findPeak(series: SeriesEntry[], so: number[], ao: number[], lo: number, hi: number) {
  let bestIdx = lo;
  let best = ao[lo]!;
  for (let i = lo + 1; i <= hi; i++) {
    if (ao[i]! < best) { best = ao[i]!; bestIdx = i; }
  }
  // refine peak by parabolic fit if interior point
  let refinedIdx = bestIdx;
  if (bestIdx > lo && bestIdx < hi) {
    const a = ao[bestIdx - 1]!, b = ao[bestIdx]!, c = ao[bestIdx + 1]!;
    const denom = (a - 2 * b + c);
    if (denom !== 0) {
      const offset = 0.5 * (a - c) / denom;
      refinedIdx = bestIdx + offset;
    }
  }
  const ms = interpolateMs(series, refinedIdx);
  // interpolate speed and signedOrb at refined index
  const i0 = Math.max(0, Math.floor(refinedIdx));
  const i1 = Math.min(series.length - 1, i0 + 1);
  const f = refinedIdx - i0;
  const speed = series[i0]!.speed + (series[i1]!.speed - series[i0]!.speed) * f;
  const signed = so[i0]! + (so[i1]! - so[i0]!) * f;
  return { ms, signed, speed };
}

// helper for tests
export function _utcToJd(date: Date) { return utcToJd(date); }
export function _jdToUtc(jd: number) { return jdUtToDate(jd); }
