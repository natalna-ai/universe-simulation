import { calcBodies, computeAngles, utcToJd } from './ephemeris';
import { houseOfLongitude, effectiveHouseSystem } from './houses';
import type { BodyId, HouseSystem, NatalChart } from './types';

export interface NatalInput {
  utc: string;          // ISO 8601 in UTC
  lat: number;
  lon: number;
  hsys: HouseSystem;
  bodies: BodyId[];
}

export function computeNatal(input: NatalInput): NatalChart {
  const date = new Date(input.utc);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid UTC datetime: ${input.utc}`);
  }
  const { jdEt, jdUt } = utcToJd(date);
  const bodies = calcBodies(jdEt, input.bodies);
  const eff = effectiveHouseSystem(input.hsys, input.lat);
  const { angles, cusps } = computeAngles(jdUt, input.lat, input.lon, eff);
  for (const b of bodies) {
    b.house = houseOfLongitude(b.lon, cusps);
  }
  const sect = computeSect(bodies, angles.asc);
  return {
    utc: date.toISOString(),
    jd: jdUt,
    lat: input.lat,
    lon: input.lon,
    hsys: eff,
    bodies,
    angles,
    cusps,
    sect,
  };
}

/**
 * Day chart if Sun is above horizon (i.e. in houses 7..12 by ASC reference).
 * Houses are counted ASC = 1, so Sun in houses 7..12 means above horizon.
 */
function computeSect(bodies: { id: BodyId; house?: number }[], _ascLon: number): 'day' | 'night' {
  const sun = bodies.find(b => b.id === 'SUN');
  if (!sun || sun.house === undefined) return 'day';
  return sun.house >= 7 && sun.house <= 12 ? 'day' : 'night';
}
