import { create } from 'zustand';
import type { AspectType, BodyId, BodyPosition } from '@natalna/ephemeris-core';
import type { Vector3 } from 'three';

export interface ActiveAspect {
  transit: BodyId;
  natal: BodyId;
  aspect: AspectType;
  orb: number;
  signed: number;
  tightness: number;
  applying: boolean;
}

export interface TrailMap { [k: string]: Vector3[]; }

interface LiveState {
  liveBodies: BodyPosition[];
  active: ActiveAspect[];
  upcomingEvents: import('@natalna/ephemeris-core').AspectEvent[];
  trails: Map<BodyId, Vector3[]>;
  setLive: (b: BodyPosition[], a: ActiveAspect[]) => void;
  setUpcoming: (e: import('@natalna/ephemeris-core').AspectEvent[]) => void;
  setTrails: (t: Map<BodyId, Vector3[]>) => void;
}

export const useLive = create<LiveState>((set) => ({
  liveBodies: [],
  active: [],
  upcomingEvents: [],
  trails: new Map(),
  setLive: (b, a) => set({ liveBodies: b, active: a }),
  setUpcoming: (e) => set({ upcomingEvents: e }),
  setTrails: (t) => set({ trails: t }),
}));
