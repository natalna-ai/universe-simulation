import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveBirthDataDto } from './sessions.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveBirth(dto: SaveBirthDataDto) {
    return this.prisma.birthData.create({
      data: {
        label: dto.label,
        lat: dto.lat,
        lon: dto.lon,
        utc: new Date(dto.utc),
        hsys: dto.hsys ?? 'P',
      },
    });
  }

  async listBirth() {
    return this.prisma.birthData.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
