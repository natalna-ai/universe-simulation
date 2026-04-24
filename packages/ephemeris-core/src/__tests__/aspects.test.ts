// Lightweight smoke tests (no test framework — runnable via `node` after build).
import { signedOrb, normalize180, ASPECTS, defaultOrbConfig, effectiveOrb } from '../aspects';
import { activeAspectsAt } from '../aspect-runtime';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

// normalize180
assert(Math.abs(normalize180(370) - 10) < 1e-9, 'wrap +370 -> 10');
assert(Math.abs(normalize180(-190) - 170) < 1e-9, 'wrap -190 -> 170');
assert(Math.abs(normalize180(180) - 180) < 1e-9, '180 stays 180');

// signedOrb: Sun at 90°, natal at 90°, conjunction angle 0 -> 0
assert(Math.abs(signedOrb(90, 90, 0)) < 1e-9, 'exact conjunction');
// Sun at 92, natal at 90, conjunction -> +2
assert(Math.abs(signedOrb(92, 90, 0) - 2) < 1e-9, '+2 conjunction');
// Sun at 270, natal at 90, opposition (180) -> 0
assert(Math.abs(signedOrb(270, 90, 180)) < 1e-9, 'exact opposition');

// effectiveOrb: conjunction default 6, sun-moon override 8
const cfg = defaultOrbConfig();
assert(effectiveOrb('CONJUNCTION', 'MARS', 'JUPITER', cfg) === 6, 'mars-jup conj orb 6');
assert(effectiveOrb('CONJUNCTION', 'SUN', 'MARS', cfg) === 8, 'sun involved -> 8');
assert(effectiveOrb('TRINE', 'SUN', 'MARS', cfg) === 6, 'trine sun no override default 6');

// activeAspectsAt: transit Sun at 100°, natal Mars at 95°, conjunction within orb
const active = activeAspectsAt(
  [{ id: 'MARS', lon: 95 }],
  [{ id: 'SUN', lon: 100, speed: 1 }],
  ['CONJUNCTION'],
  cfg,
  new Set(['SUN', 'MARS']),
);
assert(active.length === 1, 'one active aspect');
assert(active[0]!.aspect === 'CONJUNCTION', 'conjunction detected');
assert(Math.abs(active[0]!.orb - 5) < 1e-9, 'orb is 5 deg');
// signed = 5, speed = 1, signed*speed = 5 > 0, so NOT applying (separating)
assert(active[0]!.applying === false, 'separating');

console.log('OK ephemeris-core aspect tests passed');
console.log('  - normalize180, signedOrb');
console.log('  - effectiveOrb sun/moon override');
console.log('  - activeAspectsAt detection + applying flag');
