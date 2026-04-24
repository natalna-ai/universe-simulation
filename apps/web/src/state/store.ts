import { create } from 'zustand';
import type { BodyId, AspectType, HouseSystem, NatalChart, OrbConfigMap } from '@natalna/ephemeris-core';

export type TimeScale = 'minute' | 'hour' | 'day' | 'week' | 'month';
export const TIME_SCALE_SECONDS: Record<TimeScale, number> = {
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 7 * 86400,
  month: 30 * 86400,
};

export interface BirthForm {
  utc: string;
  lat: number;
  lon: number;
  hsys: HouseSystem;
  label: string;
}

export interface VisualToggles {
  showOrbitGuides: boolean;
  showLabels: boolean;
  showTrails: boolean;
  trueScale: boolean;
  showZodiacRingNatal: boolean;
  showZodiacRingTransit: boolean;
  showAspectBeams: boolean;
  showHouses: boolean;
  bloomEnabled: boolean;
  showStars: boolean;
  showNatalMarkers: boolean;
}

interface AppState {
  birthForm: BirthForm;
  natal: NatalChart | null;
  setNatal: (n: NatalChart | null) => void;
  setBirth: (b: Partial<BirthForm>) => void;

  // animation
  simTimeMs: number;
  setSimTimeMs: (ms: number) => void;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  speedMultiplier: number;
  setSpeedMultiplier: (m: number) => void;
  timeScale: TimeScale;
  setTimeScale: (s: TimeScale) => void;
  autoPauseOnEvents: boolean;
  setAutoPauseOnEvents: (b: boolean) => void;

  // bodies
  sceneBodies: Set<BodyId>;
  aspectBodies: Set<BodyId>;
  toggleSceneBody: (id: BodyId) => void;
  toggleAspectBody: (id: BodyId) => void;

  // aspects
  enabledAspects: Set<AspectType>;
  toggleAspect: (id: AspectType) => void;
  orbConfig: OrbConfigMap;
  setOrbConfig: (c: OrbConfigMap) => void;

  // visual
  visual: VisualToggles;
  toggleVisual: (k: keyof VisualToggles) => void;

  // selection
  selectedBody: { id: BodyId; kind: 'natal' | 'transit' } | null;
  setSelected: (s: { id: BodyId; kind: 'natal' | 'transit' } | null) => void;

  // 2D modal
  modalOpen: boolean;
  setModalOpen: (b: boolean) => void;
  modalMode: 'natal' | 'transit' | 'biwheel';
  setModalMode: (m: 'natal' | 'transit' | 'biwheel') => void;

  // side panel
  sidePanelOpen: boolean;
  setSidePanelOpen: (b: boolean) => void;
}

const DEFAULT_BIRTH: BirthForm = {
  // Default user (Nemanja, 1999-01-14 10:55 local Belgrade -> 09:55 UTC)
  utc: '1999-01-14T09:55:00.000Z',
  lat: 42.552091,
  lon: 21.898854,
  hsys: 'P',
  label: 'Default',
};

import { ALL_BODY_IDS, BODIES, ALL_ASPECTS, ASPECTS, defaultOrbConfig } from '@natalna/ephemeris-core';

const defaultSceneSet = new Set<BodyId>(ALL_BODY_IDS.filter(b => BODIES[b].defaultScene));
const defaultAspectSet = new Set<BodyId>(ALL_BODY_IDS.filter(b => BODIES[b].defaultAspects));
const defaultAspectEnabled = new Set<AspectType>(ALL_ASPECTS.filter(a => ASPECTS[a].defaultEnabled));

export const useApp = create<AppState>((set) => ({
  birthForm: DEFAULT_BIRTH,
  natal: null,
  setNatal: (n) => set({ natal: n }),
  setBirth: (b) => set(s => ({ birthForm: { ...s.birthForm, ...b } })),

  simTimeMs: Date.now(),
  setSimTimeMs: (ms) => set({ simTimeMs: ms }),
  playing: false,
  setPlaying: (p) => set({ playing: p }),
  speedMultiplier: 1,
  setSpeedMultiplier: (m) => set({ speedMultiplier: m }),
  timeScale: 'hour',
  setTimeScale: (s) => set({ timeScale: s }),
  autoPauseOnEvents: false,
  setAutoPauseOnEvents: (b) => set({ autoPauseOnEvents: b }),

  sceneBodies: defaultSceneSet,
  aspectBodies: defaultAspectSet,
  toggleSceneBody: (id) => set(s => {
    const n = new Set(s.sceneBodies);
    if (n.has(id)) n.delete(id); else n.add(id);
    return { sceneBodies: n };
  }),
  toggleAspectBody: (id) => set(s => {
    const n = new Set(s.aspectBodies);
    if (n.has(id)) n.delete(id); else n.add(id);
    return { aspectBodies: n };
  }),

  enabledAspects: defaultAspectEnabled,
  toggleAspect: (id) => set(s => {
    const n = new Set(s.enabledAspects);
    if (n.has(id)) n.delete(id); else n.add(id);
    return { enabledAspects: n };
  }),
  orbConfig: defaultOrbConfig(),
  setOrbConfig: (c) => set({ orbConfig: c }),

  visual: {
    showOrbitGuides: true,
    showLabels: true,
    showTrails: false,
    trueScale: false,
    showZodiacRingNatal: true,
    showZodiacRingTransit: true,
    showAspectBeams: true,
    showHouses: true,
    bloomEnabled: true,
    showStars: true,
    showNatalMarkers: true,
  },
  toggleVisual: (k) => set(s => ({ visual: { ...s.visual, [k]: !s.visual[k] } })),

  selectedBody: null,
  setSelected: (s) => set({ selectedBody: s }),

  modalOpen: false,
  setModalOpen: (b) => set({ modalOpen: b }),
  modalMode: 'biwheel',
  setModalMode: (m) => set({ modalMode: m }),

  sidePanelOpen: false,
  setSidePanelOpen: (b) => set({ sidePanelOpen: b }),
}));
