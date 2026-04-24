import { Body, Controller, Get, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SaveBirthDataDto } from './sessions.dto';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}

  @Post('birth')
  async saveBirth(@Body() dto: SaveBirthDataDto) {
    try {
      return await this.svc.saveBirth(dto);
    } catch (err) {
      return { error: 'database_unavailable', message: (err as Error).message };
    }
  }

  @Get('birth')
  async listBirth() {
    try {
      return await this.svc.listBirth();
    } catch {
      return [];
    }
  }
}
