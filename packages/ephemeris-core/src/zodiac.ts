export interface SignDefinition {
  index: number;        // 0..11
  name: string;
  glyph: string;
  startLon: number;     // [0, 330]
  element: 'fire' | 'earth' | 'air' | 'water';
  modality: 'cardinal' | 'fixed' | 'mutable';
  ruler: string;
  color: string;
}

export const SIGNS: SignDefinition[] = [
  { index: 0,  name: 'Aries',       glyph: '♈', startLon: 0,   element: 'fire',  modality: 'cardinal', ruler: 'Mars',    color: '#ff6b5b' },
  { index: 1,  name: 'Taurus',      glyph: '♉', startLon: 30,  element: 'earth', modality: 'fixed',    ruler: 'Venus',   color: '#9ce69c' },
  { index: 2,  name: 'Gemini',      glyph: '♊', startLon: 60,  element: 'air',   modality: 'mutable',  ruler: 'Mercury', color: '#ffe28a' },
  { index: 3,  name: 'Cancer',      glyph: '♋', startLon: 90,  element: 'water', modality: 'cardinal', ruler: 'Moon',    color: '#9cd0ff' },
  { index: 4,  name: 'Leo',         glyph: '♌', startLon: 120, element: 'fire',  modality: 'fixed',    ruler: 'Sun',     color: '#ffb86b' },
  { index: 5,  name: 'Virgo',       glyph: '♍', startLon: 150, element: 'earth', modality: 'mutable',  ruler: 'Mercury', color: '#9ce69c' },
  { index: 6,  name: 'Libra',       glyph: '♎', startLon: 180, element: 'air',   modality: 'cardinal', ruler: 'Venus',   color: '#ffe28a' },
  { index: 7,  name: 'Scorpio',     glyph: '♏', startLon: 210, element: 'water', modality: 'fixed',    ruler: 'Pluto',   color: '#9cd0ff' },
  { index: 8,  name: 'Sagittarius', glyph: '♐', startLon: 240, element: 'fire',  modality: 'mutable',  ruler: 'Jupiter', color: '#ff6b5b' },
  { index: 9,  name: 'Capricorn',   glyph: '♑', startLon: 270, element: 'earth', modality: 'cardinal', ruler: 'Saturn',  color: '#9ce69c' },
  { index: 10, name: 'Aquarius',    glyph: '♒', startLon: 300, element: 'air',   modality: 'fixed',    ruler: 'Uranus',  color: '#ffe28a' },
  { index: 11, name: 'Pisces',      glyph: '♓', startLon: 330, element: 'water', modality: 'mutable',  ruler: 'Neptune', color: '#9cd0ff' },
];

export function signOfLongitude(lon: number): SignDefinition {
  const norm = ((lon % 360) + 360) % 360;
  return SIGNS[Math.floor(norm / 30)]!;
}

export function degreeInSign(lon: number): { deg: number; min: number; sec: number } {
  const norm = ((lon % 360) + 360) % 360;
  const inSign = norm % 30;
  const deg = Math.floor(inSign);
  const minF = (inSign - deg) * 60;
  const min = Math.floor(minF);
  const sec = Math.floor((minF - min) * 60);
  return { deg, min, sec };
}

export function formatLongitude(lon: number): string {
  const sign = signOfLongitude(lon);
  const { deg, min } = degreeInSign(lon);
  return `${deg.toString().padStart(2, '0')}°${sign.glyph}${min.toString().padStart(2, '0')}'`;
}
