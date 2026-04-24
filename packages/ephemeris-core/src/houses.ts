import type { HouseSystem } from './types';

export interface HouseSystemDef {
  id: HouseSystem;
  name: string;
}

export const HOUSE_SYSTEMS: HouseSystemDef[] = [
  { id: 'P', name: 'Placidus' },
  { id: 'K', name: 'Koch' },
  { id: 'R', name: 'Regiomontanus' },
  { id: 'C', name: 'Campanus' },
  { id: 'O', name: 'Porphyrius' },
  { id: 'E', name: 'Equal (from ASC)' },
  { id: 'W', name: 'Whole Sign' },
  { id: 'B', name: 'Alcabitius' },
  { id: 'T', name: 'Topocentric' },
  { id: 'M', name: 'Morinus' },
  { id: 'X', name: 'Meridian' },
  { id: 'G', name: 'Gauquelin' },
];

/**
 * House index (1..12) for a given longitude given 12 cusp longitudes
 * (cusps[0] = ASC = cusp of house 1).
 */
export function houseOfLongitude(lon: number, cusps: number[]): number {
  const norm = ((lon % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const a = cusps[i]!;
    const b = cusps[(i + 1) % 12]!;
    if (cuspContains(norm, a, b)) return i + 1;
  }
  return 1;
}

function cuspContains(lon: number, a: number, b: number): boolean {
  if (a < b) return lon >= a && lon < b;
  // wrap across 360
  return lon >= a || lon < b;
}

/**
 * Auto fallback to Whole Sign above 66 deg latitude.
 */
export function effectiveHouseSystem(requested: HouseSystem, lat: number): HouseSystem {
  if (Math.abs(lat) > 66 && (requested === 'P' || requested === 'K' || requested === 'R' || requested === 'C' || requested === 'B' || requested === 'T')) {
    return 'W';
  }
  return requested;
}
