import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      console.warn('[prisma] connect failed (continuing in degraded mode):', (err as Error).message);
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
