import * as sweph from 'sweph';
import { BODIES, getBody } from './bodies';
import type { BodyId, BodyPosition, Angles, HouseSystem } from './types';
import { effectiveHouseSystem } from './houses';

let initialized = false;

export function initEphemeris(ephePath: string): void {
  if (initialized) return;
  sweph.set_ephe_path(ephePath);
  initialized = true;
}

const FLAGS = sweph.constants.SEFLG_SWIEPH | sweph.constants.SEFLG_SPEED;

export function utcToJd(utc: Date): { jdEt: number; jdUt: number } {
  const y = utc.getUTCFullYear();
  const m = utc.getUTCMonth() + 1;
  const d = utc.getUTCDate();
  const h = utc.getUTCHours();
  const mi = utc.getUTCMinutes();
  const s = utc.getUTCSeconds() + utc.getUTCMilliseconds() / 1000;
  const r = sweph.utc_to_jd(y, m, d, h, mi, s, sweph.constants.SE_GREG_CAL);
  if (r.flag !== sweph.constants.OK) {
    throw new Error(`utc_to_jd failed: ${r.error}`);
  }
  const [jdEt, jdUt] = r.data;
  return { jdEt, jdUt };
}

export function jdUtToDate(jdUt: number): Date {
  const r = sweph.jdut1_to_utc(jdUt, sweph.constants.SE_GREG_CAL);
  const ms = Math.round((r.second - Math.floor(r.second)) * 1000);
  return new Date(Date.UTC(r.year, r.month - 1, r.day, r.hour, r.minute, Math.floor(r.second), ms));
}

export function calcBody(jdEt: number, id: BodyId): { lon: number; lat: number; dist: number; speed: number } {
  const def = getBody(id);
  const r = sweph.calc(jdEt, def.sweId, FLAGS);
  if (r.flag < 0) {
    throw new Error(`calc(${id}) failed: ${r.error}`);
  }
  const [lon, lat, dist, speedLon] = r.data;
  return { lon: normalize360(lon), lat, dist, speed: speedLon };
}

export function calcBodies(jdEt: number, ids: BodyId[]): BodyPosition[] {
  const out: BodyPosition[] = [];
  for (const id of ids) {
    const v = calcBody(jdEt, id);
    out.push({
      id,
      lon: v.lon,
      lat: v.lat,
      dist: v.dist,
      speed: v.speed,
      retro: v.speed < 0,
    });
  }
  return out;
}

export function computeAngles(jdUt: number, lat: number, lon: number, hsys: HouseSystem): { angles: Angles; cusps: number[] } {
  const eff = effectiveHouseSystem(hsys, lat);
  const r = sweph.houses(jdUt, lat, lon, eff);
  if (r.flag < 0) {
    throw new Error('houses calculation failed');
  }
  const cusps = r.data.houses.slice(0, 12).map(normalize360);
  const points = r.data.points;
  const asc = normalize360(points[0]);
  const mc = normalize360(points[1]);
  const armc = normalize360(points[2]);
  const vertex = normalize360(points[3]);
  const eastPoint = normalize360(points[4]);
  return {
    angles: {
      asc,
      mc,
      ic: normalize360(mc + 180),
      dsc: normalize360(asc + 180),
      vertex,
      antiVertex: normalize360(vertex + 180),
      eastPoint,
      armc,
    },
    cusps,
  };
}

export function calcFixedStar(jdUt: number, name: string): { lon: number; lat: number } {
  const r = sweph.fixstar2_ut(name, jdUt, FLAGS);
  if (r.flag < 0) {
    throw new Error(`fixstar2_ut(${name}) failed: ${r.error}`);
  }
  const [lon, lat] = r.data;
  return { lon: normalize360(lon), lat };
}

export function normalize360(deg: number): number {
  let n = deg % 360;
  if (n < 0) n += 360;
  return n;
}

export const SUPPORTED_BODY_IDS = Object.keys(BODIES);
