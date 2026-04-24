import { ASPECTS, effectiveOrb, signedOrb } from './aspects';
import type { AspectType, BodyId, OrbConfigMap } from './types';

/**
 * Pure helper, framework-agnostic. Used by the frontend on every animation frame
 * to compute which aspects are currently active without round-tripping to the API.
 */
export function activeAspectsAt(
  natalBodies: { id: BodyId; lon: number }[],
  transitBodies: { id: BodyId; lon: number; speed: number }[],
  enabledAspects: AspectType[],
  orbConfig: OrbConfigMap,
  aspectBodies: Set<BodyId>,
) {
  const out: { transit: BodyId; natal: BodyId; aspect: AspectType; orb: number; signed: number; tightness: number; applying: boolean }[] = [];
  for (const t of transitBodies) {
    if (!aspectBodies.has(t.id)) continue;
    for (const n of natalBodies) {
      if (!aspectBodies.has(n.id)) continue;
      for (const aspect of enabledAspects) {
        const angle = ASPECTS[aspect].angle;
        const signed = signedOrb(t.lon, n.lon, angle);
        const orb = effectiveOrb(aspect, t.id, n.id, orbConfig);
        const abs = Math.abs(signed);
        if (abs < orb) {
          const tightness = 1 - abs / orb;
          const applying = signed * t.speed < 0;
          out.push({ transit: t.id, natal: n.id, aspect, orb: abs, signed, tightness, applying });
        }
      }
    }
  }
  out.sort((a, b) => b.tightness - a.tightness);
  return out;
}
