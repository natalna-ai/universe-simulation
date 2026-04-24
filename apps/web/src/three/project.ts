import { Vector3 } from 'three';

const D2R = Math.PI / 180;

export const SCENE_UNIT = 6;          // base scaling factor
export const COMPRESS_EXP = 0.4;      // distance compression exponent
export const MOON_BOOST = 60;         // visual factor for Moon
export const NATAL_RING_RADIUS = 35;  // radius for natal markers on the wheel

/**
 * Compress AU distances onto a viewable scale.
 * Pluto (~30 AU) lands near radius ~50 with default values.
 */
export function distanceScale(au: number, isMoon: boolean, trueScale: boolean): number {
  if (trueScale) return Math.max(0.5, au * SCENE_UNIT);
  const compressed = Math.pow(Math.max(au, 0.0001), COMPRESS_EXP) * SCENE_UNIT;
  return isMoon ? compressed * MOON_BOOST : compressed;
}

/**
 * Convert ecliptic (lon deg, lat deg, dist AU) to 3D position.
 * Ecliptic plane = XY, north pole = +Z.
 */
export function eclipticToCartesian(lonDeg: number, latDeg: number, distAu: number, isMoon: boolean, trueScale: boolean): Vector3 {
  const lon = lonDeg * D2R;
  const lat = latDeg * D2R;
  const r = distanceScale(distAu, isMoon, trueScale);
  return new Vector3(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.cos(lat) * Math.sin(lon),
    r * Math.sin(lat),
  );
}

/**
 * Project a longitude onto the natal/transit ring at fixed radius.
 */
export function lonToRingPos(lonDeg: number, radius: number): Vector3 {
  const lon = lonDeg * D2R;
  return new Vector3(radius * Math.cos(lon), radius * Math.sin(lon), 0);
}
