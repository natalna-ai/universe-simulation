import type { BodyId } from './types';

export interface BodyDefinition {
  id: BodyId;
  name: string;
  glyph: string;
  sweId: number;
  category: 'lights' | 'classical' | 'modern' | 'node' | 'lilith' | 'centaur' | 'asteroid' | 'tno';
  defaultScene: boolean;
  defaultAspects: boolean;
  visualRadius: number;   // scene units
  color: string;
}

// Sweph body constants (matches sweph npm package)
const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
const SE_URANUS = 7;
const SE_NEPTUNE = 8;
const SE_PLUTO = 9;
const SE_MEAN_NODE = 10;
const SE_TRUE_NODE = 11;
const SE_MEAN_APOG = 12;
const SE_OSCU_APOG = 13;
const SE_CHIRON = 15;
const SE_PHOLUS = 16;
const SE_CERES = 17;
const SE_PALLAS = 18;
const SE_JUNO = 19;
const SE_VESTA = 20;

const SE_AST_OFFSET = 10000;

export const BODIES: Record<BodyId, BodyDefinition> = {
  SUN:         { id: 'SUN',         name: 'Sun',         glyph: '☉', sweId: SE_SUN,         category: 'lights',    defaultScene: true,  defaultAspects: true,  visualRadius: 1.10, color: '#ffd84a' },
  MOON:        { id: 'MOON',        name: 'Moon',        glyph: '☽', sweId: SE_MOON,        category: 'lights',    defaultScene: true,  defaultAspects: true,  visualRadius: 0.55, color: '#dadada' },
  MERCURY:     { id: 'MERCURY',     name: 'Mercury',     glyph: '☿', sweId: SE_MERCURY,     category: 'classical', defaultScene: true,  defaultAspects: true,  visualRadius: 0.40, color: '#9cd0ff' },
  VENUS:       { id: 'VENUS',       name: 'Venus',       glyph: '♀', sweId: SE_VENUS,       category: 'classical', defaultScene: true,  defaultAspects: true,  visualRadius: 0.55, color: '#ffd1a8' },
  MARS:        { id: 'MARS',        name: 'Mars',        glyph: '♂', sweId: SE_MARS,        category: 'classical', defaultScene: true,  defaultAspects: true,  visualRadius: 0.50, color: '#ff6b5b' },
  JUPITER:     { id: 'JUPITER',     name: 'Jupiter',     glyph: '♃', sweId: SE_JUPITER,     category: 'classical', defaultScene: true,  defaultAspects: true,  visualRadius: 0.85, color: '#ffb86b' },
  SATURN:      { id: 'SATURN',      name: 'Saturn',      glyph: '♄', sweId: SE_SATURN,      category: 'classical', defaultScene: true,  defaultAspects: true,  visualRadius: 0.78, color: '#e6c07a' },
  URANUS:      { id: 'URANUS',      name: 'Uranus',      glyph: '♅', sweId: SE_URANUS,      category: 'modern',    defaultScene: true,  defaultAspects: true,  visualRadius: 0.65, color: '#7adfff' },
  NEPTUNE:     { id: 'NEPTUNE',     name: 'Neptune',     glyph: '♆', sweId: SE_NEPTUNE,     category: 'modern',    defaultScene: true,  defaultAspects: true,  visualRadius: 0.65, color: '#5b8cff' },
  PLUTO:       { id: 'PLUTO',       name: 'Pluto',       glyph: '♇', sweId: SE_PLUTO,       category: 'modern',    defaultScene: true,  defaultAspects: true,  visualRadius: 0.40, color: '#c79cff' },
  MEAN_NODE:   { id: 'MEAN_NODE',   name: 'Mean Node',   glyph: '☊', sweId: SE_MEAN_NODE,   category: 'node',      defaultScene: true,  defaultAspects: true,  visualRadius: 0.30, color: '#ffe28a' },
  TRUE_NODE:   { id: 'TRUE_NODE',   name: 'True Node',   glyph: '☊', sweId: SE_TRUE_NODE,   category: 'node',      defaultScene: false, defaultAspects: false, visualRadius: 0.30, color: '#ffe28a' },
  MEAN_LILITH: { id: 'MEAN_LILITH', name: 'Mean Lilith', glyph: '⚸', sweId: SE_MEAN_APOG,   category: 'lilith',    defaultScene: true,  defaultAspects: true,  visualRadius: 0.30, color: '#b46bff' },
  TRUE_LILITH: { id: 'TRUE_LILITH', name: 'True Lilith', glyph: '⚸', sweId: SE_OSCU_APOG,   category: 'lilith',    defaultScene: false, defaultAspects: false, visualRadius: 0.30, color: '#b46bff' },
  CHIRON:      { id: 'CHIRON',      name: 'Chiron',      glyph: '⚷', sweId: SE_CHIRON,      category: 'centaur',   defaultScene: true,  defaultAspects: true,  visualRadius: 0.30, color: '#a3ffd6' },
  PHOLUS:      { id: 'PHOLUS',      name: 'Pholus',      glyph: '⯛', sweId: SE_PHOLUS,      category: 'centaur',   defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#a3ffd6' },
  CERES:       { id: 'CERES',       name: 'Ceres',       glyph: '⚳', sweId: SE_CERES,       category: 'asteroid',  defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#ff9ec5' },
  PALLAS:      { id: 'PALLAS',      name: 'Pallas',      glyph: '⚴', sweId: SE_PALLAS,      category: 'asteroid',  defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#ff9ec5' },
  JUNO:        { id: 'JUNO',        name: 'Juno',        glyph: '⚵', sweId: SE_JUNO,        category: 'asteroid',  defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#ff9ec5' },
  VESTA:       { id: 'VESTA',       name: 'Vesta',       glyph: '⚶', sweId: SE_VESTA,       category: 'asteroid',  defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#ff9ec5' },
  ERIS:        { id: 'ERIS',        name: 'Eris',        glyph: 'Er',     sweId: SE_AST_OFFSET + 136199, category: 'tno', defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#ffb3b3' },
  HAUMEA:      { id: 'HAUMEA',      name: 'Haumea',      glyph: 'Hm',     sweId: SE_AST_OFFSET + 136108, category: 'tno', defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#ffb3b3' },
  MAKEMAKE:    { id: 'MAKEMAKE',    name: 'Makemake',    glyph: 'Mk',     sweId: SE_AST_OFFSET + 136472, category: 'tno', defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#ffb3b3' },
  SEDNA:       { id: 'SEDNA',       name: 'Sedna',       glyph: 'Sd',     sweId: SE_AST_OFFSET + 90377,  category: 'tno', defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#ffb3b3' },
  QUAOAR:      { id: 'QUAOAR',      name: 'Quaoar',      glyph: 'Qa',     sweId: SE_AST_OFFSET + 50000,  category: 'tno', defaultScene: false, defaultAspects: false, visualRadius: 0.25, color: '#ffb3b3' },
};

export const ALL_BODY_IDS: BodyId[] = Object.keys(BODIES) as BodyId[];

export const DEFAULT_SCENE_BODIES: BodyId[] = ALL_BODY_IDS.filter(b => BODIES[b].defaultScene);
export const DEFAULT_ASPECT_BODIES: BodyId[] = ALL_BODY_IDS.filter(b => BODIES[b].defaultAspects);

export function getBody(id: BodyId): BodyDefinition {
  return BODIES[id];
}
