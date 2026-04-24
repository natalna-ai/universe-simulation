import { Module, OnModuleInit } from '@nestjs/common';
import * as path from 'node:path';
import { initEphemeris } from '@natalna/ephemeris-core/node';
import { NatalController } from './natal/natal.controller';
import { TransitsController } from './transits/transits.controller';
import { MetaController } from './meta/meta.controller';
import { TransitsService } from './transits/transits.service';
import { PrismaService } from './prisma/prisma.service';
import { SessionsController } from './sessions/sessions.controller';
import { SessionsService } from './sessions/sessions.service';

@Module({
  controllers: [NatalController, TransitsController, MetaController, SessionsController],
  providers: [TransitsService, PrismaService, SessionsService],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    const ephePath = path.resolve(process.env.EPHE_PATH ?? './ephe');
    initEphemeris(ephePath);
    console.log(`[natalna-api] Swiss Ephemeris initialized: ${ephePath}`);
  }
}
