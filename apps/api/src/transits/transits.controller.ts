import { Body, Controller, Post } from '@nestjs/common';
import { TransitsService } from './transits.service';
import { TransitsChunkDto } from './transits.dto';

@Controller('transits')
export class TransitsController {
  constructor(private readonly svc: TransitsService) {}

  @Post('chunk')
  chunk(@Body() dto: TransitsChunkDto) {
    return this.svc.compute({
      natal: dto.natal,
      startUtc: dto.startUtc,
      endUtc: dto.endUtc,
      stepSeconds: dto.stepSeconds,
      sceneBodies: dto.sceneBodies,
      aspectBodies: dto.aspectBodies,
      enabledAspects: dto.enabledAspects,
      orbConfig: dto.orbConfig,
      includeTransitToTransit: dto.includeTransitToTransit,
    });
  }
}
