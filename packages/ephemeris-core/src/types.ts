export type BodyId =
  | 'SUN' | 'MOON' | 'MERCURY' | 'VENUS' | 'MARS' | 'JUPITER' | 'SATURN'
  | 'URANUS' | 'NEPTUNE' | 'PLUTO'
  | 'MEAN_NODE' | 'TRUE_NODE'
  | 'MEAN_LILITH' | 'TRUE_LILITH'
  | 'CHIRON' | 'PHOLUS' | 'CERES' | 'PALLAS' | 'JUNO' | 'VESTA'
  | 'ERIS' | 'HAUMEA' | 'MAKEMAKE' | 'SEDNA' | 'QUAOAR';

export type AspectType =
  | 'CONJUNCTION' | 'OPPOSITION' | 'TRINE' | 'SQUARE' | 'SEXTILE'
  | 'QUINCUNX' | 'SEMISEXTILE' | 'SEMISQUARE' | 'SESQUISQUARE'
  | 'QUINTILE' | 'BIQUINTILE';

export type HouseSystem = 'P' | 'K' | 'R' | 'C' | 'O' | 'E' | 'W' | 'B' | 'T' | 'M' | 'X' | 'G';

export interface BodyPosition {
  id: BodyId;
  lon: number;       // ecliptic longitude in degrees [0, 360)
  lat: number;       // ecliptic latitude in degrees
  dist: number;      // distance in AU
  speed: number;     // longitude speed degrees/day
  retro: boolean;    // speed < 0
  house?: number;    // 1..12 relative to natal cusps
}

export interface Angles {
  asc: number;
  mc: number;
  ic: number;
  dsc: number;
  vertex: number;
  antiVertex: number;
  eastPoint: number;
  armc: number;
}

export interface NatalChart {
  utc: string;
  jd: number;
  lat: number;
  lon: number;
  hsys: HouseSystem;
  bodies: BodyPosition[];
  angles: Angles;
  cusps: number[]; // 12 entries
  sect: 'day' | 'night';
}

export interface SampleFrame {
  utc: string;
  jd: number;
  bodies: BodyPosition[];
}

export interface AspectEvent {
  transit: BodyId;
  natal: BodyId;
  aspect: AspectType;
  ingressUtc: string;
  peakUtc: string;
  egressUtc: string;
  peakOrb: number;          // signed degrees from exact at peak
  direction: 'direct' | 'retrograde';
  applying: boolean;
  isFixedStar: boolean;
}

export interface AspectActivation {
  utc: string;
  transit: BodyId;
  natal: BodyId;
  aspect: AspectType;
  orb: number;              // |signedOrb| at this moment
  signed: number;
  applying: boolean;
}

export interface OrbConfig {
  default: number;
  sunMoonOverride?: number;
}

export type OrbConfigMap = Record<AspectType, OrbConfig>;

export interface ChunkRequest {
  natal: NatalChart;
  startUtc: string;
  endUtc: string;
  stepSeconds: number;
  sceneBodies: BodyId[];
  aspectBodies: BodyId[];
  enabledAspects: AspectType[];
  orbConfig: OrbConfigMap;
  includeTransitToTransit: boolean;
}

export interface ChunkResponse {
  startUtc: string;
  endUtc: string;
  stepSeconds: number;
  samples: SampleFrame[];
  aspectEvents: AspectEvent[];
}
