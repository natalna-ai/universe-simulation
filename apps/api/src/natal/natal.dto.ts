import { IsArray, IsIn, IsISO8601, IsNumber, IsString, Max, Min } from 'class-validator';
import { ALL_BODY_IDS } from '@natalna/ephemeris-core';
import type { BodyId, HouseSystem } from '@natalna/ephemeris-core';

export class NatalComputeDto {
  @IsISO8601()
  utc!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lon!: number;

  @IsString()
  @IsIn(['P', 'K', 'R', 'C', 'O', 'E', 'W', 'B', 'T', 'M', 'X', 'G'])
  hsys!: HouseSystem;

  @IsArray()
  @IsIn(ALL_BODY_IDS, { each: true })
  bodies!: BodyId[];
}
