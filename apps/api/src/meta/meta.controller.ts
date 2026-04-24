import { Controller, Get } from '@nestjs/common';
import { ASPECTS, BODIES, HOUSE_SYSTEMS, SIGNS, defaultOrbConfig, ALL_BODY_IDS, ALL_ASPECTS } from '@natalna/ephemeris-core';

@Controller('meta')
export class MetaController {
  @Get()
  meta() {
    return {
      bodies: ALL_BODY_IDS.map(id => BODIES[id]),
      aspects: ALL_ASPECTS.map(id => ASPECTS[id]),
      signs: SIGNS,
      houseSystems: HOUSE_SYSTEMS,
      defaultOrbConfig: defaultOrbConfig(),
      ephemeris: 'Swiss Ephemeris (sweph)',
    };
  }

  @Get('health')
  health() {
    return { ok: true, ts: new Date().toISOString() };
  }
}
