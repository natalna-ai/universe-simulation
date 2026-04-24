import type { AspectType, OrbConfig, OrbConfigMap, BodyId } from './types';

export interface AspectDefinition {
  id: AspectType;
  name: string;
  angle: number;
  glyph: string;
  color: string;
  defaultEnabled: boolean;
  defaultOrb: number;
  sunMoonOrb?: number;
}

export const ASPECTS: Record<AspectType, AspectDefinition> = {
  CONJUNCTION:   { id: 'CONJUNCTION',   name: 'Conjunction',   angle: 0,   glyph: '☌', color: '#ffffff', defaultEnabled: true,  defaultOrb: 6, sunMoonOrb: 8 },
  OPPOSITION:    { id: 'OPPOSITION',    name: 'Opposition',    angle: 180, glyph: '☍', color: '#ff5b5b', defaultEnabled: true,  defaultOrb: 6, sunMoonOrb: 8 },
  TRINE:         { id: 'TRINE',         name: 'Trine',         angle: 120, glyph: '△', color: '#5bc8ff', defaultEnabled: true,  defaultOrb: 6 },
  SQUARE:        { id: 'SQUARE',        name: 'Square',        angle: 90,  glyph: '□', color: '#ff9b3b', defaultEnabled: true,  defaultOrb: 6 },
  SEXTILE:       { id: 'SEXTILE',       name: 'Sextile',       angle: 60,  glyph: '⚹', color: '#5bff8c', defaultEnabled: true,  defaultOrb: 4 },
  QUINCUNX:      { id: 'QUINCUNX',      name: 'Quincunx',      angle: 150, glyph: '⚻', color: '#b46bff', defaultEnabled: false, defaultOrb: 3 },
  SEMISEXTILE:   { id: 'SEMISEXTILE',   name: 'Semisextile',   angle: 30,  glyph: '⚺', color: '#7affd4', defaultEnabled: false, defaultOrb: 3 },
  SEMISQUARE:    { id: 'SEMISQUARE',    name: 'Semisquare',    angle: 45,  glyph: '∠', color: '#ffb46b', defaultEnabled: false, defaultOrb: 2 },
  SESQUISQUARE:  { id: 'SESQUISQUARE',  name: 'Sesquisquare',  angle: 135, glyph: '⚼', color: '#ffb46b', defaultEnabled: false, defaultOrb: 2 },
  QUINTILE:      { id: 'QUINTILE',      name: 'Quintile',      angle: 72,  glyph: 'Q',  color: '#d4a3ff', defaultEnabled: false, defaultOrb: 2 },
  BIQUINTILE:    { id: 'BIQUINTILE',    name: 'Biquintile',    angle: 144, glyph: 'bQ', color: '#d4a3ff', defaultEnabled: false, defaultOrb: 2 },
};

export const ALL_ASPECTS: AspectType[] = Object.keys(ASPECTS) as AspectType[];
export const DEFAULT_ASPECTS: AspectType[] = ALL_ASPECTS.filter(a => ASPECTS[a].defaultEnabled);

export function defaultOrbConfig(): OrbConfigMap {
  const out = {} as OrbConfigMap;
  for (const a of ALL_ASPECTS) {
    const def = ASPECTS[a];
    const cfg: OrbConfig = { default: def.defaultOrb };
    if (def.sunMoonOrb !== undefined) cfg.sunMoonOverride = def.sunMoonOrb;
    out[a] = cfg;
  }
  return out;
}

const SUN_MOON: BodyId[] = ['SUN', 'MOON'];

export function effectiveOrb(aspect: AspectType, a: BodyId, b: BodyId, cfg: OrbConfigMap): number {
  const c = cfg[aspect];
  if (!c) return ASPECTS[aspect].defaultOrb;
  if (c.sunMoonOverride !== undefined && (SUN_MOON.includes(a) || SUN_MOON.includes(b))) {
    return c.sunMoonOverride;
  }
  return c.default;
}

/**
 * Wrap angle delta into [-180, 180].
 */
export function normalize180(delta: number): number {
  let d = ((delta + 180) % 360 + 360) % 360 - 180;
  if (d === -180) d = 180;
  return d;
}

/**
 * Signed orb between transit longitude and natal longitude for a given aspect angle.
 * Negative => transit is "before" exact, positive => "after".
 */
export function signedOrb(transitLon: number, natalLon: number, aspectAngle: number): number {
  return normalize180(transitLon - natalLon - aspectAngle);
}
