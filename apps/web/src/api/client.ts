import type { BodyId, AspectType, HouseSystem, NatalChart, ChunkResponse, OrbConfigMap } from '@natalna/ephemeris-core';

const BASE = '/api';

export interface NatalComputeRequest {
  utc: string;
  lat: number;
  lon: number;
  hsys: HouseSystem;
  bodies: BodyId[];
}

export interface ChunkRequestPayload {
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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  computeNatal: (req: NatalComputeRequest) => post<NatalChart>('/natal/compute', req),
  computeChunk: (req: ChunkRequestPayload) => post<ChunkResponse>('/transits/chunk', req),
  meta: () => get<{
    bodies: { id: BodyId; name: string; glyph: string; color: string; category: string; defaultScene: boolean; defaultAspects: boolean; visualRadius: number }[];
    aspects: { id: AspectType; name: string; angle: number; glyph: string; color: string; defaultEnabled: boolean; defaultOrb: number; sunMoonOrb?: number }[];
    signs: { index: number; name: string; glyph: string; startLon: number; element: string; modality: string; ruler: string; color: string }[];
    houseSystems: { id: HouseSystem; name: string }[];
    defaultOrbConfig: OrbConfigMap;
    ephemeris: string;
  }>('/meta'),
  health: () => get<{ ok: boolean; ts: string }>('/meta/health'),
};
