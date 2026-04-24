import { Body, Controller, Post } from '@nestjs/common';
import { computeNatal } from '@natalna/ephemeris-core/node';
import { NatalComputeDto } from './natal.dto';

@Controller('natal')
export class NatalController {
  @Post('compute')
  compute(@Body() dto: NatalComputeDto) {
    return computeNatal({
      utc: dto.utc,
      lat: dto.lat,
      lon: dto.lon,
      hsys: dto.hsys,
      bodies: dto.bodies,
    });
  }
}
